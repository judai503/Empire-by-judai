let handler = async (m, { conn, text, participants }) => {

    if (!m.isGroup) return
    if (!participants || participants.length === 0) return

    // 🧠 Detectar texto usable
    let baseText =
        text ||
        m.quoted?.text ||
        m.quoted?.caption ||
        m.quoted?.msg?.caption ||
        ''

    // 😂 Si no hay texto NI reply
    if (!baseText && !m.quoted) {
        return m.reply('🤡 Pon un texto después de *.n*, idiota, no soy adivino.')
    }

    // Todos los usuarios
    let users = participants.map(u => conn.decodeJid(u.id))

    // 🌟 Marca de agua
    const marca = `\n\n━━━━━━━━━━━━━━━━━━━━\n🤖 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐄𝐥 𝐓í𝐨 𝐉𝐮𝐝𝐚𝐢\n⚠️ 𝐁𝐨𝐭 𝐆𝐫𝐚𝐭𝐢𝐬 • 𝐕𝐞𝐧𝐭𝐚 𝐏𝐫𝐨𝐡𝐢𝐛𝐢𝐝𝐚\n━━━━━━━━━━━━━━━━━━━━`

    let finalText = baseText ? (baseText + marca) : marca

    // Si responde a algo
    if (m.quoted) {
        let q = m.quoted
        let mime = (q.msg || q).mimetype || ''

        if (/image/.test(mime)) {
            let img = await q.download()
            return await conn.sendMessage(m.chat, {
                image: img,
                caption: finalText || marca,
                mentions: users
            }, { quoted: null })
        }

        if (/video/.test(mime)) {
            let vid = await q.download()
            return await conn.sendMessage(m.chat, {
                video: vid,
                caption: finalText || marca,
                mentions: users
            }, { quoted: null })
        }

        if (/audio/.test(mime)) {
            let aud = await q.download()
            return await conn.sendMessage(m.chat, {
                audio: aud,
                mimetype: 'audio/mp4',
                fileName: 'Aviso.mp3',
                mentions: users
            }, { quoted: null })
        }

        if (/sticker/.test(mime)) {
            let sti = await q.download()
            return await conn.sendMessage(m.chat, {
                sticker: sti,
                mentions: users
            }, { quoted: null })
        }
    }

    // Solo texto
    await conn.sendMessage(m.chat, {
        text: finalText,
        mentions: users
    }, { quoted: null })
}

handler.help = ['n <texto>']
handler.tags = ['grupo']
handler.command = ['n', 'notificar', 'notify', 'aviso', 'tag', 'hidetag']
handler.group = true
handler.admin = true

export default handler
