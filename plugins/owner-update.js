import { execSync } from 'child_process'

var handler = async (m, { conn, text, isROwner }) => {
if (!isROwner) return
await m.react('🕒')
try {
const stdout = execSync('git pull' + (m.fromMe && text ? ' ' + text : ''))
let messager = stdout.toString()
if (messager.includes('Already up to date.')) messager = '❀ Los datos ya están actualizados a la última versión.'
if (messager.includes('Updating')) messager = '❀ Procesando, espere un momento mientras me actualizo.\n\n' + stdout.toString()
await m.react('✔️')
conn.reply(m.chat, messager, m)
} catch {
try {
const status = execSync('git status --porcelain')
if (status.length === 0) throw ''
const conflictedFiles = status.toString().split('\n')
.filter(line => line.trim() !== '')
.filter(line => !line.includes('.npm/') && !line.includes('.cache/') && !line.includes('tmp/') && !line.includes('database/db.json') && !line.includes('Sessions/Principal/') && !line.includes('npm-debug.log'))
.map(line => '*→ ' + line.slice(3) + '*')
if (conflictedFiles.length > 0) {
const errorMessage = `\`⚠︎ No se pudo realizar la actualización:\`\n\n> *Se han encontrado cambios locales en los archivos del bot que entran en conflicto con las nuevas actualizaciones del repositorio.*\n\n${conflictedFiles.join('\n')}`
await conn.reply(m.chat, errorMessage, m)
await m.react('✖️')
return
}
} catch {
let errorMessage = '⚠︎ Ocurrió un error inesperado al intentar actualizar.'
await conn.reply(m.chat, errorMessage, m)
await m.react('✖️')
}
}}

handler.help = ['update']
handler.tags = ['owner']
handler.command = /^(update|actualizar|fix)$/i
handler.rowner = true

export default handler