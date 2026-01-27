// Comando creado para Empire Bot
import { jidNormalizedUser } from "@whiskeysockets/baileys"

async function handler(m, { conn: empire, usedPrefix }) {
    const maxSubBots = 324
    const conns = Array.isArray(global.conns) ? global.conns : []

    const isConnOpen = (c) => {
        try {
            return c?.ws?.socket?.readyState === 1
        } catch {
            return !!c?.user?.id
        }
    }

    const unique = new Map()
    for (const c of conns) {
        if (!c || !c.user) continue
        if (!isConnOpen(c)) continue

        const jidRaw = c.user.jid || c.user.id || ''
        if (!jidRaw) continue

        unique.set(jidRaw, c)
    }

    const users = [...unique.values()]
    const totalUsers = users.length
    const availableSlots = Math.max(0, maxSubBots - totalUsers)

    const title = `⚡『 SUB-BOTS ONLINE 』⚡`

    let responseMessage = ''

    if (totalUsers === 0) {
        responseMessage = `╭━━━〔 *${title}* 〕━━━╮
┃ ⚡ Sub-Bots activos: *0*
┃ ❌ Nadie conectado todavía
┃ 📜 Espacios disponibles: *${availableSlots}*
╰━━━━━━━━━━━━━━━━━━━━━━╯

> 📌 Conéctate ahora y forma parte de la red Empire.`
    } else {
        const listado = users
            .map((v, i) => {
                const num = v.user.jid.replace(/[^0-9]/g, '')
                const nombre = v?.user?.name || v?.user?.pushName || '🌟 Sub-Bot'
                return `╭━━━〔 ⚡ SUB-BOT #${i + 1} 〕━━━╮
┃ 👤 Usuario: @${num}
┃ ⚡️ Nombre: ${nombre}
╰━━━━━━━━━━━━━━━━━━━━━━╯`
            })
            .join('\n\n')

        responseMessage = `╭━━━〔 *${title}* 〕━━━╮
┃ 📜 Total conectados: *${totalUsers}*
┃ ⚡ Espacios disponibles: *${availableSlots}*
╰━━━━━━━━━━━━━━━━━━━━━━╯

${listado}`.trim()
    }

    // Imagen opcional
    const imageUrl = 'https://files.catbox.moe/sq6q0q.jpg'

    // Contacto citado para estilo WhatsApp
    const fkontak = {
        key: {
            participants: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "Halo",
        },
        message: {
            contactMessage: {
                displayName: "SubBot",
                vcard: "BEGIN:VCARD\nVERSION:3.0\nN:;SubBot;;;\nFN:SubBot\nEND:VCARD",
            },
        },
    }

    const mentions = typeof empire.parseMention === 'function'
        ? empire.parseMention(responseMessage)
        : [...new Set(
            (responseMessage.match(/@(\d{5,16})/g) || []).map(v => v.replace('@', '') + '@s.whatsapp.net')
        )]

    try {
        await empire.sendMessage(
            m.chat,
            { image: { url: imageUrl }, caption: responseMessage, mentions },
            { quoted: fkontak }
        )
    } catch (e) {
        console.error('❌ Error enviando listado de subbots:', e)
        await empire.sendMessage(
            m.chat,
            { text: responseMessage, mentions },
            { quoted: fkontak }
        )
    }
}

handler.command = ['listjadibot', 'bots']
handler.help = ['listjadibot', 'bots']
handler.tags = ['jadibot']
export default handler
