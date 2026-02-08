// 🧠 Sistema anti-spam de comandos erróneos
if (!global.commandFails) global.commandFails = {}

let user = m.sender
let now = Date.now()

if (!global.commandFails[user]) {
    global.commandFails[user] = {
        count: 0,
        time: now
    }
}

let data = global.commandFails[user]

// Si pasó más de 1 minuto, reiniciar contador
if (now - data.time > 60_000) {
    data.count = 0
    data.time = now
}

if (validCommand(command, global.plugins)) {
    // No hacer nada si es comando válido
} else {
    data.count++

    if (data.count >= 15) {
        return await m.reply(`
⚠️ *Demasiados comandos incorrectos*

🤖 Has usado *15 comandos inválidos* en menos de 1 minuto.

🕒 Por favor, espera un momento antes de seguir intentando.

📖 Usa:
> *${usedPrefix}help*

para ver los comandos disponibles.
`.trim())
    }

    const comando = command
    await m.reply(`
❌ *Comando no encontrado*

🔍 El comando:
> *${usedPrefix}${comando}*

no existe.

📖 Usa:
> *${usedPrefix}help*

para ver la lista de comandos disponibles.
`.trim())
}
