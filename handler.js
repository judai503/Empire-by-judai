import fs from 'fs'; 
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { config, isOwner } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const plugins = {}; 

/**
 * Carga de Plugins con Auto-Reload
 */
export async function loadPlugins() {
    const pluginFolder = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder, { recursive: true });
    
    const files = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));
    
    for (let key in plugins) delete plugins[key];

    for (const file of files) {
        try {
            const pluginPath = `./plugins/${file}?update=${Date.now()}`;
            const module = await import(pluginPath);
            plugins[file] = module.default || module;
        } catch (e) {
            console.error(chalk.red(`[ERROR PLUGIN: ${file}]`), e);
        }
    }
    console.log(chalk.cyan(`━━━ [SISTEMA: ${Object.keys(plugins).length} PLUGINS] ━━━`));
}

/**
 * Handler Maestro
 */
export async function handler(conn, m) {
    try {
        if (!m || !m.message) return;

        const type = Object.keys(m.message)[0];
        const msg = m.message[type];
        
        let body = (type === 'conversation') ? m.message.conversation :
                   (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text :
                   (type === 'imageMessage' || type === 'videoMessage') ? msg.caption :
                   (type === 'buttonsResponseMessage') ? msg.selectedButtonId :
                   (type === 'listResponseMessage') ? msg.singleSelectReply.selectedRowId :
                   (type === 'templateButtonReplyMessage') ? msg.selectedId :
                   (m.quoted?.text) ? m.quoted.text : '';

        if (!body) return;

        // --- IDENTIFICACIÓN DEL BOT ---
        m.chat = m.key.remoteJid;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.key.participant || m.key.remoteJid;
        
        // Obtenemos el ID real del bot logueado
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // El bot siempre es dueño de sus acciones
        m.isOwner = isOwner(m.sender) || m.sender === botJid;
        
        m.reply = (txt) => conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: [m.sender]
        }, { quoted: m });

        // --- AUTO-DETECCIÓN DE RANGOS ---
        if (m.isGroup) {
            const groupMetadata = await conn.groupMetadata(m.chat).catch(() => ({}));
            const participants = groupMetadata.participants || [];
            const admins = participants.filter(p => p.admin).map(p => p.id);
            
            // EL BOT SIEMPRE ES ADMIN PARA SÍ MISMO (Bypass)
            m.isAdmin = admins.includes(m.sender) || m.sender === botJid || m.isOwner;
            m.botIsAdmin = admins.includes(botJid);
            m.groupMetadata = groupMetadata;
        }

        // --- PROCESAMIENTO DE COMANDOS ---
        const prefixMatch = body.trim().match(config.prefix);
        if (!prefixMatch) return;

        const usedPrefix = prefixMatch[0];
        const textAfterPrefix = body.replace(usedPrefix, '').trim();
        const args = textAfterPrefix.split(/ +/).filter(v => v);
        const command = args.shift()?.toLowerCase();
        const fullText = args.join(' ');

        for (const name in plugins) {
            const plugin = plugins[name];
            if (!plugin || !plugin.command) continue;

            const isMatch = Array.isArray(plugin.command) 
                ? plugin.command.includes(command) 
                : (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command);

            if (isMatch) {
                // Si es el BOT, se saltan las restricciones de admin
                if (plugin.admin && !m.isAdmin) return m.reply(config.msgs.admin);
                if (plugin.rowner && !m.isOwner) return m.reply(config.msgs.owner);
                if (plugin.group && !m.isGroup) return m.reply(config.msgs.group);

                try {
                    await plugin.run(conn, m, { 
                        args, 
                        text: fullText, 
                        command, 
                        usedPrefix,
                        groupMetadata: m.groupMetadata
                    });
                    console.log(chalk.green(`[OK] ${command} | ${m.sender.split('@')[0]}`));
                } catch (err) {
                    console.error(chalk.red(`[FALLO EN PLUGIN: ${name}]`), err);
                    m.reply(config.msgs.error);
                }
                break; 
            }
        }
    } catch (e) {
        console.error(chalk.red('[ERROR CRÍTICO HANDLER]:'), e);
    }
}
