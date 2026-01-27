let handler = async (m, { text, isAdmin }) => {
    if (!m.isGroup) return
    if (!isAdmin) return m.reply('❌ Solo admins.')

    if (!text)
        return m.reply('✏️ Usa:\n.setwelcome texto de bienvenida')

    global.db.data.chats[m.chat].setwelcome = text
    m.reply('✅ Welcome configurado.')
}

handler.command = ['setwelcome']
handler.group = true
handler.admin = true

export default handler