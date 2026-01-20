process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import fs, { existsSync, mkdirSync } from 'fs'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import Pino from 'pino'
import NodeCache from 'node-cache'
import readline from 'readline'
import chalk from 'chalk'
import { Low, JSONFile } from 'lowdb'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'

protoType()
serialize()

if (!existsSync('./Imperio/src/database')) {
  mkdirSync('./Imperio/src/database', { recursive: true })
}

global.db = new Low(new JSONFile('./Imperio/src/database/database.json'))
global.loadDatabase = async () => {
  await global.db.read()
  global.db.data ||= { users: {}, chats: {}, settings: {} }
}
await loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const msgRetryCounterCache = new NodeCache()
const { version } = await fetchLatestBaileysVersion()

const conn = makeWASocket({
  logger: Pino({ level: 'silent' }),
  printQRInTerminal: true,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }))
  },
  msgRetryCounterCache,
  version
})

conn.ev.on('creds.update', saveCreds)

conn.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update
  if (connection === 'open') console.log(chalk.green('👑 EMPIRE CONECTADO'))
  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    console.log(chalk.red('⚠️ Conexión cerrada'), reason)
    process.exit(1)
  }
})

let handler = await import('./handler.js')
conn.ev.on('messages.upsert', async (m) => handler.default(m, conn))

console.log(chalk.yellow('👑 SISTEMA IMPERIO INICIADO'))
