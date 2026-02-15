import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { config } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const plugins = {}; 

// Función para cargar plugins una sola vez
export async function loadPlugins() {
    const pluginFolder = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder);
    
    const files = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const module = await import(`./plugins/${file}?update=${Date.now()}`);
            plugins[file] = module.default || module;
        } catch (e) {
            console.error(chalk.red(`Error cargando ${file}:`), e);
        }
    }
    console.log(chalk.green(`[SISTEMA] ${Object.keys(plugins).length} Plugins cargados.`));
}

export async function handler(conn, m) {
    try {
        const messageType = Object.keys(m.message)[0];
        const body = (messageType === 'conversation') ? m.message.conversation : 
                     (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (messageType === 'imageMessage') ? m.message.imageMessage.caption : '';

        if (!config.prefix.test(body)) return;

        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const command = body.trim().split(/ +/)[0].toLowerCase().replace(config.prefix, '');

        // Formateo de objeto m para facilidad de uso en plugins
        m.chat = m.key.remoteJid;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.key.participant || m.key.remoteJid;
        m.reply = (txt) => conn.sendMessage(m.chat, { text: txt }, { quoted: m });

        // Buscamos el plugin en el objeto "plugins" en memoria
        for (const name in plugins) {
            const plugin = plugins[name];
            if (!plugin) continue;

            const cmdProp = plugin.command;
            const isMatch = Array.isArray(cmdProp) ? cmdProp.includes(command) : 
                          (cmdProp instanceof RegExp ? cmdProp.test(command) : cmdProp === command);

            if (isMatch) {
                // Validación de permisos simple
                if (plugin.rowner && m.sender !== config.owner) {
                    return m.reply('❌ Este comando es solo para mi creador.');
                }

                await plugin.run(conn, m, { args, text, command });
                console.log(chalk.bgGreen.black(`[EXEC]`) + ` ${command} | ${m.sender}`);
                break; 
            }
        }
    } catch (e) {
        console.error(chalk.red('Error en Handler:'), e);
    }
}
