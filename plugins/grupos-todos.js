import fs from 'fs';
import { empireMarca } from '../lib/marca.js';

export default {
    command: ['todos', 'invocar', 'tagall'],
    run: async (conn, m, { text }) => {
        try {
            if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos.');

            // --- OBTENER METADATOS Y PARTICIPANTES ---
            const groupMetadata = await conn.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const userData = participants.find(u => u.id === m.sender);
            
            // --- VERIFICACIÓN DE ADMIN ---
            const isAdmin = userData?.admin === 'admin' || userData?.admin === 'superadmin';
            
            if (!isAdmin) {
                return m.reply('❌ ¡Error! Este comando solo puede ser usado por *Administradores* del grupo.');
            }

            // --- LÓGICA DE BASE DE DATOS PARA EL EMOJI ---
            const dbPath = './database/database.json';
            let emojiParaTodos = '📌'; 

            if (fs.existsSync(dbPath)) {
                try {
                    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
                    if (db[m.chat] && db[m.chat].emoji) {
                        emojiParaTodos = db[m.chat].emoji;
                    }
                } catch (e) {
                    console.log("Error al leer DB, usando emoji por defecto.");
                }
            }

            const encabezados = ['📣 *A T E N C I Ó N* 📣', '🚀 *E M P I R E  B O T* 🚀', '🛡️ *A L E R T A* 🛡️'];
            let header = encabezados[Math.floor(Math.random() * encabezados.length)];

            // 1. Construcción del mensaje
            let txt = `${header}\n\n`;
            txt += `*Solicitado por:* @${m.sender.split('@')[0]}\n`;
            txt += `*Mensaje:* ${text || 'Sin mensaje'}\n`;
            txt += `*Miembros:* ${participants.length}\n\n`;

            // 2. Lista de menciones con el emoji
            let mentions = [];
            for (let p of participants) {
                txt += `${emojiParaTodos} @${p.id.split('@')[0]}\n`;
                mentions.push(p.id);
            }

            // 3. Cierre y marca
            txt += `\n${empireMarca || 'Powered by Empire Bot'}`;

            // 4. Envío masivo
            await conn.sendMessage(m.chat, { 
                text: txt, 
                mentions: mentions 
            }, { quoted: m });

        } catch (e) {
            console.error("Error en invocar:", e);
            m.reply('❌ Ocurrió un error al intentar invocar a todos.');
        }
    }
};
