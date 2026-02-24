import { marca } from '../lib/marca.js';
import fs from 'fs';

export default {
  command: ['todos', 'tagall'],
  group: true,
  admin: true,

  async run(conn, m, { text }) {
    const meta = await conn.groupMetadata(m.chat).catch(() => ({}));
    const participants = meta.participants || [];

    let db = {};
    if (fs.existsSync('./database/database.json')) {
      db = JSON.parse(fs.readFileSync('./database/database.json', 'utf-8'));
    }

    let emoji = db[m.chat]?.emoji || '📌';

    let txt = `📣 *ATENCIÓN*\n💬 *Msg:* ${text || 'Sin mensaje'}\n\n`;
    let mentions = [];

    for (const p of participants) {
      txt += `${emoji} @${p.id.split('@')[0]}\n`;
      mentions.push(p.id);
    }

    await conn.sendMessage(m.chat, {
      text: `${txt}\n${marca}`,
      mentions
    }, { quoted: m });
  }
};
