import fs from 'fs';

export const command = ['emotag', 'setemoji'];

export async function run(conn, m, { text }) {
    try {
        if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos.');

        // 1. VERIFICACIÓN DE ADMINISTRADOR
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        const user = participants.find(u => u.id === m.sender);
        const isAdmin = user?.admin === 'admin' || user?.admin === 'superadmin';

        if (!isAdmin) {
            return m.reply('🛡️ *ACCESO DENEGADO*\nSolo los administradores pueden usar este comando para cambiar el emoji del grupo.');
        }

        // 2. GESTIÓN DE BASE DE DATOS
        const dbPath = './database/database.json';
        if (!fs.existsSync('./database')) fs.mkdirSync('./database');
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');

        let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        if (!db[m.chat]) db[m.chat] = {};

        // 3. LÓGICA DE ASIGNACIÓN
        if (!text) {
            const actual = db[m.chat].emoji || '📌 (Predeterminado)';
            return m.reply(`✨ *CONFIGURACIÓN ACTUAL*\nEmoji: ${actual}\n\nUsa: *.emotag [emoji]* para cambiarlo.`);
        }

        const nuevoEmoji = text.trim().split(' ')[0]; // Toma solo el emoji
        db[m.chat].emoji = nuevoEmoji;

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        await m.reply(`✅ *LOGÍSTICA ACTUALIZADA*\nAhora todas las menciones usarán el emoji: ${nuevoEmoji}`);

    } catch (e) {
        console.error("Error en emotag:", e);
        m.reply('❌ Hubo un error al procesar el comando.');
    }
}
