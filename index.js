import { config } from './settings.js';
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';
import { handler, loadPlugins } from './handler.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise(res => rl.question(text, res));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessions);
    const { version } = await fetchLatestBaileysVersion();

    // Cargamos plugins antes de conectar
    await loadPlugins();

    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        version
    });

    if (!conn.authState.creds.registered) {
        console.log(chalk.bold.magenta(`\n[📱] CONFIGURACIÓN DE PAREO`));
        const phoneNumber = await question(chalk.bgCyan.black.bold(' Escribe tu número (ej: 54911...): ') + '\n▶ ');
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        setTimeout(async () => {
            try {
                const code = await conn.requestPairingCode(cleanNumber);
                console.log(chalk.black(chalk.bgCyan(`\n TU CÓDIGO: `)), chalk.bold.white(code));
            } catch (err) {
                console.log(chalk.red('\n[!] Error al generar código. Intenta de nuevo.'));
            }
        }, 3000);
    }

    conn.ev.on('creds.update', saveCreds);
    
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log(chalk.cyan.bold(`\n✅ ${config.botName.toUpperCase()} EN LINEA`));
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        await handler(conn, m);
    });
}

// Prevenir cierres por errores inesperados
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

startBot();
