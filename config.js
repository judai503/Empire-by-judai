import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs' 
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

//*─✞─ CONFIGURACIÓN GLOBAL ─✞─*

// Número del bot
global.botNumber = '' // Ejemplo: 525568138672

//*─✞─ OWNERS ─✞─*
global.owner = [
  ['50360438371', '👑 El Tío Judai', true],
  [''],
  ['', '', false],
  ['', 'nombere', true],
  ['', '', false]
]
global.mods = ['']
global.suittag = ['']
global.prems = ['']

//*─✞─ INFO DEL SISTEMA ─✞─*
global.libreria = 'Baileys'
global.baileys = 'V 6.7.9'
global.languaje = 'Español'
global.vs = '2.2.0'
global.vsJB = '5.0'

//*─✞─ NOMBRES DEL PROYECTO ─✞─*
global.nameqr = 'Empire-Bot'
global.sessions = 'empireSession'
global.jadi = 'empireJadiBot'
global.blackJadibts = true

//*─✞─ STICKERS ─✞─*
global.packsticker = `
  👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫 — El Tío Judai`

global.packname = '👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫'

global.author = `
♾━━━━━━━━━━━━━━━♾`

//*─✞─ TEXTOS DEL BOT ─✞─*
global.wm = '👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫'
global.titulowm = '👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫'
global.igfg = 'El Tío Judai'
global.botname = '👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫'
global.dev = '© Powered by El Tío Judai ⚡'
global.textbot = '👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫 : El Tío Judai'
global.gt = '͟͞👑 𝑬𝑴𝑷𝑰𝑹𝑬 𝑴𝑫͟͞'
global.namechannel = '👑 EMPIRE — El Tío Judai'

// Moneda interna
global.monedas = 'monedas'

//*─✞─ LINKS ─✞─*
global.gp1 = 'https://chat.whatsapp.com/IbADO35sBSC4G1FBTGbHIE?mode=ac_t'
global.gp2 = 'https://chat.whatsapp.com/FiBcPMYEO7mG4m16gBbwpP?mode=ac_t'
global.comunidad1 = 'https://chat.whatsapp.com/FgQ4q11AjaO8ddyc1LvK4r?mode=ac_t'

// ✅ NUEVO CANAL
global.channel = 'https://whatsapp.com/channel/0029Vb6WpKMFXUuVwH7Hny3r'
global.cn = global.channel

global.yt = ''
global.md = 'https://github.com/judai503/Empire-by-judai'
global.correo = ''

//*─✞─ IMAGEN ─✞─*
global.catalogo = fs.readFileSync(new URL('../src/catalogo.jpg', import.meta.url))
global.photoSity = [global.catalogo]

//*─✞─ MENSAJE ESTILO ─✞─*
global.estilo = { 
  key: {  
    fromMe: false, 
    participant: '0@s.whatsapp.net'
  }, 
  message: { 
    orderMessage: { 
      itemCount: -999999, 
      status: 1, 
      surface: 1, 
      message: global.packname, 
      orderTitle: 'Empire', 
      thumbnail: global.catalogo, 
      sellerJid: '0@s.whatsapp.net'
    }
  }
}

//*─✞─ CANAL ─✞─*
global.ch = { ch1: "120363000000000000@newsletter" }
global.rcanal = global.ch.ch1

//*─✞─ LIBRERÍAS GLOBALES ─✞─*
global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

//*─✞─ NIVELES ─✞─*
global.multiplier = 69
global.maxwarn = 3

//*─✞─ AUTO-RELOAD ─✞─*
const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("♻️ Se actualizó 'imperio/config.js'"))
  import(`${file}?update=${Date.now()}`)
})
