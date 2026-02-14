import './settings.js'
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import cfonts from 'cfonts'
import chalk from 'chalk'
import { Low, JSONFile } from 'lowdb'
import { join } from 'path'

// Logo
cfonts.say('EMPIRE-MD', { font: 'block', align: 'center', colors: ['yellow'] })

// Base de Datos
global.db = new Low(new JSONFile('database.json'))
await global.db.read()
global.db.data ||= { users: {}, chats: {}, settings: {} }

async function startEmpire() {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
    const { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['Empire-MD', 'Safari', '2.0.0'],
        version
    })

    conn.ev.on('creds.update', saveCreds)
    conn.ev.on('connection.update', (up) => {
        const { connection } = up
        if (connection === 'open') console.log(chalk.greenBright('👑 Imperio Conectado exitosamente'))
    })

    conn.ev.on('messages.upsert', async (m) => {
        const { handler } = await import('./handler.js')
        handler(conn, m)
    })
}

startEmpire()
