export const command = ['todos', 'tagall', 'invocar']; // Los nombres que activan el comando

export async function run(conn, m, { args, participants, isOwner, isAdmin }) {
    // 1. Validaciones de seguridad (Solo para Admins o el Owner)
    if (!m.key.remoteJid.endsWith('@g.us')) return m.reply('❌ Este comando solo funciona en grupos.');
    if (!isAdmin && !isOwner) return m.reply('❌ ¡Solo los administradores pueden usar este comando!');

    // 2. Extraer el mensaje (si el usuario escribió algo después del comando)
    const mensaje = args.length > 0 ? args.join(' ') : 'Sin mensaje';
    
    // 3. Crear la lista de menciones
    let texto = `*📣 INVOCACIÓN GENERAL*\n\n`;
    texto += `*Mensaje:* ${mensaje}\n\n`;
    
    // Generamos el texto con menciones invisibles para no saturar
    const menciones = [];
    for (let p of participants) {
        texto += `· @${p.id.split('@')[0]}\n`;
        menciones.push(p.id);
    }

    texto += `\n*${global.settings.name || 'Empire Bot'}*`;

    // 4. Enviar el mensaje con las menciones reales
    await conn.sendMessage(m.key.remoteJid, { 
        text: texto, 
        mentions: menciones 
    }, { quoted: m });
}
