let handler = async (m, { text, isAdmin }) => {
  if (!m.isGroup) return m.reply('❗ Este comando solo se puede usar en grupos.');
  if (!isAdmin) return m.reply('🛡️ Solo los administradores pueden usar este comando.');

  const chatData = global.db.data.chats[m.chat] || {};

  if (!text) {
    // Mostrar emoji actual
    const current = chatData.customEmoji || 'No hay emoji asignado.';
    return m.reply(`✨ Emoji actual del grupo: ${current}`);
  }

  if (text.length > 2) return m.reply('⚠️ Solo puedes asignar un emoji.');

  chatData.customEmoji = text.trim();
  global.db.data.chats[m.chat] = chatData;

  m.reply(`✅ Emoji personalizado para este grupo asignado: ${text}`);
};

handler.help = ['setemoji <emoji>', 'emotag'];
handler.tags = ['grupo'];
handler.command = ['setemoji', 'emotag'];
handler.group = true;
handler.admin = true;

export default handler;