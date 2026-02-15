import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { config } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handler(conn, m) {
    try {
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
        if (!config.prefix.test(body)) return;

        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const command = body.trim().split(/ +/)[0].toLowerCase().replace(config.prefix, '');

        // --- PARCHE DE COMPATIBILIDAD ---
        m.chat = m.key.remoteJid;
        m.isGroup = m.chat.endsWith('@g.us');
        // Esto arregla el error "m.reply is not a function"
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

                const cmdProp = plugin.command;
                const isMatch = cmdProp instanceof RegExp ? cmdProp.test(command) : 
                                (Array.isArray(cmdProp) ? cmdProp.includes(command) : cmdProp === command);

                if (isMatch) {
                    console.log(chalk.green(`[EMPIRE] Comando ejecutado: ${command}`));
                    
                    if (typeof plugin === 'function') {
                        await plugin(m, { conn, text, args, command, isGroup: m.isGroup });
                    } else if (typeof plugin.run === 'function') {
                        await plugin.run(conn, m, { args, text, command });
                    }
                    return;
                }
            } catch (e) {
                console.error(chalk.red(`Error en plugin ${file}:`), e.message);
            }
        }
    } catch (e) {
        console.error(chalk.red('Error en Handler:'), e);
    }
}
