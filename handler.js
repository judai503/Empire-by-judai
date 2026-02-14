import chalk from 'chalk'

export async function handler(conn, chatUpdate) {
    try {
        const m = chatUpdate.messages[0]
        if (!m || !m.message) return
        const sender = m.key.remoteJid
        const isGroup = sender.endsWith('@g.us')
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        const isCmd = global.prefix.test(body)
        const command = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : ''

        // 1. SISTEMA DE DATOS (Economía y Gacha)
        let user = global.db.data.users[m.key.participant || sender]
        if (!user) global.db.data.users[m.key.participant || sender] = {
            coins: 100,
            exp: 0,
            level: 1,
            lastWork: 0,
            banned: false
        }

        // 2. ANTI-PRIVADO (Solo responde si es el owner)
        if (!isGroup && isCmd && !global.owner.some(o => o[0] === sender.split('@')[0])) {
            return conn.sendMessage(sender, { text: '❌ *El Imperio no responde comandos al privado. Use los grupos oficiales.*' })
        }

        // 3. COMANDOS DE PRUEBA (Economía)
        if (command === 'balance' || command === 'coins') {
            await conn.sendMessage(sender, { text: `💰 *Tu Balance:* ${global.db.data.users[m.key.participant || sender].coins} EmpireCoins` })
        }

        if (command === 'trabajar' || command === 'work') {
            let time = Date.now()
            if (time - user.lastWork < 600000) return conn.sendMessage(sender, { text: '⏳ *El Imperio te ordena descansar. Vuelve en 10 min.*' })
            let ganancia = Math.floor(Math.random() * 500)
            user.coins += ganancia
            user.lastWork = time
            await conn.sendMessage(sender, { text: `⚒️ *Trabajaste duro para el Imperio!* Ganaste: ${ganancia} coins.` })
        }

        await global.db.write()
    } catch (e) { console.error(e) }
}
