import { config } from './settings.js';
import { marca } from './lib/marca.js'; 
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs';
import { handler, loadPlugins } from './handler.js';

let welcomeBuffer = {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessions);
    const { version } = await fetchLatestBaileysVersion();
    await loadPlugins();

    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        version
    });

    conn.ev.on('creds.update', saveCreds);

    // --- LÓGICA DE EVENTOS DE GRUPO ---
    conn.ev.on('group-participants.update', async (anu) => {
        try {
            const { id, participants, action } = anu;
            const metadata = await conn.groupMetadata(id);
            const dbPath = './database/bienvenidas.json';
            
            let db = {};
            if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            let data = db[id] || { enabled: true };

            if (data.enabled === false) return;

            if (action === 'add') {
                if (!welcomeBuffer[id]) welcomeBuffer[id] = [];
                participants.forEach(p => {
                    let jid = typeof p === 'string' ? p : p.id;
                    if (jid) welcomeBuffer[id].push(jid);
                });

                if (welcomeBuffer[id].timer) clearTimeout(welcomeBuffer[id].timer);

                welcomeBuffer[id].timer = setTimeout(async () => {
                    const users = [...new Set(welcomeBuffer[id])];
                    welcomeBuffer[id] = [];
                    const tags = users.map(u => `@${u.split('@')[0]}`).join(' ');
                    
                    let txt = data.customText || `✨ ¡BIENVENIDOS! ✨\n\n${metadata.desc || ''}`;
                    // Mención inteligente
                    let finalMsg = txt.includes('@user') ? txt.replace('@user', tags) : `${tags}\n\n${txt}`;
                    
                    await conn.sendMessage(id, { text: `${finalMsg}\n\n${marca}`, mentions: users });
                }, 5000);

            } else if (action === 'remove') {
                for (let num of participants) {
                    let jid = typeof num === 'string' ? num : num.id;
                    let txt = data.customBye || `👋 @user salió del grupo.`;
                    let finalMsg = txt.includes('@user') ? txt.replace('@user', `@${jid.split('@')[0]}`) : `@${jid.split('@')[0]}\n\n${txt}`;
                    
                    await conn.sendMessage(id, { text: `${finalMsg}\n\n${marca}`, mentions: [jid] });
                }
            }
        } catch (e) { console.error(e); }
    });

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        await handler(conn, m);
    });

    conn.ev.on('connection.update', (up) => {
        if (up.connection === 'open') console.log(chalk.green.bold("✅ EMPIRE BOT ONLINE"));
        if (up.connection === 'close') startBot();
    });
}
startBot();
