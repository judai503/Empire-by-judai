let handler = async (m, { conn, participants, text, isAdmin }) => {
  if (!m.isGroup) return m.reply('❗ Este comando solo se puede usar en grupos.')
  if (!isAdmin) return m.reply('🛡️ Solo los administradores pueden usar este comando.')

  const chatData = global.db.data.chats[m.chat] || {}
  const groupEmoji = chatData.customEmoji || null // emoji personalizado si existe

  const metadata = await conn.groupMetadata(m.chat)
  const groupName = metadata.subject || 'Grupo'

  const messageText = text || (m.quoted ? m.quoted.text : 'Despierten')
  const total = participants.length

  // Lista de emojis variados
  const randomEmojis = [
    '🐒','🦁','🐯','🐸','🐼','🐧','🐤','🦉',
    '🍎','🍉','🍓','🍒','🍍','🥭','🍌','🍇',
    '🦖','🦕','🐲','🦄','🐢','🦊','🐺','🐮'
  ]

  let textToSend = `*${groupName}*\n\n`
  textToSend += `Mensaje: ${messageText}\n\n`
  textToSend += `*Integrantes: ${total}*\n\n`
  textToSend += '┌──⭓ *Despierten*\n'

  for (const user of participants) {
    const number = user.id.split('@')[0]
    // Si hay emoji configurado, úsalo. Si no, uno aleatorio
    const emoji = groupEmoji || randomEmojis[Math.floor(Math.random() * randomEmojis.length)]
    textToSend += `${emoji} @${number}\n`
  }

  textToSend += '└───────⭓\n\n'
  textToSend += '𝕬𝖘𝖔𝖈𝖎𝖆𝖈𝖎ó𝖓 𝕰𝖒𝖕𝖎𝖗𝖊 '

  await conn.sendMessage(m.chat, { text: textToSend, mentions: participants.map(u => u.id) }, { quoted: m })
}

handler.help = ['todos', 'invocar']
handler.tags = ['grupo']
handler.command = ['todos', 'invocar']
handler.group = true
handler.admin = true

export default handler