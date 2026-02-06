import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const handler = async (m, { conn, text, command, args, usedPrefix, isROwner }) => {
if (!isROwner) return
try {
let who = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

switch (command) {
case 'backup': case 'copia': {
await m.react('🕒')
const date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
const databasePath = path.join(__dirname, '..', 'database', 'db.json')
const credsPath = path.join(__dirname, '..', 'Sessions', 'Principal', 'creds.json')
const database = await fs.promises.readFile(databasePath)
const creds = await fs.promises.readFile(credsPath)
await conn.reply(m.chat, `*• Fecha:* ${date}`, m)
await conn.sendMessage(m.sender, { document: database, mimetype: 'application/json', fileName: 'database.json' }, { quoted: m })
await conn.sendMessage(m.sender, { document: creds, mimetype: 'application/json', fileName: 'creds.json' }, { quoted: m })
await m.react('✔️')
break
}

case 'resetuser': case 'resetear': {
if (!who) return conn.reply(m.chat, `❀ Formato de usuario no reconocido.`, { quoted: m })
const userNumber = who.split('@')[0]
const userData = global.db.data.users?.[who]
if (!userData) return conn.reply(m.chat, `✧ El usuario @${userNumber} no se encuentra en mi base de datos.`, { quoted: m, mentions: [who] })

if (userData.characters) {
for (let id in userData.characters) {
if (userData.characters[id].user === who) delete userData.characters[id]
}}
if (userData.sales) {
for (let id in userData.sales) {
if (userData.sales[id].user === who) delete userData.sales[id]
}}
for (let id in global.db.data.users) {
if (global.db.data.users[id]?.marry === who) delete global.db.data.users[id].marry
}
delete global.db.data.users[who]
await global.db.write()
conn.reply(m.chat, `❀ Éxito. Todos los datos del usuario @${userNumber} fueron eliminados.`, { quoted: m, mentions: [who] })
break
}

case 'jadibot': case 'serbot': {
const value = text ? text.trim().toLowerCase() : ''
const type = 'jadibotmd'
const isEnable = bot[type] || false
const enable = value === 'enable' || value === 'on'
const disable = value === 'disable' || value === 'off'
if (enable || disable) {
if (isEnable === enable) return m.reply(`ꕥ El modo *${type}* ya estaba ${enable ? 'activado' : 'desactivado'}.`)
bot[type] = enable
return conn.reply(m.chat, `❀ Has *\( {enable ? 'activado' : 'desactivado'}* el modo * \){type}* para el Socket.`, m)
}
conn.reply(m.chat, `「✦」Puedes activar o desactivar el modo *${type}* utilizando:\n\n● Activar » \( {usedPrefix} \){command} enable\n● Desactivar » \( {usedPrefix} \){command} disable\n\nꕥ Estado actual » *${isEnable ? '✓ Activado' : '✗ Desactivado'}*`, m)
break
}
}
} catch (e) {
await m.react('✖️')
conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *\( {usedPrefix}report* para informarlo.\n\n \){e.stack || e}`, m)
}}

handler.help = ['backup', 'copia', 'resetuser', 'resetear', 'jadibot', 'serbot']
handler.tags = ['owner']
handler.command = /^(backup|copia|resetuser|resetear|jadibot|serbot)$/i
handler.rowner = true

export default handler