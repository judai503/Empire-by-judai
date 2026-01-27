import fs from 'fs'
import path from 'path'

const handler = async (m, { conn }) => {
  try {
    const jadiPath = global.jadi || path.join(process.cwd(), 'jadi')
    const dirs = fs.existsSync(jadiPath) ? fs.readdirSync(jadiPath) : []
    const antes = dirs.length

    // Elimina carpetas de sub-bots que ya no tienen conexión activa
    for (const dir of dirs) {
      const fullPath = path.join(jadiPath, dir)
      const stillActive = global.conns?.some(c => c.user?.id?.includes(dir))
      if (!stillActive) {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`🧹 Carpeta de sub-bot eliminada: ${dir}`)
      }
    }

    // Limpia el array global de conexiones inválidas
    global.conns = global.conns?.filter(c => c?.user?.id) || []

    const despues = fs.existsSync(jadiPath) ? fs.readdirSync(jadiPath).length : 0
    const eliminadas = antes - despues

    await m.reply(
      `✨ *Limpieza completada* ✨\n\n` +
      `🧩 Sesiones antes: ${antes}\n` +
      `🧽 Sesiones ahora: ${despues}\n` +
      `✅ Eliminadas: ${eliminadas}\n\n` +
      `♻️ Reiniciando el bot para aplicar los cambios...`
    )

    // Espera 3 segundos y reinicia el handler (sin cerrar sesión principal)
    setTimeout(async () => {
      if (typeof global.reloadHandler === 'function') {
        await global.reloadHandler(true)
        console.log('✅ Bot recargado tras limpieza.')
      } else {
        console.log('⚠️ No se encontró la función global.reloadHandler.')
      }
    }, 3000)

  } catch (err) {
    console.error(err)
    await m.reply(`⚠️ Ocurrió un error al limpiar las sesiones:\n\n${err.message}`)
  }
}

handler.help = ['clean']
handler.tags = ['owner']
handler.command = /^clean$/i
handler.rowner = true // solo el dueño puede usarlo

export default handler