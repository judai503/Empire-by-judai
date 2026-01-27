// Adaptado para Empire Bot
import { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from "@whiskeysockets/baileys"
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from "pino"
import chalk from "chalk"
import * as ws from "ws"
import { makeWASocket } from '../lib/simple.js'

const maxSubBots = 324
let vegetaJBOptions = {}
if (!global.conns) global.conns = []

function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60)
    minutes = (minutes < 10) ? '0' + minutes : minutes
    seconds = (seconds < 10) ? '0' + seconds : seconds
    return minutes + ' m y ' + seconds + ' s '
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    // Comprobar si el comando está habilitado en Empire
    if (!globalThis.db.data.settings[conn.user.jid].jadibotmd) {
        return m.reply(`El comando *${command}* está desactivado temporalmente.`)
    }

    // Cooldown de 2 minutos por usuario
    let cooldown = global.db.data.users[m.sender].Subs + 120000
    if (Date.now() - global.db.data.users[m.sender].Subs < 120000) {
        return conn.reply(m.chat, `⏳ Debes esperar ${msToTime(cooldown - Date.now())} para volver a vincular un *Sub-Bot.*`, m)
    }

    const subBots = global.conns.filter(c => c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED)
    const subBotsCount = subBots.length
    if (subBotsCount >= maxSubBots) {
        return m.reply(`❌ No hay espacios disponibles para Sub-Bots.`)
    }

    const availableSlots = maxSubBots - subBotsCount
    let who = m.mentionedJid?.[0] || m.fromMe ? conn.user.jid : m.sender
    let id = who.split('@')[0]
    let pathvegetaJadiBot = path.join(`./vegetaJadiBot/`, id)

    if (!fs.existsSync(pathvegetaJadiBot)) fs.mkdirSync(pathvegetaJadiBot, { recursive: true })

    vegetaJBOptions = { pathvegetaJadiBot, m, conn, args, usedPrefix, command, fromCommand: true }
    await vegetaJadiBot(vegetaJBOptions)

    global.db.data.users[m.sender].Subs = Date.now()
}

handler.help = ['qr', 'code']
handler.tags = ['jadibot']
handler.command = ['qr', 'code']

export default handler

// Función principal del Sub-Bot
export async function vegetaJadiBot(options) {
    let { pathvegetaJadiBot, m, conn, args, usedPrefix, command } = options
    const pathCreds = path.join(pathvegetaJadiBot, "creds.json")
    if (!fs.existsSync(pathvegetaJadiBot)) fs.mkdirSync(pathvegetaJadiBot, { recursive: true })

    // Guardar credenciales si vienen en base64
    try {
        if (args[0]) fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'))
    } catch {
        conn.reply(m.chat, `⚠️ Usa correctamente el comando » ${usedPrefix + command}`, m)
        return
    }

    const { version } = await fetchLatestBaileysVersion()
    const { state, saveState, saveCreds } = await useMultiFileAuthState(pathvegetaJadiBot)
    const msgRetry = () => {}
    const msgRetryCache = new NodeCache()

    const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        msgRetry,
        msgRetryCache,
        browser: Browsers.macOS("Chrome"),
        version,
        generateHighQualityLinkPreview: true
    }

    let sock = makeWASocket(connectionOptions)
    sock.isInit = false

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update
        if (isNewLogin) sock.isInit = false

        // Mostrar QR temporal solo en chat de origen
        if (qr && m.chat) {
            const qrImg = await qrcode.toBuffer(qr, { scale: 8 })
            await conn.sendMessage(m.chat, { image: qrImg, caption: "📌 Escanea el QR para activar tu Sub-Bot temporal" }, { quoted: m })
            return
        }

        // Conexión abierta
        if (connection === 'open') {
            sock.isInit = true
            global.conns.push(sock)
            if (m.chat) await conn.sendMessage(m.chat, { text: `✅ Sub-Bot conectado correctamente!`, mentions: [m.sender] }, { quoted: m })
        }

        // Conexión cerrada
        if (connection === 'close') {
            sock.ev.removeAllListeners()
            const index = global.conns.indexOf(sock)
            if (index >= 0) global.conns.splice(index, 1)
            fs.rmdirSync(pathvegetaJadiBot, { recursive: true })
        }
    })

    sock.ev.on('creds.update', saveCreds)
}
