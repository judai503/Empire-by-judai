import { smsg } from './lib/simple.js'
import format from 'util'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'

export async function handler(chatUpdate) {
    if (!chatUpdate.messages) return
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return
    
    try {
        m = smsg(this, m) || m
        if (!m.text) return

        // --- CARGAR SCHEMA ---
        const { userDefault, chatDefault, settingsDefault } = JSON.parse(fs.readFileSync('./lib/schema.json'))

        // --- SISTEMA DE USUARIOS ---
        let user = global.db.data.users[m.sender]
        if (typeof user !== 'object') global.db.data.users[m.sender] = {}
        if (user) {
            for (let key in userDefault) if (!(key in user)) user[key] = userDefault[key]
        } else {
            global.db.data.users[m.sender] = { ...userDefault }
        }

        // --- SISTEMA DE CHATS ---
        if (m.isGroup) {
            let chat = global.db.data.chats[m.chat]
            if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
            if (chat) {
                for (let key in chatDefault) if (!(key in chat)) chat[key] = chatDefault[key]
            } else {
                global.db.data.chats[m.chat] = { ...chatDefault }
            }
        }

        // --- PLUGINS ---
        let usedPrefix = (global.prefix.exec(m.text) || [])[0]
        if (!usedPrefix) return
        
        let args = m.text.slice(usedPrefix.length).trim().split` `.slice(1)
        let text = args.join` `
        let command = m.text.slice(usedPrefix.length).trim().split` `[0].toLowerCase()

        let plugin = Object.values(global.plugins).find(p => p.command && (Array.isArray(p.command) ? p.command.includes(command) : p.command === command))

        if (plugin) {
            await plugin.call(this, m, { conn: this, args, text, usedPrefix, command, user: global.db.data.users[m.sender] })
        }

    } catch (e) {
        console.error(e)
    }
}
