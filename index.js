import { config } from './settings.js';
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise(res => rl.question(text, res));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessions);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
        },
        version
    });

    if (!conn.authState.creds.registered) {
        console.log(chalk.bold.magenta(`\n[📱] INICIANDO ${config.botName.toUpperCase()}`));
        const phoneNumber = await question(chalk.bgCyan.black.bold('\n Escribe tu número para dar el código: ') + '\n▶ ');
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        setTimeout(async () => {
            try {
                const code = await conn.requestPairingCode(cleanNumber);
                console.log(chalk.black(chalk.bgCyan(`\n TU CÓDIGO EMPIRE: `)), chalk.bold.white(code));
            } catch (err) {
                console.log(chalk.red('\n[!] Error al generar el código.'));
            }
        }, 3000);
    }

    conn.ev.on('creds.update', saveCreds);
    
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log(chalk.cyan.bold(`\n✅ ${config.botName.toUpperCase()} CONECTADO`));
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
    });

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const { handler } = await import(`./handler.js?update=${Date.now()}`);
        await handler(conn, m);
    });
}

startBot();
