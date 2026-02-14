process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import './plugins/_allfake.js'
import { displayLogo } from './lib/logo.js' // Sistema visual externo
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn, execSync } from 'child_process'
import lodash from 'lodash'
import { yukiJadiBot } from './plugins/sockets-serbot.js'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'
const { proto } = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
import readline, { createInterface } from 'readline'
import NodeCache from 'node-cache'

const { CONNECTING } = ws
const { chain } = lodash
const PORT = 3001

// --- INICIO VISUAL ---
displayLogo() // Llama al diseño de lib/logo.js

protoType()
serialize()

if (!existsSync("./tmp")) {
  mkdirSync("./tmp");
}

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
return createRequire(dir)
}
global.timestamp = { start: new Date() }
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./-]')

// --- BASE DE DATOS ---
global.db = new Low(new JSONFile(path.join(__dirname, 'database', 'db.json')));
global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) {
return new Promise((resolve) => setInterval(async function () {
if (!global.db.READ) {
clearInterval(this)
resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
}}, 1 * 1000))
}
if (global.db.data !== null) return
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
global.db.data = {
users: {},
chats: {},
settings: {},
...(global.db.data || {}),
}
global.db.chain = chain(global.db.data)
}
loadDatabase()

// --- AUTENTICACIÓN ---
const sessionPath = global.sessions || 'session'
const { state, saveState, saveCreds } = await useMultiFileAuthState(sessionPath)
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const { version } = await fetchLatestBaileysVersion()

let phoneNumber = global.botNumber
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) opcion = '1'
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${sessionPath}/creds.json`)) {
    do {
        opcion = await question(chalk.bold.yellow("Seleccione una opción de Empire:\n") + chalk.magentaBright("1. Con código QR\n") + chalk.whiteBright("2. Con código de texto (Pairing Code)\n--> "))
    } while (opcion !== '1' && opcion !== '2')
}

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: opcion == '1' || methodCodeQR,
    browser: ["Empire-MD", "Safari", "2.0.0"],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    version,
    msgRetryCounterCache,
    userDevicesCache,
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on("creds.update", saveCreds)

// --- PAIRING CODE LOGIC ---
if (!fs.existsSync(`./${sessionPath}/creds.json`)) {
    if (opcion === '2' || methodCode) {
        if (!conn.authState.creds.registered) {
            let addNumber = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : ''
            if (!addNumber) {
                addNumber = await question(chalk.bgBlack(chalk.bold.yellowBright(`\n[ 👑 ] Ingrese el número del Imperio (ej: 503...):\n---> `)))
                addNumber = addNumber.replace(/\D/g, '')
            }
            setTimeout(async () => {
                let codeBot = await conn.requestPairingCode(addNumber)
                codeBot = codeBot.match(/.{1,4}/g)?.join("-") || codeBot
                console.log(chalk.bold.white(chalk.bgYellow(`\n[ 👑 ] Tu Código de Vinculación es:`)), chalk.bold.yellow(codeBot))
            }, 3000)
        }
    }
}

// --- HANDLERS & EVENTS ---
async function connectionUpdate(update) {
    const { connection, lastDisconnect } = update
    if (connection === "open") {
        console.log(chalk.yellow.bold(`\n[ 👑 ] IMPERIO CONECTADO: ${conn.user.name || 'Bot'}`))
        await joinChannels(conn)
    }
    if (connection === "close") {
        let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
        if (reason !== DisconnectReason.loggedOut) {
            console.log(chalk.yellow("→ Reconectando al Imperio..."))
            await global.reloadHandler(true)
        }
    }
}

global.reloadHandler = async function (restatConn) {
    let handler = await import(`./handler.js?update=${Date.now()}`)
    if (restatConn) {
        try { global.conn.ws.close() } catch { }
        global.conn = makeWASocket(connectionOptions)
    }
    conn.handler = handler.handler.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)

    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)
    return true
}

// --- INICIO DE PLUGINS Y MANTENIMIENTO ---
const pluginFolder = join(__dirname, './plugins')
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = global.__filename(join(pluginFolder, filename))
            const module = await import(file)
            global.plugins[filename] = module.default || module
        } catch (e) {
            console.error(e)
        }
    }
}

filesInit().then(() => console.log(chalk.greenBright('👑 Plugins del Imperio listos.')))
watch(pluginFolder, (ev, filename) => global.reload(ev, filename))
await global.reloadHandler()

// Limpieza de TMP cada 30 segundos
setInterval(async () => {
    if (existsSync('./tmp')) {
        const files = readdirSync('./tmp')
        files.forEach(f => unlinkSync(join('./tmp', f)))
    }
}, 30000)

async function joinChannels(sock) {
    for (const value of Object.values(global.ch || {})) {
        if (value.endsWith('@newsletter')) await sock.newsletterFollow(value).catch(() => {})
    }
}
