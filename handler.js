import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { config } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const plugins = {}; 

/**
 * Carga todos los archivos de la carpeta /plugins a la memoria.
 * Se ejecuta una sola vez al iniciar el index.js
 */
export async function loadPlugins() {
    const pluginFolder = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder);
    
    const files = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            // Usamos un timestamp para forzar la lectura fresca si fuera necesario
            const module = await import(`./plugins/${file}?update=${Date.now()}`);
            plugins[file] = module.default || module;
        } catch (e) {
            console.error(chalk.red(`[ERROR] No se pudo cargar el plugin ${file}:`), e);
        }
    }
    console.log(chalk.green(`[SISTEMA] ${Object.keys(plugins).length} Plugins cargados correctamente.`));
}

/**
 * Procesa cada mensaje que llega al bot
 */
export async function handler(conn, m) {
    try {
        if (!m.message) return;
        
        // 1. Extraer el texto del mensaje (soporta texto, imágenes y mensajes editados)
        const messageType = Object.keys(m.message)[0];
        let body = (messageType === 'conversation') ? m.message.conversation : 
                   (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                   (messageType === 'imageMessage') ? m.message.imageMessage.caption : '';

        body = body.trim();

        // 2. Verificar si el mensaje es un comando
        const isCmd = config.prefix.test(body);
        if (!isCmd) return;

        // 3. Limpiar el comando y separar prefijo de contenido
        // Esto permite que "!   tagall" funcione igual que "!tagall"
        const usedPrefix = body.match(config.prefix)[0];
        const textAfterPrefix = body.slice(usedPrefix.length).trim();
        
        const args = textAfterPrefix.split(/ +/);
        const command = args.shift().toLowerCase(); // El comando es la primera palabra
        const fullText = args.join(' '); // El resto es el texto o argumentos

        // 4. Propiedades útiles para el objeto 'm'
        m.chat = m.key.remoteJid;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.key.participant || m.key.remoteJid;
        
        // Función rápida para responder
        m.reply = (txt) => conn.sendMessage(m.chat, { text: txt }, { quoted: m });

        // 5. Buscador de comando en la caché de plugins
        let executed = false;
        for (const name in plugins) {
            const plugin = plugins[name];
            if (!plugin) continue;

            const cmdProp = plugin.command;
            
            // Verificamos si el comando coincide (String, Array o Regex)
            const isMatch = Array.isArray(cmdProp) ? cmdProp.includes(command) : 
                          (cmdProp instanceof RegExp ? cmdProp.test(command) : cmdProp === command);

            if (isMatch) {
                // Validación de Dueño (si el plugin tiene rowner: true)
                if (plugin.rowner && m.sender !== config.owner) {
                    return m.reply('❌ Este comando es exclusivo de mi creador.');
                }

                // Ejecución del plugin
                await plugin.run(conn, m, { args, text: fullText, command });
                console.log(chalk.bgGreen.black(`[EXEC]`) + ` ${command} | De: ${m.sender.split('@')[0]}`);
                executed = true;
                break; 
            }
        }

        if (!executed && config.testMode) {
            console.log(chalk.yellow(`[WARN] Comando "${command}" no encontrado.`));
        }

    } catch (e) {
        console.error(chalk.red('[ERROR HANDLER]:'), e);
    }
}
