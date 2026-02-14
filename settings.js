import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

/* > Información de la cuenta owner < */
global.userowner = "Judai"
global.passowner = "empire2026"

/* > Información del numero < */
global.owner = ["50360438371"] 
global.suittag = ["50360438371"] 
global.prems = []

/* > Información del sistema < */
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
global.currency = 'EmpireCoins' 
global.banner = "" 
global.icono = "https://files.catbox.moe/ycagn5.jpeg"

/* > Redes y Canales < */
global.ig = "" 
global.group = "https://chat.whatsapp.com/JNQMGcG9jl00jYBM1iV8Jn"
global.channel = "https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R"
global.ch = { ch1: "" }

/* > Estilo de mensajes < */
global.wait = '👑 *Cargando... El Imperio está procesando su solicitud.*'
global.error = '❌ *Hubo un error en el sistema del Imperio.*'

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.yellowBright("👑 Update 'settings.js'"))
  import(`${file}?update=${Date.now()}`)
})
