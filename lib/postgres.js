import pg from 'pg';
const { Pool } = pg;

// Configuración de conexión (Ajusta con tus datos de AkiraX)
export const db = new Pool({
    user: 'tu_usuario',
    host: 'tu_host',
    database: 'tu_db',
    password: 'tu_password',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

export async function getSubbotConfig(botId) {
    try {
        const res = await db.query('SELECT * FROM subbots WHERE id = $1', [botId.replace(/:\d+/, "")]);
        return res.rows[0] || { prefix: '.', mode: 'public', name: 'Empire Bot' };
    } catch (e) {
        return { prefix: '.', mode: 'public', name: 'Empire Bot' };
    }
}
