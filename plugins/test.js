export const command = ['test', 'ping', 'revlist15']; // Aquí pones los nombres del comando

export async function run(conn, m, { args }) {
    await conn.sendMessage(m.key.remoteJid, { text: '¡Asta Bot está funcionando perfectamente! 🚀' });
}
