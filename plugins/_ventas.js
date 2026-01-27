import fs from 'fs'
import path from 'path'

// ===== BASE DE DATOS =====
if (!global.db) global.db = { data: {} }
if (!global.db.data) global.db.data = {}
if (!global.db.data.grupos) global.db.data.grupos = {}

function asegurarGrupo(id) {
    if (!global.db.data.grupos[id]) {
        global.db.data.grupos[id] = {
            pagoTexto: "",
            pagoImagen: "" 
        }
    }
}

// ===== HANDLER =====
let handler = async (m, { text, command, conn }) => {
    if (!m.isGroup) return m.reply("Este comando es solo para grupos.")

    asegurarGrupo(m.chat)
    let grupo = global.db.data.grupos[m.chat]

    switch (command) {

        // =======================
        //  GUARDAR TEXTO + IMAGEN
        // =======================
        case "setpago":

            if (!text && !m.msg?.mimetype && !m.quoted?.mimetype)
                return m.reply("Debes enviar texto o imagen.")

            // Guardar texto
            if (text) grupo.pagoTexto = text

            // Detectar imagen
            let mime = m.msg?.mimetype || m.quoted?.mimetype || ""
            if (/image/.test(mime)) {

                let img = await m.download()  // buffer  
                let filename = path.join("src", `pago_${m.chat}.jpg`)

                // Guardar imagen (si existe una anterior la reemplaza)
                fs.writeFileSync(filename, img)

                grupo.pagoImagen = filename
            }

            return m.reply(`✔️ *Información de pago guardada:*\n\n${text || "Imagen guardada"}`)


        // =======================
        // MOSTRAR INFO DE PAGO
        // =======================
        case "pago":

            if (!grupo.pagoTexto && !grupo.pagoImagen)
                return m.reply("No hay información de pago configurada.")

            // Enviar imagen si existe
            if (grupo.pagoImagen && fs.existsSync(grupo.pagoImagen)) {
                return conn.sendFile(
                    m.chat,
                    grupo.pagoImagen,
                    "pago.jpg",
                    grupo.pagoTexto || ""
                )
            }

            // Si no hay imagen, solo texto
            return m.reply(grupo.pagoTexto || "No hay texto guardado.")
    }
}

handler.command = /^(setpago|pago)$/i
export default handler