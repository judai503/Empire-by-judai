var handler = async (m, { conn }) => {
    let group = m.chat

    // Revocar el link actual y generar uno nuevo
    await conn.groupRevokeInvite(group)
    const newLink = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)

    // Obtener foto de perfil del grupo o fallback
    const pp = await conn.profilePictureUrl(group, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg')

    // Mensaje decorado
    const message = `
✨━━━━━━━━━━━━━━━━✨
      *⚡ RESTABLECER LINK ⚡*
✨━━━━━━━━━━━━━━━━✨

🎯 *Grupo:* ${await conn.groupMetadata(group).then(g => g.subject)}
👤 *Restablecido por:* @${m.sender.split('@')[0]}

🔗 *Nuevo Link del Grupo:*
${newLink}

✨━━━━━━━━━━━━━━━━✨
    `

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
