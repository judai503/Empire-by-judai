import fs from 'fs';

export default {
    command: ['welcome', 'bienvenida'],
    run: async (conn, m, { args }) => {
        if (!m.isGroup) return m.reply('⚠️ Este comando solo puede usarse en grupos.');
        
        // Verificación de Administrador
        const groupMetadata = await conn.groupMetadata(m.chat);
        const isAdmin = groupMetadata.participants.find(p => p.id === m.sender)?.admin;
        if (!isAdmin) return m.reply('❌ Solo los administradores pueden usar este comando.');

        const dbPath = './database/bienvenidas.json';
        if (!fs.existsSync('./database')) fs.mkdirSync('./database');
        
        let db = {};
        if (fs.existsSync(dbPath)) {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        }

        if (!db[m.chat]) db[m.chat] = { enabled: true };

        if (args[0] === 'on') {
            db[m.chat].enabled = true;
            m.reply('✅ *SISTEMA ACTIVADO*\nAhora el bot dará bienvenidas y despedidas en este grupo.');
        } else if (args[0] === 'off') {
            db[m.chat].enabled = false;
            m.reply('✅ *SISTEMA DESACTIVADO*\nEl bot ya no enviará mensajes de bienvenida ni despedida aquí.');
        } else {
            const estado = db[m.chat].enabled ? 'ACTIVADO' : 'DESACTIVADO';
            m.reply(`💡 *ESTADO ACTUAL: ${estado}*\n\nUsa:\n.welcome on (para activar)\n.welcome off (para desactivar)`);
        }

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }
};
