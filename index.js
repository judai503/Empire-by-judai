import { config } from './settings.js';
import { marca } from './lib/marca.js'; 
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs';
import { handler, loadPlugins } from './handler.js';
import readline from 'readline';

// ─── ESTADO GLOBAL ───
const welcomeBuffer = new Map();
const groupCache = new Map();
let isReconnecting = false;

const DB_PATH = './database/bienvenidas.json';
let welcomeDB = {};

// ─── HELPERS ───
if (fs.existsSync(DB_PATH)) {
  try {
    welcomeDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    welcomeDB = {};
  }
}

function saveWelcomeDB() {
  if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(welcomeDB, null, 2));
}

async function getGroupMetadata(conn, jid) {
  if (groupCache.has(jid)) return groupCache.get(jid);
  const data = await conn.groupMetadata(jid).catch(() => ({}));
  groupCache.set(jid, data);
  setTimeout(() => groupCache.delete(jid), 60_000);
  return data;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// ─── BOT ───
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

  // ─── VINCULACIÓN POR CÓDIGO ───
  if (!conn.authState.creds.registered) {
    console.log(chalk.yellow(`\n[!] NO SE DETECTÓ SESIÓN ACTIVA`));
    let phoneNumber = await question(chalk.cyan('➤ Escribe el número (ej: 50370000000): '));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    if (!/^\d{8,15}$/.test(phoneNumber)) {
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

  // ─── EVENTOS DE GRUPO (WELCOME FIX) ───
  conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      const data = welcomeDB[id] || { enabled: true };
      if (!data.enabled) return;

      const metadata = await getGroupMetadata(conn, id);

      if (action === 'add') {
        if (!welcomeBuffer.has(id)) {
          welcomeBuffer.set(id, { users: new Set(), timer: null });
        }

        const groupData = welcomeBuffer.get(id);

        participants.forEach(u => {
          const jid = typeof u === 'string' ? u : u.id;
          groupData.users.add(jid);
        });

        clearTimeout(groupData.timer);

        groupData.timer = setTimeout(async () => {
          const users = [...groupData.users];
          welcomeBuffer.delete(id);

          const tags = users.map(u => `@${u.split('@')[0]}`).join(', ');
          const txt = data.customText || `✨ *¡BIENVENIDOS AL GRUPO!* ✨\n\n${metadata?.desc || ''}`;

          const finalMsg = txt.includes('@user')
            ? txt.replace(/@user/g, tags)
            : `${tags}\n\n${txt}`;

          await conn.sendMessage(id, {
            text: `${finalMsg}\n\n${marca}`,
            mentions: users
          });
        }, 8000);

      } else if (action === 'remove') {
        for (const u of participants) {
          const jid = typeof u === 'string' ? u : u.id;

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

  // ─── HANDLER ───
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const m = messages[0];
    if (!m?.message || m.key.fromMe) return;
    await handler(conn, m);
  });

  // ─── CONEXIÓN ───
  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      isReconnecting = false;
      console.log(chalk.green.bold("\n🚀 EMPIRE BOT ONLINE"));
      console.log(chalk.cyan('[BOT]'), chalk.green('Conectado como'), chalk.yellow(conn.user?.id));
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      if (shouldReconnect && !isReconnecting) {
        isReconnecting = true;
        console.log(chalk.yellow('♻️ Reconectando bot...'));
        startBot();
      }
    }
  });
}

startBot();
