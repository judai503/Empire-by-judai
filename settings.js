import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

//*─⭒ Configuración global del bot Empire ─⭒─*

// Bot number para modo código (opción 2)
global.botNumber = "" // Ejemplo: 57360438371

// Dueños y permisos
global.owner = ["50360438371"] // Único owner
global.suittag = ["50360438371"] 
global.prems = ["50360438371"]
global.judai = ["50360438371"]

// Librería y versiones
global.libreria = "Baileys Multi Device"
global.vs = "^1.3"
global.nameqr = "『Empire』"
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.EmpireJadibts = true

// Prefijos
global.prefix = new RegExp('^[#!./-]?')
global.sinprefix = false 

// Información del bot
global.botname = "『Empire』"
global.textbot = "『Empire』 • Powered By Judai"
global.dev = "Powered By Judai"
global.author = "『Empire』 • Powered By Judai"
global.etiqueta = "Judai"
global.currency = "¥enes"
global.banner = "https://github.com/judai503/Empire-by-judai/blob/main/lib/catalogo.jpg"
global.icono = "https://github.com/judai503/Empire-by-judai/blob/main/lib/catalogo.jpg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

// Enlaces eliminados, no se usan
global.group = ""
global.community = ""
global.channel = ""
global.github = ""
global.gmail = ""
global.ch = {}

// APIs externas
global.APIs = {
xyro: { url: "https://xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null },
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null },
adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
}

// Watch para recargar automáticamente
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'settings.js'"))
    import(`${file}?update=${Date.now()}`)
})
