
import { marca } from '../lib/marca.js';

export default {
  command: ['kick', 'expulsar'],
  group: true,
  admin: true,
  botAdmin: true,

  run: async (conn, m) => {
    let user = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!user) return m.reply('⚠️ Etiqueta o responde al usuario que quieres expulsar.');

    await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
    m.reply(`✅ Usuario expulsado correctamente.\n\n${marca}`, { mentions: [user] });
  }
};
