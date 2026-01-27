import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import ws from "ws"
import { jidNormalizedUser, areJidsSameUser } from '@whiskeysockets/baileys'

const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

export async function handler(chatUpdate) {
    this.msgqueue = this.msgqueue || []
    this.uptime = this.uptime || Date.now()
    
    if (!chatUpdate) return
    await this.pushMessage(chatUpdate.messages).catch(console.error)
    
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return

    try {
        m = smsg(this, m) || m
        if (!m) return
        m.exp = 0

        if (typeof m.text !== "string") m.text = ""

        // No se requiere registro: no se inicializan usuarios ni chats manualmente
        const user = global.db.data.users[m.sender] || {}
        const chat = global.db.data.chats[m.chat] || {}
        const settings = global.db.data.settings?.[this.user.jid] || {}

        // Actualizar nombre del usuario
        try {
            const newName = m.pushName || await this.getName(m.sender)
            if (typeof newName === "string" && newName.trim()) {
                user.name = newName
            }
        } catch {}

        // Permisos
        const isROwner = [...global.owner].map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const isPrems = isROwner || global.prems.map(v => v.replace(/\D/g, "") + "@s.whatsapp.net").includes(m.sender) || user.premium
        const isOwners = [this.user.jid, ...global.owner.map(v => v + "@s.whatsapp.net")].includes(m.sender)

        // Self mode
        if (settings.self && !isOwners) return

        // Cola de mensajes
        if (global.opts?.queque && m.text && !isPrems) {
            const queue = this.msgqueue
            queue.push(m.id || m.key.id)
            setTimeout(() => {
                const index = queue.indexOf(m.id || m.key.id)
                if (index > -1) queue.splice(index, 1)
            }, 5000)
        }
        
        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)

        // Detectar administradores
        let groupMetadata = {}
        let participants = []
        if (m.isGroup) {
            groupMetadata = global.cachedGroupMetadata ?
                await global.cachedGroupMetadata(m.chat).catch(() => null) :
                await this.groupMetadata(m.chat).catch(() => null) || {}
            participants = Array.isArray(groupMetadata?.participants) ? groupMetadata.participants : []

            // Welcome y Anti-link activados por defecto si no existen
            chat.welcome = chat.welcome ?? true
            chat.antiLink = chat.antiLink ?? true
        }

        const decodeJid = j => this.decodeJid(j)
        const normJid = j => jidNormalizedUser(decodeJid(j))
        const userGroup = m.isGroup ? participants.find(p => areJidsSameUser(normJid(p.jid || p.id), normJid(m.sender))) || {} : {}
        const botGroup = m.isGroup ? participants.find(p => areJidsSameUser(normJid(p.jid || p.id), normJid(this.user.jid))) || {} : {}
        
        const isRAdmin = userGroup?.admin === 'superadmin'
        const isAdmin = isRAdmin || userGroup?.admin === 'admin' || userGroup?.admin === true
        const isBotAdmin = botGroup?.admin === 'admin' || botGroup?.admin === 'superadmin' || botGroup?.admin === true

        // Plugins
        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")
        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            const __filename = join(___dirname, name)

            // Ejecutar hook all
            if (typeof plugin.all === "function") {
                try {
                    await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })
                } catch (err) { console.error(err) }
            }

            // Saltar plugins admin si no hay restrict
            if (!global.opts?.restrict && plugin.tags?.includes("admin")) continue

            // Manejo de prefijos
            const pluginPrefix = plugin.customPrefix || conn.prefix || global.prefix
            let match = null
            if (pluginPrefix instanceof RegExp) match = [pluginPrefix.exec(m.text), pluginPrefix]
            else if (Array.isArray(pluginPrefix)) match = pluginPrefix.map(p => [p instanceof RegExp ? p.exec(m.text) : new RegExp(p.toString().replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")).exec(m.text), p]).find(p => p[0])
            else if (typeof pluginPrefix === "string") match = [new RegExp(pluginPrefix.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")).exec(m.text), pluginPrefix]
            if (!match) continue

            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, { match, conn: this, participants, groupMetadata, userGroup, botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })) continue
            }

            if (typeof plugin !== "function") continue

            let usedPrefix = (match[0] || "")[0] || (global.sinprefix ? '' : undefined)
            if (usedPrefix === undefined) continue

            const noPrefix = m.text.replace(usedPrefix, "")
            let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
            command = (command || "").toLowerCase()

            let isAccept = false
            if (plugin.command instanceof RegExp) isAccept = plugin.command.test(command)
            else if (Array.isArray(plugin.command)) isAccept = plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command)
            else if (typeof plugin.command === "string") isAccept = plugin.command === command
            if (!isAccept) continue

            m.plugin = name
            global.comando = command

            // Ejecutar plugin
            try {
                await plugin.call(this, m, { match, usedPrefix, noPrefix, args, command, text: args.join(" "), conn: this, participants, groupMetadata, userGroup, botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })
            } catch (err) {
                m.error = err
                console.error(err)
            } finally {
                if (typeof plugin.after === "function") {
                    try {
                        await plugin.after.call(this, m, { match, usedPrefix, noPrefix, args, command, text: args.join(" "), conn: this, participants, groupMetadata, userGroup, botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })
                    } catch (err) { console.error(err) }
                }
            }
        }

    } catch (err) { console.error(err) }
}

// Función de fallo
global.dfail = (type, m, conn) => {
    const messages = {
        rowner: `💠 *Acceso denegado*\nEl comando *${global.comando}* solo puede ser usado por los *creadores del bot*.`,
        owner: `💠 *Acceso denegado*\nEl comando *${global.comando}* solo puede ser usado por los *desarrolladores del bot*.`,
        premium: `⭐ *Exclusivo Premium*\nEl comando *${global.comando}* solo puede ser usado por *usuarios premium*.`,
        group: `👥 *Solo en grupos*\nEl comando *${global.comando}* solo puede ejecutarse dentro de un *grupo*.`,
        private: `📩 *Solo privado*\nEl comando *${global.comando}* solo puede usarse en *chat privado* con el bot.`,
        admin: `⚠️ *Requiere permisos de admin*\nEl comando *${global.comando}* solo puede ser usado por los *administradores del grupo*.`,
        botAdmin: `🤖 *Necesito permisos*\nPara ejecutar *${global.comando}*, el bot debe ser *administrador del grupo*.`,
        restrict: `⛔ *Funcionalidad desactivada*\nEsta característica está *temporalmente deshabilitada*.`
    }
    
    if (messages[type]) conn.reply(m.chat, messages[type], m).then(_ => m.react?.('✖️'))
}

// Watch para recarga automática
let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.magenta("Se actualizó 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})
