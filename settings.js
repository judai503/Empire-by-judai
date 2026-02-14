import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

/* > Información de la cuenta owner < */
global.userowner = "Judai"
global.passowner = "empire2026"

/* > Información del numero < */
global.botNumber = "" 
global.owner = ["50360438371"] 
global.suittag = ["50360438371"] 
global.prems = []

/* > Información del sistema < */
global.libreria = "@whiskeysockets/baileys"
global.vs = "V2 | Latest"
global.sessions = "session/Principal" 
global.jadi = "session/SubBots"      
global.yukiJadibts = true

/* > Personalizacion del Bot < */
global.botname = '👑 𝐄𝐌𝐏𝐈𝐑𝐄-𝐌𝐃 👑'
global.wm = '𝐄𝐌𝐏𝐈𝐑𝐄-𝐌𝐃'
global.titulowm = '𝐄𝐌𝐏𝐈𝐑𝐄-𝐌𝐃 ⌇ 𝐉𝐔𝐃𝐀𝐈'
global.dev = '𝐉𝐮𝐝𝐚𝐢 ⌇°•'
global.author = '𝐉𝐮𝐝𝐚𝐢 ⌇°•'
global.etiqueta = '𝐄𝐌𝐏𝐈𝐑𝐄'
global.currency = 'EmpireCoins' 
global.banner = "" // ⬅️ BANNER ELIMINADO
global.icono = "https://files.catbox.moe/ycagn5.jpeg"
global.catalogo = "" // ⬅️ CATÁLOGO ELIMINADO

/* > Información del Creador < */
global.ig = "" 
global.group = "https://chat.whatsapp.com/JNQMGcG9jl00jYBM1iV8Jn"
global.community = "https://chat.whatsapp.com/KqkJwla1aq1LgaPiuFFtEY"
global.channel = "https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R"
global.github = "" 
global.gmail = "" 
global.ch = {
  ch1: "" // ⬅️ CANAL NEWSLETTER ELIMINADO
}

/* > Lista de API's para usar < */
global.APIs = {
  xyro: { url: "https://api.xyro.site", key: null },
  yupra: { url: "https://api.yupra.my.id", key: null },
  vreden: { url: "https://api.vreden.web.id", key: null },
  delirius: { url: "https://api.delirius.store", key: null },
  zenzxz: { url: "https://api.zenzxz.my.id", key: null },
  siputzx: { url: "https://api.siputzx.my.id", key: null },
  adonix: { url: "https://api-adonix.ultraplus.click", key: 'Adofreekey' }
}

/* > Estilo de mensajes < */
global.wait = '👑 *Cargando... El Imperio está procesando su solicitud.*'
global.error = '❌ *Hubo un error en el sistema del Imperio.*'

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.yellowBright("👑 Update 'settings.js' - Empire Config Cleaned"))
  import(`${file}?update=${Date.now()}`)
})
