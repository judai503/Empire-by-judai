import fs from 'fs'; 
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { config, isOwner } from './settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const plugins = {}; 

/**
 * Carga de Plugins con Auto-Reload
 */
export async function loadPlugins() {
  const pluginFolder = path.join(__dirname, 'plugins');
  if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder, { recursive: true });

  const files = fs.readdirSync(pluginFolder).filter(f => f.endsWith('.js'));

  for (let key in plugins) delete plugins[key];

  for (const file of files) {
    try {
      const pluginPath = `./plugins/${file}?update=${Date.now()}`;
      const module = await import(pluginPath);
      const plugin = module.default || module;

      if (!plugin?.command || !plugin?.run) {
        console.log(chalk.yellow(`[PLUGIN INVÁLIDO] ${file}`));
        continue;
      }

      plugins[file] = plugin;
    } catch (e) {
      console.error(chalk.red(`[ERROR PLUGIN: ${file}]`), e);
    }
  }

  console.log(chalk.cyan(`━━━ [SISTEMA: ${Object.keys(plugins).length} PLUGINS] ━━━`));
}

/**
 * Cache de grupos (anti rate-limit)
 */
const groupCache = new Map();

async function getGroupMetadata(conn, jid) {
  if (groupCache.has(jid)) return groupCache.get(jid);
  const data = await conn.groupMetadata(jid).catch(() => ({}));
  groupCache.set(jid, data);
  setTimeout(() => groupCache.delete(jid), 60_000);
  return data;
}

/**
 * Extrae número real del jid (sirve para @lid y @s.whatsapp.net)
 */
function jidToNum(jid) {
  if (!jid) return null;
  return jid.toString().replace(/\D/g, '');
}

/**
 * Handler Maestro
 */
export async function handler(conn, m) {
  try {
    if (!m || !m.message) return;

    const type = Object.keys(m.message)[0];
    const msg = m.message[type];

    let body = (type === 'conversation') ? msg :
               (type === 'extendedTextMessage') ? msg.text :
               (type === 'imageMessage' || type === 'videoMessage') ? msg.caption :
               (type === 'buttonsResponseMessage') ? msg.selectedButtonId :
               (type === 'listResponseMessage') ? msg.singleSelectReply.selectedRowId :
               (type === 'templateButtonReplyMessage') ? msg.selectedId :
               '';

    if (!body) return;

    m.chat = m.key.remoteJid;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = m.key.participant || m.key.remoteJid;

    // Menciones
    m.mentionedJid =
      (m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []);

    // Bot ID real
    const botRaw = conn?.user?.id;
    const botJid = typeof botRaw === 'string'
      ? (botRaw.includes(':') ? botRaw.split(':')[0] + '@s.whatsapp.net' : botRaw)
      : botRaw;

    const senderNum = jidToNum(m.sender);
    const botNum = jidToNum(botJid);

    m.isOwner = isOwner(m.sender) || senderNum === botNum;

    m.reply = (txt, opts = {}) => conn.sendMessage(
      m.chat,
      { text: txt, mentions: opts.mentions || [] },
      { quoted: m }
    );

    if (m.isGroup) {
      const groupMetadata = await getGroupMetadata(conn, m.chat);
      const participants = groupMetadata.participants || [];

      const adminNums = participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => jidToNum(p.id));

      m.isAdmin = adminNums.includes(senderNum) || senderNum === botNum || m.isOwner;
      m.botIsAdmin = adminNums.includes(botNum); // ⚠️ Baileys a veces falla aquí
      m.groupMetadata = groupMetadata;
    }

    const prefixMatch = body.trim().match(config.prefix);
    if (!prefixMatch) return;

    const usedPrefix = prefixMatch[0];
    const textAfterPrefix = body.replace(usedPrefix, '').trim();
    const args = textAfterPrefix.split(/ +/).filter(v => v);
    const command = args.shift()?.toLowerCase();
    const fullText = args.join(' ');

    for (const name in plugins) {
      const plugin = plugins[name];
      if (!plugin || !plugin.command) continue;

      const isMatch = Array.isArray(plugin.command)
        ? plugin.command.includes(command)
        : (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command);

      if (isMatch) {
        if (plugin.admin && !m.isAdmin) return m.reply(config.msgs.admin);
        if (plugin.rowner && !m.isOwner) return m.reply(config.msgs.owner);
        if (plugin.group && !m.isGroup) return m.reply(config.msgs.group);

        // ❗ No bloqueamos por botAdmin (Baileys bug). Dejamos que WhatsApp valide.
        if (plugin.botAdmin && !m.botIsAdmin) {
          console.log('[WARN] Baileys no detectó bot admin, intentando igual...');
        }

        try {
          await plugin.run(conn, m, { args, text: fullText });
          console.log(chalk.green('✓ CMD'), chalk.cyan(command), chalk.gray('|'), senderNum);
        } catch (err) {
          console.error(chalk.red(`[FALLO EN PLUGIN: ${name}]`), err);
          m.reply('🤖 No tengo permisos para ejecutar esta acción en este grupo.');
        }
        break;
      }
    }
  } catch (e) {
    console.error(chalk.red('[ERROR CRÍTICO HANDLER]:'), e);
  }
}
