import { marca } from './lib/marca.js';

export const config = {
    // Nombre de la carpeta de sesión
    sessions: 'EmpireSession',
    
    // Prefix: Ahora acepta casi cualquier símbolo común al inicio
    prefix: /^[./!#?]/, 
    
    botName: 'Empire Bot',
    
    // Datos del Propietario
    owner: {
        number: '50360438371',
        name: 'Owner Name',
        jid: '50360438371@s.whatsapp.net' // Generado para comparaciones rápidas
    },

    // Configuración de Mensajes Globales (Centralizado)
    msgs: {
        wait: '⏳ *Procesando... por favor espera.*',
        error: '❌ *Ups, algo salió mal. Inténtalo de nuevo.*',
        owner: '👑 *Esta función es solo para mi creador.*',
        group: '👥 *Este comando solo funciona en grupos.*',
        admin: '👮‍♂️ *Debes ser administrador para usar esto.*',
        botAdmin: '🤖 *Necesito ser administrador para ejecutar esta acción.*'
    },

    // Footer o marca de agua global
    marca: marca || '🛡️ *E M P I R E  B O T*'
};

// Pequeño helper para validar si un mensaje es del owner
export const isOwner = (jid) => jid.replace(/\D/g, '') === config.owner.number;
