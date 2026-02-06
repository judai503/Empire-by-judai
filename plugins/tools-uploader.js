import { createHash } from 'crypto'
import fetch from 'node-fetch'
import axios from 'axios'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import cheerio from 'cheerio'
import qs from 'qs'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const handler = async (m, { conn, command, usedPrefix, text, args }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        
        const toStyled = (text) => {
            const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥAƂCƊҼFƓHIJƘLMƝOƤQƦSƬUƲWXYZ"
            return text.split('').map(char => {
                let i = normal.indexOf(char)
                return i !== -1 ? styled[i] : char
            }).join('')
        }

        if (!text) {
            let menuText = `•——————•°•✿•°•——————•
╰┈➤ ${toStyled("Uploader Services")} ⌇°•
⊱┊ ᴴᵉᶜʰᵒ ᵖᵒʳ ${toStyled("TuBot")}
●～●～●～●～●～●～●～●～

➮ ${toStyled("Responde a un archivo con:")}
➮ *${usedPrefix + command} mediafire*
➮ *${usedPrefix + command} catbox*
➮ *${usedPrefix + command} litter*
➮ *${usedPrefix + command} ultra*
➮ *${usedPrefix + command} wpfc* (Solo Imágenes)

ׂ╰┈➤ ${toStyled("Selecciona un servicio de la lista.")}`.trim()

            return conn.reply(m.chat, menuText, m)
        }

        if (!mime) return conn.reply(m.chat, `❀ ${toStyled("Por favor, responde a una Imagen, Video o Archivo.")}`, m)
        
        await m.react('🕒')
        const media = await q.download()
        const fileType = await fileTypeFromBuffer(media) || { ext: 'bin', mime: 'application/octet-stream' }
        const filename = `${crypto.randomBytes(4).toString('hex')}.${fileType.ext}`
        const isImage = /image/i.test(mime)
        const service = text.toLowerCase().trim()

        let link = ''
        let resultJson = {}

        try {
            switch (service) {
                case 'mediafire':
                    const mfResult = await uploadMediaFire(media, filename, fileType.ext)
                    if (mfResult.status === 'error') throw new Error(JSON.stringify(mfResult))
                    link = mfResult.upload.file_url || mfResult.upload.view_url
                    resultJson = mfResult
                    break

                case 'catbox':
                    link = await catbox(media)
                    break

                case 'wpfc':
                    if (!isImage) throw new Error("Este servicio solo admite imágenes.")
                    link = await wpImage(media, fileType.ext)
                    break
                
                case 'litter':
                    link = await litter(media)
                    break

                case 'ultra':
                    link = await ultraplus(media, filename)
                    break

                default:
                    return conn.reply(m.chat, `⚠︎ ${toStyled("Servicio no reconocido. Usa el comando sin argumentos para ver la lista.")}`, m)
            }

            if (!link) throw new Error("No se pudo obtener el enlace.")

            const txt = `乂  *${toStyled(service.toUpperCase())} - U P L O A D*  乂\n\n*» ${toStyled("Enlace")}* : ${link}\n*» ${toStyled("Tamaño")}* : ${formatBytes(media.length)}\n*» ${toStyled("Tipo")}* : ${mime}\n\n> *${toStyled("Subido con éxito")}`

            const buttonMessage = {
                text: txt,
                footer: toStyled("Click en el botón para ver"),
                buttons: [
                    {
                        buttonId: 'action',
                        buttonText: { displayText: toStyled("Ver Archivo") },
                        type: 4, 
                        nativeFlowInfo: {
                            name: 'cta_url',
                            paramsJson: JSON.stringify({
                                display_text: toStyled("Ver Enlace"),
                                url: link,
                                merchant_url: link
                            })
                        }
                    }
                ],
                headerType: 1,
                viewOnce: true
            }

            await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
            await m.react('✔️')

        } catch (serviceError) {
            console.error(serviceError)
            let errorMsg = serviceError.message
            try {
                const parsed = JSON.parse(serviceError.message)
                errorMsg = JSON.stringify(parsed, null, 2)
            } catch (e) {}
            
            await conn.reply(m.chat, `⚠︎ ${toStyled("Error en el servicio:")}\n\n${errorMsg}`, m)
            await m.react('✖️')
        }

    } catch (error) {
        console.error(error)
        await m.react('✖️')
        await conn.reply(m.chat, `⚠︎ ${toStyled("Error critico del sistema.")}\n${error.message}`, m)
    }
}

handler.help = ['tourl <servicio>']
handler.tags = ['tools']
handler.command = ['tourl', 'upload']

export default handler

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

