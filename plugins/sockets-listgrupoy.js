import ws from "ws"

const handler = async (m, { conn, usedPrefix }) => {
  try {
    if (conn !== global.conn) return  // Solo Bot Principal

    // Reacción 🤔
    await conn.sendMessage(m.chat, { react: { text: "🤔", key: m.key } })

    // Detectar todos los bots conectados
    const bots = [
      { bot: global.conn, name: "Bot Principal" },
      ...(global.conns || [])
        .filter(b => b.user && b.ws?.socket && b.ws.socket.readyState !== ws.CLOSED)
        .map((b, i) => ({ bot: b, name: `Sub-Bot ${i + 1}` }))
    ]

    // Función para refrescar los grupos de un bot y esperar a que cargue
    async function refreshGroups(bot) {
      try {
        const chatIds = Object.keys(bot.store?.chats || bot.chats || {}).filter(jid => jid.endsWith("@g.us"))
        const grupos = []

        for (let jid of chatIds) {
          try {
            const meta = await bot.groupMetadata(jid)
            grupos.push({ id: jid, subject: meta.subject, count: meta.participants?.length || 0 })
          } catch {
            grupos.push({ id: jid, subject: jid, count: 0 })
          }
        }
        bot._cachedGroups = grupos
      } catch (e) {
        console.error("Error refrescando grupos:", bot.user?.jid, e)
        bot._cachedGroups = []
      }
    }

    // Esperar que todos los bots terminen el refresh
    for (let { bot } of bots) {
      await refreshGroups(bot)
    }

    // Construir mensaje de cada bot
    const infoBots = bots.map(({ bot, name }) => {
      const grupos = bot._cachedGroups || []
      const numero = bot.user?.jid?.replace(/[^0-9]/g, "") || "Desconocido"
      return `*${name}*\n\n📱 Número: @${numero}\n👥 Grupos: *${grupos.length}*\n\n${
        grupos.length ? grupos.map(g => `  • ${g.subject} (${g.count})`).join("\n") : "  • No está en ningún grupo"
      }`
    })

    // Mensaje final
    const texto = `*「 ✦ 」 Lista de bots y sus grupos*\n\n${infoBots.join("\n\n──────────────────\n\n")}`

    // Menciones a todos los bots conectados
    const menciones = bots.filter(b => b.bot.user?.jid).map(b => b.bot.user.jid)

    await conn.sendMessage(m.chat, { text: texto, mentions: menciones }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply(`⚠︎ Error al listar los grupos y subbots.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`)
  }
}

handler.help = ["gruposcompletos"]
handler.tags = ["serbot"]
handler.command = ["gruposcompletos", "subbotsgrupos"]
handler.owner = true

export default handler