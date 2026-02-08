import fetch from 'node-fetch'
import yts from 'yt-search'
import axios from 'axios'

const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav']
const formatVideo = ['360', '480', '720', '1080', '1440', '4k']

const ddownr = {
  download: async (url, format) => {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
      throw new Error('Formato no soportado')
    }

    const config = {
      method: 'GET',
      url: `https://p.savenow.to/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }

    const response = await axios.request(config)

    if (!response.data?.success) {
      throw new Error('No se pudo obtener el video')
    }

    const { id, title, info } = response.data
    const downloadUrl = await ddownr.cekProgress(id)

    return {
      title,
      image: info.image,
      downloadUrl
    }
  },

  cekProgress: async (id) => {
    while (true) {
      const res = await axios.get(`https://p.savenow.to/ajax/progress.php?id=${id}`)
      if (res.data?.success && res.data.progress === 1000) {
        return res.data.download_url
      }
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

function formatViews(views) {
  try {
    return views >= 1000
      ? `${(views / 1000).toFixed(1)}k (${views.toLocaleString()})`
      : views.toString()
  } catch {
    return '0'
  }
}

export default {
  command: [
    'play', 'mp3', 'yta', 'ytmp3',
    'play2', 'mp4', 'ytv'
  ],
  category: 'downloader',

  run: async (client, m, args, usedPrefix, command) => {
    try {
      const text = args.join(' ')
      if (!text) return m.reply('✎ Escribe el nombre de la canción')

      const search = await yts(text)
      if (!search.all.length) return m.reply('No se encontraron resultados')

      const video = search.all.find(v => v.ago) || search.all[0]
      const { title, thumbnail, timestamp, views, ago, url } = video

      const vistaTexto = formatViews(views)
      const thumb = await (await fetch(thumbnail)).buffer()

      await client.sendMessage(m.chat, {
        image: thumb,
        caption: `┌──⊰🍁 YOUTUBE 🍁⊰
│✍️ Título: ${title}
│📆 Publicado: ${ago}
│🕟 Duración: ${timestamp}
│👁️ Vistas: ${vistaTexto}
└──────────⊰`
      }, { quoted: m })

      /* AUDIO */
      if (['play', 'mp3', 'yta', 'ytmp3'].includes(command)) {
        try {
          const api = await ddownr.download(url, 'mp3')
          await client.sendMessage(m.chat, {
            audio: { url: api.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          }, { quoted: m })
        } catch {
          const api = await fetch(`https://api.stellarwa.xyz/dl/ytmp3?url=${url}&key=proyectsV2`).then(r => r.json())
          const dl = api?.data?.dl
          if (!dl) throw 'Error'
          await client.sendMessage(m.chat, {
            audio: { url: dl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          }, { quoted: m })
        }
      }

      /* VIDEO */
      if (['play2', 'mp4', 'ytv'].includes(command)) {
        const fuentes = [
          `https://api.stellarwa.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&quality=720&key=proyectsV2`,
          `https://nexevo-api.vercel.app/download/y2?url=${url}`
        ]

        for (const fuente of fuentes) {
          try {
            const res = await fetch(fuente).then(r => r.json())
            const dl =
              res?.result?.url ||
              res?.data?.dl ||
              res?.data?.download?.url

            if (dl) {
              await client.sendMessage(m.chat, {
                video: { url: dl },
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption: '✅ Video descargado'
              }, { quoted: m })
              return
            }
          } catch {}
        }

        return m.reply('✱ No se pudo descargar el video')
      }

    } catch (e) {
      console.error(e)
      m.reply('❌ Error al procesar la descarga')
    }
  }
    }
