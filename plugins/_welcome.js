import { WAMessageStubType } from '@whiskeysockets/baileys'

function formatFecha(date = new Date()) {
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

async function generarBienvenida({ userIds, groupMetadata, chat }) {
    const mentions = userIds
    const usernames = userIds.map(u => `@${u.split('@')[0]}`).join(', ')

    // Texto: prioridad setwelcome > descripción
    let texto = null
    if (chat?.setwelcome) texto = chat.setwelcome.trim()
    else if (groupMetadata?.desc) texto = groupMetadata.desc.trim()

    if (!texto) return null

    const groupName = groupMetadata.subject || 'este grupo'
    const total = groupMetadata.participants?.length || 0
    const fecha = formatFecha()

    const caption = `
╭━━━━━━━━━━━━━━━━╮
┃ 🎉 ¡BIENVENID@! 🎉
╰━━━━━━━━━━━━━━━━╯

👤 Invitado(s): ${usernames}
🏠 Grupo: *${groupName}*
👥 Total: *${total} miembros*
📅 Fecha: *${fecha}*

╭━━━━━━━━━━━━━━━━━╮
┃📌 MENSAJE IMPORTANTE
╰━━━━━━━━━━━━━━━━━╯
${texto}

━━━━━━━━━━━━━━━━━━━━
🤖 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐄𝐥 𝐓í𝐨 𝐉𝐮𝐝𝐚𝐢
⚠️ 𝐁𝐨𝐭 𝐆𝐫𝐚𝐭𝐢𝐬 • 𝐕𝐞𝐧𝐭𝐚 𝐏𝐫𝐨𝐡𝐢𝐛𝐢𝐝𝐚
━━━━━━━━━━━━━━━━━━━━
`.trim()

    return { caption, mentions }
}

let handler = m => m

handler.before = async function (m, { conn, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return !0

    const chat = global.db.data.chats[m.chat]

    // Bot principal
    if (chat?.primaryBot && conn.user.jid !== chat.primaryBot) return !1

    // Welcome apagado
    if (!chat?.welcome) return !0

    // Usuario(s) añadidos
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        let userIds = []

        if (Array.isArray(m.messageStubParameters))
            userIds = m.messageStubParameters

        if (!userIds.length) return !0

        // Asegurar metadata actualizada
        if (!groupMetadata)
            groupMetadata = await conn.groupMetadata(m.chat)

        const bienvenida = await generarBienvenida({
            userIds,
            groupMetadata,
            chat
        })

        if (!bienvenida) return !0

        await conn.sendMessage(
            m.chat,
            {
                text: bienvenida.caption,
                mentions: bienvenida.mentions
            },
            { quoted: null }
        )
    }

    return !0
}

export default handler
