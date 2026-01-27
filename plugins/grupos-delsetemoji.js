let handler = async (m, { isAdmin }) => {
  if (!m.isGroup) return m.reply('❗ Este comando solo se puede usar en grupos.');
  if (!isAdmin) return m.reply('🛡️ Solo los administradores pueden usar este comando.');

  const chatData = global.db.data.chats[m.chat] || {};

  if (!chatData.customEmoji) return m.reply('❌ No hay emoji asignado en este grupo.');

  delete chatData.customEmoji;
  global.db.data.chats[m.chat] = chatData;

  m.reply('✅ Emoji personalizado eliminado del grupo.');
};

handler.help = ['delemoji'];
handler.tags = ['grupo'];
handler.command = ['delemoji'];
handler.group = true;
handler.admin = true;

export default handler;