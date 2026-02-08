import WAMessageStubType from '@whiskeysockets/baileys'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

/* ================= BOT EMPIRE | MARCA ================= */
const MARCA = `
━━━━━━━━━━━━━━━━━━━━
🤖 𝗕𝗢𝗧 𝗘𝗠𝗣𝗜𝗥𝗘
⚡ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗝𝗨𝗗𝗔𝗜 ⚡
🚫 𝗣𝗥𝗢𝗛𝗜𝗕𝗜𝗗𝗔 𝗦𝗨 𝗩𝗘𝗡𝗧𝗔
━━━━━━━━━━━━━━━━━━━━
`

/* ================= MENSAJES ================= */
const MSG = {
  nombre: (u, n) => `${MARCA}

╭─「 📛 𝗚𝗥𝗨𝗣𝗢 𝗔𝗖𝗧𝗨𝗔𝗟𝗜𝗭𝗔𝗗𝗢 」─╮
│ 👤 Usuario: @${u}
│ 📝 Nuevo nombre:
│ ➤ ${n}
╰─ ✦ BOT EMPIRE ✦ ─╯`,

  foto: u => `${MARCA}

╭─「 🖼️ 𝗜𝗠𝗔𝗚𝗘𝗡 𝗔𝗖𝗧𝗨𝗔𝗟𝗜𝗭𝗔𝗗𝗔 」─╮
│ 👤 Acción realizada por:
│ ➤ @${u}
╰─ ✦ BOT EMPIRE ✦ ─╯`,

  link: u => `${MARCA}

╭─「 🔗 𝗘𝗡𝗟𝗔𝗖𝗘 𝗥𝗘𝗦𝗧𝗔𝗕𝗟𝗘𝗖𝗜𝗗𝗢 」─╮
│ 👤 Acción realizada por:
│ ➤ @${u}
│ ⚠️ El enlace anterior fue invalidado
╰─ ✦ BOT EMPIRE ✦ ─╯`,

  config: (u, m) => `${MARCA}

╭─「 ⚙️ 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗖𝗜𝗢́𝗡 」─╮
│ 👤 Modificado por: @${u}
│ 🔧 Permisos:
│ ➤ ${m == 'on' ? '𝗦𝗼𝗹𝗼 𝗮𝗱𝗺𝗶𝗻𝘀' : '𝗧𝗼𝗱𝗼𝘀'}
╰─ ✦ BOT EMPIRE ✦ ─╯`,

  estado: (u, m) => `${MARCA}

╭─「 ${m == 'on' ? '🔒 𝗚𝗥𝗨𝗣𝗢 𝗖𝗘𝗥𝗥𝗔𝗗𝗢' : '🔓 𝗚𝗥𝗨𝗣𝗢 𝗔𝗕𝗜𝗘𝗥𝗧𝗢'} 」─╮
│ 👤 Acción: @${u}
│ 💬 Mensajes:
│ ➤ ${m == 'on' ? '𝗦𝗼𝗹𝗼 𝗮𝗱𝗺𝗶𝗻𝘀' : '𝗧𝗼𝗱𝗼𝘀'}
╰─ ✦ BOT EMPIRE ✦ ─╯`,

  admin: (u, t) => `${MARCA}

╭─「 👑 𝗡𝗨𝗘𝗩𝗢 𝗔𝗗𝗠𝗜𝗡 」─╮
│ 🙋 Usuario: @${t}
│ 👤 Asignado por: @${u}
╰─ ✦ BOT EMPIRE ✦ ─╯`,

  noadmin: (u, t) => `${MARCA}

╭─「 🚫 𝗔𝗗𝗠𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗜𝗗𝗢 」─╮
│ 🙋 Usuario: @${t}
│ 👤 Acción: @${u}
╰─ ✦ BOT EMPIRE ✦ ─╯`
}

/* ================= HANDLER ================= */
const lidCache = new Map()
const handler = m => m

handler.before = async function (m, { conn, participants }) {
  if (!m.isGroup || !m.messageStubType) return

  const chat = global.db.data.chats[m.chat]
  if (!chat?.detect) return

  if (chat.primaryBot && conn.user.jid !== chat.primaryBot) throw !1

  const actor = await resolveLid(m.sender, conn, m.chat)
  const target = m.messageStubParameters?.[0]
  const admins = participants.filter(p => p.admin).map(p => p.id)

  const actorTag = actor.split('@')[0]
  const targetTag = target?.split('@')[0]

  const mentionBase = [actor, ...admins].filter(Boolean)

  switch (m.messageStubType) {
    case 21:
      await conn.sendMessage(m.chat, {
        text: MSG.nombre(actorTag, target),
        mentions: mentionBase
      })
      break

    case 22:
      const pp = await conn.profilePictureUrl(m.chat, 'image')
        .catch(() => 'https://files.catbox.moe/llyo8i.jpg')
      await conn.sendMessage(m.chat, {
        image: { url: pp },
        caption: MSG.foto(actorTag),
        mentions: mentionBase
      })
      break

    case 23:
      await conn.sendMessage(m.chat, {
        text: MSG.link(actorTag),
        mentions: mentionBase
      })
      break

    case 25:
      await conn.sendMessage(m.chat, {
        text: MSG.config(actorTag, target),
        mentions: mentionBase
      })
      break

    case 26:
      await conn.sendMessage(m.chat, {
        text: MSG.estado(actorTag, target),
        mentions: mentionBase
      })
      break

    case 29:
      await conn.sendMessage(m.chat, {
        text: MSG.admin(actorTag, targetTag),
        mentions: [actor, target, ...admins].filter(Boolean)
      })
      break

    case 30:
      await conn.sendMessage(m.chat, {
        text: MSG.noadmin(actorTag, targetTag),
        mentions: [actor, target, ...admins].filter(Boolean)
      })
      break

    case 2:
      limpiarSesion(m.chat)
      break
  }
}

export default handler

/* ================= UTILIDADES ================= */
async function resolveLid(lid, conn, chat) {
  const jid = lid.toString()
  if (!jid.endsWith('@lid')) return jid
  if (lidCache.has(jid)) return lidCache.get(jid)

  const meta = await conn.groupMetadata(chat)
  for (const p of meta.participants) {
    const w = await conn.onWhatsApp(p.id)
    if (w?.[0]?.lid && w[0].lid === jid) {
      lidCache.set(jid, p.id)
      return p.id
    }
  }
  return jid
}

async function limpiarSesion(chat) {
  const id = chat.split('@')[0]
  const dir = `./${sessions}/`
  for (const f of await fs.promises.readdir(dir)) {
    if (f.includes(id)) {
      await fs.promises.unlink(path.join(dir, f))
      console.log(chalk.redBright('🧹 Sesión limpiada:'), f)
    }
  }
}
