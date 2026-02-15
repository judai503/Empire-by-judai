import fs from 'fs';
import { empireMarca } from '../lib/marca.js';

export const command = ['todos', 'invocar', 'tagall'];

export async function run(conn, m, { text }) {
    try {
        if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos.');

        const metadata = await conn.groupMetadata(m.chat);
        const participants = metadata.participants || [];
        const sender = m.key.participant || m.key.remoteJid;
        const group = m.chat;

        // --- LÓGICA DE BASE DE DATOS PARA EL EMOJI ---
        const dbPath = './database/database.json';
        let emojiParaTodos = '📌'; // Emoji por defecto si no hay uno configurado

        if (fs.existsSync(dbPath)) {
            const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            if (db[group] && db[group].emoji) {
                emojiParaTodos = db[group].emoji;
            }
        }
        // --------------------------------------------

        const encabezados = ['📣 *A T E N C I Ó N* 📣', '🚀 *E M P I R E  B O T* 🚀', '🛡️ *A L E R T A* 🛡️'];
        let header = encabezados[Math.floor(Math.random() * encabezados.length)];
        let total = participants.length; 

        // 1. Cabecera
        let txt = `${header}\n\n\n`;
        txt += `[🕶️]*De:* @${sender.split('@')[0]}\n`;
        txt += `[💬] *MENSAJE:* ${text || 'Sin mensaje'}\n\n`;
        txt += `[👤] MIEMBROS: ${total}\n`;

        // 2. Lista de participantes con el emoji personalizado
        for (let p of participants) {
            // Aquí usamos el emoji que configuraste con .emotag para todos
            txt += `${emojiParaTodos}┋ @${p.id.split('@')[0]}\n`;
        }

        // 3. Marca de lib/marca.js
        txt += empireMarca; 

        // 4. Envío con menciones
        await conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: participants.map(p => p.id) 
        }, { quoted: m });

    } catch (e) {
        console.error("Error en invocar:", e);
    }
}
