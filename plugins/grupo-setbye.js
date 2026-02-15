import fs from 'fs';
export default {
    command: ['setbye', 'delbye'],
    run: async (conn, m, { text, command }) => {
        const isAdmin = (await conn.groupMetadata(m.chat)).participants.find(p => p.id === m.sender)?.admin;
        if (!isAdmin) return m.reply('❌ No eres admin.');
        let db = JSON.parse(fs.readFileSync('./database/bienvenidas.json', 'utf-8') || '{}');
        if (command === 'delbye') {
            delete db[m.chat]?.customBye;
            m.reply('✅ Despedida borrada.');
        } else {
            if (!text) return m.reply('💡 Uso: .setbye Adiós @user');
            if (!db[m.chat]) db[m.chat] = { enabled: true };
            db[m.chat].customBye = text;
            m.reply('✅ Guardado.');
        }
        fs.writeFileSync('./database/bienvenidas.json', JSON.stringify(db, null, 2));
    }
};
