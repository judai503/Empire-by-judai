import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { setupMaster, fork } from 'cluster'
import { existsSync, writeFileSync } from 'fs'
import cfonts from 'cfonts'
import chalk from 'chalk'

console.log(chalk.bold.hex('#FFD700')('\n♛─ Iniciando EMPIRE BOT ─♛'))

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
require(join(__dirname, './package.json'))

async function barraCargaEmpire() {
  const frames = [
    '[⚙️] Iniciando núcleo Empire...',
    '[🏛️] Construyendo imperio...',
    '[🔐] Verificando sistemas...',
    '[📡] Sincronizando módulos...',
    '[⚡] Activando protocolos...',
    '[👑] EMPIRE 100% OPERATIVO.'
  ]
  for (let frame of frames) {
    process.stdout.write('\r' + chalk.yellowBright(frame))
    await new Promise(res => setTimeout(res, 350))
  }
  console.log()
}

async function animacionEmpire() {
  const frames = [
chalk.hex('#555555')(`
███████╗███╗   ███╗██████╗ ██╗██████╗ ███████╗
██╔════╝████╗ ████║██╔══██╗██║██╔══██╗██╔════╝
█████╗  ██╔████╔██║██████╔╝██║██████╔╝█████╗  
██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║██╔══██╗██╔══╝  
███████╗██║ ╚═╝ ██║██║     ██║██║  ██║███████╗
╚══════╝╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝
        SISTEMA INICIALIZANDO
`),

chalk.hex('#FFD700')(`
███████╗███╗   ███╗██████╗ ██╗██████╗ ███████╗
██╔════╝████╗ ████║██╔══██╗██║██╔══██╗██╔════╝
█████╗  ██╔████╔██║██████╔╝██║██████╔╝█████╗  
██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║██╔══██╗██╔══╝  
███████╗██║ ╚═╝ ██║██║     ██║██║  ██║███████╗
╚══════╝╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝
          👑 EMPIRE ONLINE 👑
`)
  ]

  for (let frame of frames) {
    console.clear()
    console.log(frame)
    await new Promise(res => setTimeout(res, 900))
  }
}

async function iniciarEmpire() {
  console.clear()

  console.log(chalk.bold.yellowBright('\n⟦ 👑 ACCESO CONCEDIDO | EMPIRE CORE V1 ⟧'))
  console.log(chalk.gray('⌬ Iniciando sistemas imperiales...'))
  await new Promise(res => setTimeout(res, 600))

  await animacionEmpire()
  await barraCargaEmpire()

  cfonts.say('EMPIRE', {
    font: 'block',
    align: 'center',
    colors: ['yellow', 'red'],
  })

  console.log(chalk.bold.hex('#FFD700')('\n♛ SISTEMA CREADO POR: El Tio Judai 👑 ♛\n'))
  await new Promise(res => setTimeout(res, 800))
}

// ================================
// ========== CLUSTER =============
// ================================

let isRunning = false

function start(file) {
  if (isRunning) return
  isRunning = true

  // 👉 AQUÍ SE USA LA CARPETA "imperio"
  let args = [join(__dirname, 'imperio', file), ...process.argv.slice(2)]

  setupMaster({ exec: args[0], args: args.slice(1) })
  let p = fork()

  p.on('exit', (_, code) => {
    isRunning = false
    if (code !== 0) start(file)
  })
}

// ================================
// ========= BOOT SCREEN ==========
// ================================

const archivoArranque = './.arranque-ok'

if (!existsSync(archivoArranque)) {
  await iniciarEmpire()
  writeFileSync(archivoArranque, 'EMPIRE_READY')
}

// ================================
// ========= INICIAR BOT ==========
// ================================

start('start.js')
