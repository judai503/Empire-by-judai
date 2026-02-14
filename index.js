process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import { displayLogo } from './lib/logo.js'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, readdirSync, watch, unlinkSync } from 'fs'
import path, { join } from 'path'
import chalk from 'chalk'
import { Low, JSONFile } from 'lowdb'
import pino from 'pino'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import readline from 'readline'

displayLogo()
protoType()
serialize()

if (!existsSync("./tmp")) mkdirSync("./tmp")

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// --- BASE DE DATOS ---
global.db = new Low(new JSONFile(join(__dirname, 'database', 'db.json')))
global.loadDatabase = async function () {
    if (global.db.READ) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = { users: {}, chats: {}, settings: {}, ...(global.db.data || {}) }
}
loadDatabase()

// --- CONEXIÓN ---
const sessionPath = global.sessions || 'session/Principal'
const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
const { version } = await fetchLatestBaileysVersion()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (t) => new Promise((r) => rl.question(t, r))

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !fs.existsSync(`./${sessionPath}/creds.json`),
    browser: ["Empire-MD", "Safari", "2.0.0"],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    version
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on("creds.update", saveCreds)

// --- PAIRING CODE (Si no hay credenciales) ---
if (!fs.existsSync(`./${sessionPath}/creds.json`)) {
    const code = await question(chalk.yellow("¿Usar Pairing Code? (s/n): "))
    if (code.toLowerCase() === 's') {
        const num = await question(chalk.yellow("Introduce el número (ej: 503...): "))
        setTimeout(async () => {
            let pair = await conn.requestPairingCode(num.replace(/\D/g, ''))
            console.log(chalk.black.bgYellow(`[ CÓDIGO ]: ${pair}`))
        }, 3000)
    }
}

// --- RELOAD HANDLER ---
global.reloadHandler = async function (restatConn) {
    let handler = await import(`./handler.js?update=${Date.now()}`)
    conn.ev.on('messages.upsert', handler.handler.bind(global.conn))
    return true
}

await global.reloadHandler()