async function catbox(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(5).toString("hex")
    formData.append("reqtype", "fileupload")
    formData.append("fileToUpload", blob, randomBytes + "." + ext)
    const response = await fetch("https://catbox.moe/user/api.php", { 
        method: "POST", 
        body: formData, 
        headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" }
    })
    return await response.text()
}

async function wpImage(buffer, ext) {
    const formData = new FormData()
    const blob = new Blob([buffer], { type: `image/${ext}` })
    const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`
    
    formData.append("fileToUpload", blob, filename)

    const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
        method: "POST",
        body: formData,
        headers: {
            "Accept": "/",
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
            "Origin": "https://www.wpfastestcache.com"
        }
    })
    
    const data = await response.json()
    if (data.success) return data.url
    throw new Error(JSON.stringify(data))
}

async function ultraplus(buffer, filename) {
    const formData = new FormData()
    const blob = new Blob([buffer])
    formData.append("file", blob, filename)
    
    const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
    })
    
    const data = await response.json()
    if (data.success) return data.url
    throw new Error(JSON.stringify(data))
}

async function litter(buffer) {
    const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {}
    const form = new FormData()
    const blob = new Blob([buffer], { type: mime })
    form.append("file", blob, `file.${ext}`)
    form.append("expireAfter", "99999999999999")
    form.append("burn", "false")

    const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });

    const response = await fetch(`https://litter.lusia.moe/post/upload?token=${token}`, {
        method: "POST",
        body: form,
        headers: {
            "authority": "litter.lusia.moe",
            "origin": "https://litter.lusia.moe",
            "referer": "https://litter.lusia.moe/",
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        }
    })

    const data = await response.json()
    if (data.path) return `https://litter.lusia.moe/${data.path}`
    throw new Error(JSON.stringify(data))
}

async function uploadMediaFire(buffer, filename, ext) {
    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } }))
    
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const rand = (n = 6) => Math.random().toString(36).slice(2, 2 + n)
    const genEmail = () => `${rand()}@baguss.xyz`
    const PASSWORD = "bagusapi2134"

    try {
        const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html" } })
        const $ = cheerio.load(res.data)
        const security = $('input[name="security"]').val()
        if (!security) throw new Error("SECURITY_TOKEN_NOT_FOUND")

        const email = genEmail()
        const payload = qs.stringify({
            security,
            reg_first_name: "User",
            reg_last_name: "Temp",
            reg_email: email,
            reg_display: "",
            reg_pass: PASSWORD,
            agreement: "3.25",
            pid: "free",
            signup_continue: "Create Account & Continue"
        })

        const regRes = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Origin: "https://www.mediafire.com",
                Referer: "https://www.mediafire.com/upgrade/registration.php?pid=free"
            }
        })

        if (regRes.data?.status !== "success" || !regRes.data?.session_token) {
            return { status: "error", message: "REGISTER_FAILED", details: regRes.data }
        }

        const sessionToken = regRes.data.session_token
        const form = new FormData()
        const blob = new Blob([buffer])
        form.append("filename", blob, filename)
        form.append("uploadapi", "yes")
        form.append("response_format", "json")

        const uploadInit = await fetch("https://www.mediafire.com/api/upload/upload.php?session_token=" + encodeURIComponent(sessionToken), {
            method: 'POST',
            body: form,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        })

        const initData = await uploadInit.json()
        const keyMatch = (JSON.stringify(initData)).match(/<key>(.*?)<\/key>/i)
        const key = initData?.response?.doupload?.key || (keyMatch ? keyMatch[1] : null)
        
        if (!key) return { status: "error", message: "UPLOAD_KEY_NOT_FOUND", raw: initData }

        let result = null
        while (true) {
            const pollRes = await client.post("https://www.mediafire.com/api/upload/poll_upload.php?session_token=" + encodeURIComponent(sessionToken),
                qs.stringify({ key, response_format: "json" }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            )

            const data = pollRes?.data?.response?.doupload
            if (data?.status === "99") {
                const quickkey = data.quickkey || key
                result = {
                    filename,
                    quickkey,
                    view_url: `https://www.mediafire.com/view/${quickkey}/${encodeURIComponent(filename)}/file`,
                    file_url: `https://www.mediafire.com/file/${quickkey}/${encodeURIComponent(filename)}`
                }
                break
            }
            if (data?.status && data.status !== "99" && parseInt(data.status) < 0) {
                 return { status: "error", message: "POLL_ERROR", details: data }
            }
            await sleep(1500)
        }

        return { status: "success", email, session_token: sessionToken, upload: result }

    } catch (err) {
        return { status: "error", message: err.message, stack: err.stack }
    }
}
