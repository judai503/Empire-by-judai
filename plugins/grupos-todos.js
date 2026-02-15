import { marca } from '../lib/marca.js';
import fs from 'fs';
export default {
    command: ['todos', 'tagall'],
    run: async (conn, m, { text }) => {
        const meta = await conn.groupMetadata(m.chat);
        if (!meta.participants.find(p => p.id === m.sender)?.admin) return m.reply('❌ No eres admin.');
        let db = JSON.parse(fs.readFileSync('./database/database.json', 'utf-8') || '{}');
        let emoji = db[m.chat]?.emoji || '📌';
        let txt = `📣 *ATENCIÓN*\n💬 *Msg:* ${text || 'Sin mensaje'}\n\n`;
        let mentions = [];
        for (let p of meta.participants) {
            txt += `${emoji} @${p.id.split('@')[0]}\n`;
            mentions.push(p.id);
        }
        m.reply(txt + `\n${marca}`, null, { mentions });
    }
};
