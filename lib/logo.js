import cfonts from 'cfonts'
import chalk from 'chalk'

export function displayLogo() {
    // Limpia la consola para que el logo se vea arriba siempre
    console.clear() 

    cfonts.say('EMPIRE\nMD', {
        font: 'block',
        align: 'center',
        colors: ['yellow', 'black'],
        background: 'transparent',
        letterSpacing: 1,
        lineHeight: 1,
        space: true,
        maxLength: '0',
    })

    console.log(chalk.yellowBright.bold(`
  👑 SISTEMA OPERATIVO DEL IMPERIO 👑
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  💻 Developer : Judai
  🚀 Versión   : ${global.vs || '2.0'}
  📂 Sesión    : ${global.sessions || 'Principal'}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `))
}
