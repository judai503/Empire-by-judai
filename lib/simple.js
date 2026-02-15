import path from 'path'
import { fileURLToPath } from 'url'

export function smsg(conn, m, store) {
    if (!m) return m
    let M = m.constructor
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.key.participant || m.key.remoteJid || '')
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0]
        m.msg = m.message[m.mtype]
        m.text = m.msg.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || m.mtype
        
        // Función m.reply simplificada
        m.reply = (text, chatId, options) => conn.sendMessage(chatId ? chatId : m.chat, { text: text }, { quoted: m, ...options })
    }
    return m
}

// Helper para limpiar JIDs
export function decodeJid(jid) {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
        let decode = jid.split('@')[0].split(':')[0] + '@' + jid.split('@')[1]
        return decode
    } else return jid
}
