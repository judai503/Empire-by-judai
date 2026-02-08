let handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command }) => {

if (!m.isGroup) return

// Inicializar chat si no existe
let chat = global.db.data.chats[m.chat]
if (!chat) global.db.data.chats[m.chat] = {}
if (!chat.emotag) chat.emotag = "ꕥ"

// ============================
// CONFIGURAR EMOJI POR GRUPO
// ============================
if (/^(setemoji|emotag)$/i.test(command)) {
  if (!isAdmin && !isOwner) return m.reply("❌ Solo admins pueden usar este comando")
  if (!args[0]) return m.reply("✳️ Usa: .setemoji 😈")

  chat.emotag = args[0]
  return m.reply(`✅ Emoji de menciones cambiado a: ${args[0]}`)
}

// ============================
// TAGALL / TODOS / INVOCAR
// ============================
if (/^(todos|invocar|tagall)$/i.test(command)) {
  if (!isAdmin && !isOwner) return m.reply("❌ Solo admins pueden usar este comando")

  let pesan = args.join(" ") || "Mensaje general"

  let oi = `*» MENSAJE :* ${pesan}`

  let teks = `*! 📢 MENCION GENERAL !*\n*👥 PARA ${participants.length} MIEMBROS*\n\n${oi}\n\n`

  // Footer Bot Empire
  teks += `━━━━━━━━━━━━━━━━━━━━\n`
  teks += `🤖 𝗕𝗢𝗧 𝗘𝗠𝗣𝗜𝗥𝗘\n`
  teks += `⚡ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗝𝗨𝗗𝗔𝗜 ⚡\n`
  teks += `🚫 𝗣𝗥𝗢𝗛𝗜𝗕𝗜𝗗𝗔 𝗦𝗨 𝗩𝗘𝗡𝗧𝗔\n`
  teks += `━━━━━━━━━━━━━━━━━━━━\n\n`

  // Menciones
  for (let mem of participants) {
    teks += `${chat.emotag} @${mem.id.split("@")[0]}\n`
  }

  return conn.sendMessage(m.chat, {
    text: teks,
    mentions: participants.map(a => a.id)
  })
}

}

handler.help = [
  'todos <texto>',
  'invocar <texto>',
  'tagall <texto>',
  'setemoji <emoji>',
  'emotag <emoji>'
]

handler.tags = ['grupo']
handler.command = /^(todos|invocar|tagall|setemoji|emotag)$/i
handler.admin = true
handler.group = true

export default handler
