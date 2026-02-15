import { config } from './settings.js'; // Corregido: 'import' en minúscula
import { marca } from './lib/marca.js'; 
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs';
import { handler, loadPlugins } from './handler.js';
import readline from 'readline';

const welcomeBuffer = new Map();
const DB_PATH = './database/bienvenidas.json';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessions);
    const { version } = await fetchLatestBaileysVersion();
    
    console.log(chalk.blue(`[SISTEMA] Iniciando Empire Bot...`));
    await loadPlugins();

    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu("Chrome"), 
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        version,
        generateHighQualityLinkPreview: true,
        printQRInTerminal: false 
    });

    // --- VINCULACIÓN POR CÓDIGO ---
    if (!conn.authState.creds.registered) {
        console.log(chalk.yellow(`\n[!] NO SE DETECTÓ SESIÓN ACTIVA`));
        let phoneNumber = await question(chalk.cyan('➤ Escribe el número (ej: 50370000000): '));
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

        if (!phoneNumber) {
            console.log(chalk.red('❌ Número inválido.'));
            process.exit(0);
        }

        setTimeout(async () => {
            try {
                let code = await conn.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(chalk.black(chalk.bgGreen(`\n TU CÓDIGO DE VINCULACIÓN `)));
                console.log(chalk.white(chalk.bgBlack(` >  ${code}  < \n`)));
            } catch (err) {
                console.error(chalk.red('Error al solicitar código:'), err);
            }
        }, 3000);
    }

    conn.ev.on('creds.update', saveCreds);

    // --- EVENTOS DE GRUPO (BIENVENIDAS) ---
    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            if (!fs.existsSync('./database')) fs.mkdirSync('./database');
            let db = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : {};
            const data = db[id] || { enabled: true };
            if (!data.enabled) return;

            const metadata = await conn.groupMetadata(id).catch(() => ({}));
            
            if (action === 'add') {
                if (!welcomeBuffer.has(id)) welcomeBuffer.set(id, { users: [], timer: null });
                const groupData = welcomeBuffer.get(id);
                participants.forEach(p => groupData.users.push(p));

                if (groupData.timer) clearTimeout(groupData.timer);
                
                groupData.timer = setTimeout(async () => {
                    const users = [...new Set(groupData.users)];
                    welcomeBuffer.delete(id);
                    const tags = users.map(u => `@${u.split('@')[0]}`).join(', ');
                    const txt = data.customText || `✨ *¡BIENVENIDOS AL GRUPO!* ✨\n\n${metadata.desc || ''}`;
                    const finalMsg = txt.includes('@user') ? txt.replace(/@user/g, tags) : `${tags}\n\n${txt}`;
                    
                    await conn.sendMessage(id, { 
                        text: `${finalMsg}\n\n${marca}`, 
                        mentions: users 
                    });
                }, 8000);

            } else if (action === 'remove') {
                for (let jid of participants) {
                    const txt = data.customBye || `👋 @user salió del grupo.`;
                    const finalMsg = txt.replace(/@user/g, `@${jid.split('@')[0]}`);
                    await conn.sendMessage(id, { 
                        text: `${finalMsg}\n\n${marca}`, 
                        mentions: [jid] 
                    });
                }
            }
        } catch (e) { 
            console.error(chalk.red('[ERROR EVENTO GRUPO]'), e); 
        }
    });

    // --- HANDLER DE MENSAJES ---
    conn.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        await handler(conn, m);
    });

    // --- CONEXIÓN ---
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.green.bold("\n🚀 EMPIRE BOT ONLINE"));
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });
}

startBot();
