// ⚠️ ARCHIVO COMPLETO - handler.js - IMPERIO / EMPIRE

import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import { smsg } from '../lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import fs from 'fs'
import chalk from 'chalk'
import ws from 'ws'

const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

export async function handler(chatUpdate) {
  this.msgqueque ||= []
  this.uptime ||= Date.now()
  if (!chatUpdate) return
  this.pushMessage(chatUpdate.messages).catch(console.error)

  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return
  if (!global.db.data) await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) return
    global.mconn = m
    m.exp = 0
    m.monedas = false

    // ================= USUARIOS =================
    try {
      let user = global.db.data.users[m.sender]
      if (!user || typeof user !== 'object') global.db.data.users[m.sender] = user = {}

      Object.assign(user, {
        exp: isNumber(user.exp) ? user.exp : 0,
        monedas: isNumber(user.monedas) ? user.monedas : 10,
        diamond: isNumber(user.diamond) ? user.diamond : 3,
        health: isNumber(user.health) ? user.health : 100,
        level: isNumber(user.level) ? user.level : 0,
        bank: isNumber(user.bank) ? user.bank : 0,
        warn: isNumber(user.warn) ? user.warn : 0,
        registered: 'registered' in user ? user.registered : false,
        name: user.name || m.name,
        banned: 'banned' in user ? user.banned : false,
        premium: 'premium' in user ? user.premium : false,
        premiumTime: user.premium ? user.premiumTime || 0 : 0
      })

      let chat = global.db.data.chats[m.chat]
      if (!chat || typeof chat !== 'object') global.db.data.chats[m.chat] = chat = {}

      Object.assign(chat, {
        isBanned: 'isBanned' in chat ? chat.isBanned : false,
        welcome: 'welcome' in chat ? chat.welcome : true,
        detect: 'detect' in chat ? chat.detect : true,
        modoadmin: 'modoadmin' in chat ? chat.modoadmin : false
      })

      var settings = global.db.data.settings[this.user.jid] || {}
      Object.assign(settings, {
        self: 'self' in settings ? settings.self : false,
        restrict: 'restrict' in settings ? settings.restrict : true,
        autoread: 'autoread' in settings ? settings.autoread : false
      })
      global.db.data.settings[this.user.jid] = settings

    } catch (e) { console.error(e) }

    if (typeof m.text !== "string") m.text = ""

    const isROwner = global.owner.map(([n]) => n).includes(m.sender)
    const isOwner = isROwner || m.fromMe
    const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0

    if (m.isBaileys) return

    m.exp += Math.ceil(Math.random() * 10)

    let usedPrefix
    let _user = global.db.data.users[m.sender]

    const groupMetadata = m.isGroup ? await this.groupMetadata(m.chat).catch(() => null) : null
    const participants = m.isGroup && groupMetadata ? groupMetadata.participants : []
    const user = m.isGroup ? participants.find(u => u.id === m.sender) : {}
    const bot = m.isGroup ? participants.find(u => u.id === this.user.jid) : {}

    const isRAdmin = user?.admin === 'superadmin'
    const isAdmin = isRAdmin || user?.admin === 'admin'
    const isBotAdmin = !!bot?.admin

    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

    for (let name in global.plugins) {
      let plugin = global.plugins[name]
      if (!plugin || plugin.disabled) continue

      const __filename = join(___dirname, name)

      if (typeof plugin.all === 'function')
        await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename }).catch(console.error)

      let _prefix = plugin.customPrefix || global.prefix
      let match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] :
        Array.isArray(_prefix) ? _prefix.map(p => [p.exec(m.text), p]) :
        [[new RegExp(_prefix).exec(m.text), new RegExp(_prefix)]]
      ).find(p => p[1])

      if (!match) continue

      if ((usedPrefix = match[0][0])) {
        let noPrefix = m.text.replace(usedPrefix, '')
        let [command, ...args] = noPrefix.trim().split` `
        command = command.toLowerCase()

        let isAccept = plugin.command === command ||
          (Array.isArray(plugin.command) && plugin.command.includes(command)) ||
          (plugin.command instanceof RegExp && plugin.command.test(command))

        if (!isAccept) continue

        if (plugin.owner && !isOwner) return m.reply('❌ Solo el dueño.')
        if (plugin.premium && !isPrems) return m.reply('❌ Solo usuarios premium.')
        if (plugin.group && !m.isGroup) return m.reply('❌ Solo en grupos.')
        if (plugin.admin && !isAdmin) return m.reply('❌ Solo admins.')
        if (plugin.botAdmin && !isBotAdmin) return m.reply('❌ No soy admin.')

        try {
          await plugin.call(this, m, { args, command, usedPrefix })
        } catch (e) {
          console.error(e)
          m.reply(format(e))
        }
        break
      }
    }

  } catch (e) {
    console.error(e)
  }
}

// ================= RECARGA AUTOMÁTICA =================
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("♻️ Se actualizó handler.js"))
  import(`${file}?update=${Date.now()}`)
})
