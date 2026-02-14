import { smsg } from "./lib/simple.js"
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"

const { proto } = (await import("@whiskeysockets/baileys")).default
const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

// CARGA DE ESQUEMAS DINÁMICOS
const schemaPath = './lib/schema.json'
let schema = JSON.parse(fs.readFileSync(schemaPath))

watchFile(schemaPath, () => {
    schema = JSON.parse(fs.readFileSync(schemaPath))
    console.log(chalk.yellowBright('👑 Esquema de Empire actualizado desde JSON'))
})

function loadBotConfig(conn) {
    try {
        const botNumber = conn.user?.jid?.split('@')[0].replace(/\D/g, '')
        const configPath = path.join('./session/SubBot', botNumber, 'config.json')
        let currentName = global.wm;
        let currentBanner = global.imagen1;

        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath))
                if (config.name) currentName = config.name
                if (config.banner) currentBanner = config.banner
            } catch (err) {}
        }
        conn.botName = currentName;
        conn.botBanner = currentBanner;
    } catch (e) {
        conn.botName = global.wm;
        conn.botBanner = global.imagen1;
    }
}

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()

    loadBotConfig(this)

    try {
        m = smsg(this, m) || m
        if (!m) return
        m.exp = 0
        
        // --- SISTEMA AUTOMÁTICO DE BASE DE DATOS ---
        try {
            // Usuarios
            let user = global.db.data.users[m.sender]
            if (typeof user !== "object") global.db.data.users[m.sender] = {}
            for (let key in schema.userDefault) {
                if (!(key in global.db.data.users[m.sender])) {
                    global.db.data.users[m.sender][key] = schema.userDefault[key]
                }
            }
            if (!user.name) user.name = m.name

            // Chats
            let chat = global.db.data.chats[m.chat]
            if (typeof chat !== "object") global.db.data.chats[m.chat] = {}
            for (let key in schema.chatDefault) {
                if (!(key in global.db.data.chats[m.chat])) {
                    global.db.data.chats[m.chat][key] = schema.chatDefault[key]
                }
            }

            // Settings
            let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== "object") global.db.data.settings[this.user.jid] = {}
            for (let key in schema.settingsDefault) {
                if (!(key in global.db.data.settings[this.user.jid])) {
                    global.db.data.settings[this.user.jid][key] = schema.settingsDefault[key]
                }
            }
        } catch (e) { console.error(e) }

        if (typeof m.text !== "string") m.text = ""
        
        const user = global.db.data.users[m.sender]
        const chat = global.db.data.chats[m.chat]
        const settings = global.db.data.settings[this.user.jid]  
        const isROwner = [...global.owner.map((number) => number)].map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender) || user.premium
        const isOwners = [this.user.jid, ...global.owner.map((number) => number + "@s.whatsapp.net")].includes(m.sender)

        // ANTIPRIVADO (Desde el JSON)
        if (chat.antiPrivado && !m.isGroup && !isOwner && !isPrems) {
            return await this.reply(m.chat, `👑 *${global.wm}*\n\nHola. El chat privado está desactivado.\nSolo puedes usar el bot en grupos del Imperio.`, m)
        }

        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)
        
        let usedPrefix
        const groupMetadata = m.isGroup ? (this.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => ({}))) : {}
        const participants = (groupMetadata.participants || [])
        const userGroup = participants.find((u) => this.decodeJid(u.id) === m.sender) || {}
        const botGroup = participants.find((u) => this.decodeJid(u.id) == this.user.jid) || {}
        const isAdmin = userGroup?.admin != null
        const isBotAdmin = botGroup?.admin != null

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")
        
        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue

            const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
            const pluginPrefix = plugin.customPrefix || this.prefix || global.prefix
            const match = (pluginPrefix instanceof RegExp ? [[pluginPrefix.exec(m.text), pluginPrefix]] : Array.isArray(pluginPrefix) ? pluginPrefix.map(prefix => {
                const regex = prefix instanceof RegExp ? prefix : new RegExp(strRegex(prefix))
                return [regex.exec(m.text), regex]
            }) : [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]]).find(p => p[1])

            // Ejecución de plugins
            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, { match, conn: this, isROwner, isOwner, isAdmin, isBotAdmin, isPrems, user, chat, settings })) continue
            }
            if (typeof plugin !== "function") continue

            if ((usedPrefix = (match?.[0] || "")[0])) {
                const noPrefix = m.text.replace(usedPrefix, "")
                let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
                command = (command || "").toLowerCase()
                const _args = noPrefix.trim().split(" ").slice(1)
                const text = _args.join(" ")
                
                const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) : Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) : typeof plugin.command === "string" ? plugin.command === command : false
                
                if (!isAccept) continue
                
                m.plugin = name
                global.comando = command
                
                // Restricciones de baneo y bot on/off
                if (chat.isBanned && !isROwner && command !== "bot") continue
                if (user.banned && !isROwner) {
                    return m.reply(`❌ Estás baneado del Imperio. Razón: ${user.bannedReason}`)
                }

                // Validaciones de permisos
                if (plugin.rowner && !isROwner) { global.dfail('rowner', m, this); continue }
                if (plugin.owner && !isOwner) { global.dfail('owner', m, this); continue }
                if (plugin.premium && !isPrems) { global.dfail('premium', m, this); continue }
                if (plugin.group && !m.isGroup) { global.dfail('group', m, this); continue }
                if (plugin.admin && !isAdmin) { global.dfail('admin', m, this); continue }
                if (plugin.botAdmin && !isBotAdmin) { global.dfail('botAdmin', m, this); continue }

                user.commands++
                await this.sendPresenceUpdate('composing', m.chat)

                try {
                    await plugin.call(this, m, { match, usedPrefix, noPrefix, args, command, text, conn: this, isROwner, isOwner, isAdmin, isBotAdmin, isPrems, user, chat, settings })
                } catch (e) {
                    console.error(e)
                    m.reply(`⚠️ Error en el plugin: ${name}`)
                }
            }
        }
    } catch (err) {
        console.error(err)
    } finally {
        if (!opts["noprint"]) await (await import("./lib/print.js")).default(m, this)
    }
}

global.dfail = (type, m, conn) => {
    const msg = {
        rowner: `👑 Solo el Tío Judai puede usar esto.`,
        owner: `👑 Comando reservado para el Dueño.`,
        premium: `👑 Únete al club Elite (Premium) para usar esto.`,
        group: `👑 Este comando es exclusivo para grupos.`,
        admin: `👑 Solo los administradores del Imperio pueden usar esto.`,
        botAdmin: `👑 Necesito ser administrador para ejecutar el comando.`
    }[type]
    if (msg) return conn.reply(m.chat, msg, m).then(_ => m.react('❌'))
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.yellowBright("Empire Handler Reloaded"))
    if (global.reloadHandler) await global.reloadHandler()
})
