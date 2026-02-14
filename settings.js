import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

/* > Información de la cuenta owner < */
global.userowner = "El tio Judai"
global.passowner = "Judai"

/* > Información del numero < */
global.botNumber = "" 
global.owner = ["50360438371"]
global.suittag = [""] 
global.prems = []

/* > Información del sistema < */
global.libreria = "@soymaycol/baileys"
global.vs = "^1.8.2|Latest"
global.sessions = "EMPIRE/Principal"
global.jadi = "EMPIRE/SubBots"
global.yukiJadibts = true

/* > Personalizacion del Bot < */
global.botname = 'Empire'
global.textbot = 'Empire'
global.dev = 'Judai'
global.author = 'Judai'
global.etiqueta = 'judai'
global.currency = 'Empire-coins'
global.banner = "LLENAR"
global.icono = "LLENAR"
global.catalogo = fs.readFileSync('./lib/JUDAI.JPG')

/* > Información del Creador < */
global.group = "LLENAR"
global.community = "LLENAR"
global.channel = "LLENAR"
global.github = ""
global.gmail = ""
global.ch = {
ch1: ""
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

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("Update 'settings.js'"))
import(`${file}?update=${Date.now()}`)
})
