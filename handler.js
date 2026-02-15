import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { config } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handler(conn, m) {
    try {
        if (!m.message) return;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
        
        // Verificamos si empieza con el prefijo
        if (!config.prefix.test(body)) return;

        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const command = body.trim().split(/ +/)[0].toLowerCase().replace(config.prefix, '');

        m.chat = m.key.remoteJid;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.key.participant || m.key.remoteJid;
        
        m.reply = async (text) => {
            return conn.sendMessage(m.chat, { text: text }, { quoted: m });
        };

        const pluginFolder = path.join(__dirname, 'plugins');
        const files = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const module = await import(`file://${path.join(pluginFolder, file)}?update=${Date.now()}`);
                const plugin = module.default || module;

                if (!plugin) continue;

                // Verificación del comando (Hacemos que acepte Strings o Arrays)
                const cmdProp = plugin.command;
                let isMatch = false;
                if (cmdProp instanceof RegExp) isMatch = cmdProp.test(command);
                else if (Array.isArray(cmdProp)) isMatch = cmdProp.includes(command);
                else isMatch = cmdProp === command;

                if (isMatch) {
                    console.log(chalk.bgGreen.black(`[OK]`) + chalk.green(` Ejecutando: ${command} desde ${file}`));
                    
                    // EJECUCIÓN SEGURA
                    if (typeof plugin === 'function') {
                        await plugin(m, { conn, text, args, command, isGroup: m.isGroup });
                    } else if (plugin.run && typeof plugin.run === 'function') {
                        await plugin.run(conn, m, { args, text, command });
                    } else {
                        console.log(chalk.yellow(`[!] El plugin ${file} no tiene una función ejecutable clara.`));
                    }
                    return;
                }
            } catch (e) {
                console.error(chalk.red(`Error en plugin ${file}:`), e);
            }
        }
    } catch (e) {
        console.error(chalk.red('Error en Handler Central:'), e);
    }
}
