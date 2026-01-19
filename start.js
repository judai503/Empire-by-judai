process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import cluster from 'cluster'
const { setupMaster, fork } = cluster
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import yargs from 'yargs';
import { spawn } from 'child_process'
import lodash from 'lodash'
import { blackJadiBot } from '../plugins/jadibot-serbot.js';
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import { format } from 'util'
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from '../lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from '../lib/store.js'
const { proto } = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
import readline from 'readline'
import NodeCache from 'node-cache'
const { chain } = lodash

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url) {
  return fileURLToPath(pathURL)
}
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL))
}
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#/!.]')

global.db = new Low(new JSONFile('./src/database/database.json'))
global.loadDatabase = async function loadDatabase() {
  await global.db.read()
  global.db.data ||= { users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {} }
}
await loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const msgRetryCounterCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (q) => new Promise(res => rl.question(q, res))

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: true,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }))
  },
  msgRetryCounterCache,
  version,
}

global.conn = makeWASocket(connectionOptions)

conn.ev.on('creds.update', saveCreds)

conn.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update
  if (connection === 'open') {
    console.log(chalk.bold.green('\n👑 EMPIRE BOT CONECTADO ✔️'))
  }
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    console.log(chalk.red('⚠️ Conexión cerrada, reiniciando...'), reason)
    start()
  }
})

let handler = await import('./handler.js')
global.reloadHandler = async () => {
  const newHandler = await import(`./handler.js?update=${Date.now()}`)
  handler = newHandler.default || newHandler
}

conn.ev.on('messages.upsert', async (m) => {
  await handler.default(m, conn)
})


// ================== RUTA IMPERIO JADIBOT ==================
global.rutaJadiBot = join(__dirname, '../imperio/blackJadiBot')

if (!existsSync(global.rutaJadiBot)) {
  mkdirSync(global.rutaJadiBot, { recursive: true })
  console.log(chalk.cyan('📁 Carpeta imperio/blackJadiBot creada'))
}

// ================== BIO ==================
setInterval(async () => {
  if (!conn || !conn.user) return
  const uptime = Math.floor(process.uptime())
  const bio = `👑 Empire-MD | Activo: ${uptime}s`
  await conn.updateProfileStatus(bio).catch(() => {})
}, 60000)

console.log(chalk.bold.yellow('👑 SISTEMA IMPERIO INICIADO'))
