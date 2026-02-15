import { empireMarca } from '../lib/marca.js';

export const command = ['todos', 'invocar', 'tagall'];

export async function run(conn, m, { text }) {
    try {
        if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos.');

        const metadata = await conn.groupMetadata(m.chat);
        const participants = metadata.participants || [];
        const sender = m.key.participant || m.key.remoteJid;

        // Emojis y Encabezados dinámicos
        const animalEmojis = ['🦍', '🦧', '🐣', '🦭', '🦁', '🐯', '🦒', '🦊', '🦝', '🐹', '🐼', '🐺'];
        const encabezados = ['📣 *A T E N C I Ó N* 📣', '🚀 *E M P I R E  B O T* 🚀', '🛡️ *A L E R T A* 🛡️'];
        
        let header = encabezados[Math.floor(Math.random() * encabezados.length)];
        let total = participants.length; 

        // 1. Cabecera y cuerpo
        let txt = `${header}\n\n\n`;
        txt += `[🕶️]*De:* @${sender.split('@')[0]}\n`;
        txt += `[💬] *MENSAJE:* ${text || 'Sin mensaje'}\n\n`;
        txt += `[👤] MIEMBROS: ${total}\n`;

        // 2. Lista de participantes con emojis aleatorios
        for (let p of participants) {
            let emoji = animalEmojis[Math.floor(Math.random() * animalEmojis.length)];
            txt += `${emoji}┋ @${p.id.split('@')[0]}\n`;
        }

        // 3. LA MAGIA: Aquí se inserta lo que hay en lib/marca.js
        txt += empireMarca; 

        // 4. Envío final
        await conn.sendMessage(m.chat, { 
            text: txt, 
            mentions: participants.map(p => p.id) 
        }, { quoted: m });

    } catch (e) {
        console.error("Error en invocar:", e);
    }
}
