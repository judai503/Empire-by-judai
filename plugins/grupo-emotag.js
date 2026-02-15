import fs from 'fs';
export default {
    command: ['emotag', 'setemoji'],
    run: async (conn, m, { text }) => {
        if (!text) return m.reply('💡 Ejemplo: .emotag 🛡️');
        let db = JSON.parse(fs.readFileSync('./database/database.json', 'utf-8') || '{}');
        if (!db[m.chat]) db[m.chat] = {};
        db[m.chat].emoji = text.split(' ')[0];
        fs.writeFileSync('./database/database.json', JSON.stringify(db, null, 2));
        m.reply(`✅ Emoji actualizado a: ${db[m.chat].emoji}`);
    }
};
