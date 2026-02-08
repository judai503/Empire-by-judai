var handler = async (m, { conn }) => {
    let group = m.chat

    // Revocar el link actual y generar uno nuevo
    await conn.groupRevokeInvite(group)
    const newLink = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)

    // Obtener foto de perfil del grupo o fallback
    const pp = await conn.profilePictureUrl(group, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg')

    // Mensaje decorado (solo uno)
    const message = `
━━━━━━━━━━━━━━━━━━━━
🤖 𝗕𝗢𝗧 𝗘𝗠𝗣𝗜𝗥𝗘
⚡ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗝𝗨𝗗𝗔𝗜 ⚡
🚫 𝗣𝗥𝗢𝗛𝗜𝗕𝗜𝗗𝗔 𝗦𝗨 𝗩𝗘𝗡𝗧𝗔
━━━━━━━━━━━━━━━━━━━━

╭─「 🔗 𝗘𝗡𝗟𝗔𝗖𝗘 𝗥𝗘𝗦𝗧𝗔𝗕𝗟𝗘𝗖𝗜𝗗𝗢 」─╮
│ 👤 Acción realizada por:
│ ➤ @${m.sender.split('@')[0]}
│ ⚠️ El enlace anterior fue invalidado
│ 🔗 Nuevo Link:
│ ➤ ${newLink}
╰─ ✦ BOT EMPIRE ✦ ─╯
    `

    // Enviar mensaje con foto de perfil y mención al que restableció
    await conn.sendMessage(group, { 
        image: { url: pp }, 
        caption: message, 
        mentions: [m.sender] 
    })
}

handler.help = ['resetlink']
handler.tags = ['grupo']
handler.command = ['nlink', 'rlink', 'resetlink']
handler.group = true
handler.botAdmin = true

export default handler
