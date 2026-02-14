                                    return Promise.resolve(user);
                                        }
                                    };
                                    const processed = mentioned.map(processJid);
     import path from 'path'  
import { toAudio } from './converter.js'
import chalk from 'chalk'
import fetch from 'node-fetch'
import PhoneNumber from 'awesome-phonenumber'
import fs from 'fs'
import util from 'util'
import { fileTypeFromBuffer } from 'file-type' 
import { format } from 'util'
import { fileURLToPath } from 'url'
import store from './store.js'
import pino from 'pino'
import * as baileys from "@whiskeysockets/baileys"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {
    default: _makeWaSocket,
    makeWALegacySocket,
    proto,
    generateWAMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    delay,
    jidDecode,
    areJidsSameUser,
} = (await import('@whiskeysockets/baileys')).default

export function makeWASocket(connectionOptions, options = {}) {
    const conn = (global.opts["legacy"] ? makeWALegacySocket : _makeWaSocket)(connectionOptions);

    const sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true,
        },
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== "string") return jid || null;
                return jid.decodeJid();
            },
        },
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 204, 0)(` EMPIRE INFO `),
                            `[${chalk.white(new Date().toLocaleTimeString())}]:`,
                            chalk.yellow(format(...args)),
                        );
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 0, 0)(` EMPIRE ERROR `),
                            `[${chalk.white(new Date().toLocaleTimeString())}]:`,
                            chalk.red(format(...args)),
                        );
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)(` EMPIRE WARN `),
                            `[${chalk.white(new Date().toLocaleTimeString())}]:`,
                            chalk.orange(format(...args)),
                        );
                    }
                };
            },
            enumerable: true,
        },

        /**
         * Enviar Anuncio estilo Judai
         */
        sendEmpireAd: {
            async value(jid, text = '', buffer, title, body, url, quoted, options) {
                let thumb;
                if (buffer) {
                    try { thumb = (await conn.getFile(buffer)).data } catch { thumb = buffer }
                }
                let prep = generateWAMessageFromContent(jid, { 
                    extendedTextMessage: { 
                        text: text, 
                        contextInfo: { 
                            externalAdReply: { 
                                title: title || global.titulowm, 
                                body: body || global.wm, 
                                thumbnail: thumb, 
                                sourceUrl: url || global.ig,
                                showAdAttribution: true
                            }, 
                            mentionedJid: await conn.parseMention(text) 
                        }
                    }
                }, { quoted: quoted })
                return conn.relayMessage(jid, prep.message, { messageId: prep.key.id })
            }
        },

        /**
         * Enviar Álbum de Medios (Empire Album)
         */
        sendAlbum: {
            async value(jid, medias, options = {}) {
                if (medias.length < 2) throw new RangeError("Mínimo 2 archivos para un álbum.");
                
                const album = generateWAMessageFromContent(jid, {
                    albumMessage: {
                        expectedImageCount: medias.filter(m => m.type === "image").length,
                        expectedVideoCount: medias.filter(m => m.type === "video").length,
                        contextInfo: options.quoted ? {
                            stanzaId: options.quoted.key.id,
                            participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                            quotedMessage: options.quoted.message,
                        } : {}
                    }
                }, {});

                await conn.relayMessage(jid, album.message, { messageId: album.key.id });
                
                for (const media of medias) {
                    const msg = await generateWAMessage(jid, { [media.type]: media.data, caption: media.caption || "" }, { upload: conn.waUploadToServer });
                    msg.message.messageContextInfo = { messageAssociation: { associationType: 1, parentMessageKey: album.key } };
                    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
                    await delay(500);
                }
                return album;
            }
        },

        getFile: {
            async value(PATH, saveToFile = false) {
                let res, filename;
                const data = Buffer.isBuffer(PATH) ? PATH : 
                             PATH instanceof ArrayBuffer ? Buffer.from(PATH) : 
                             /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], "base64") : 
                             /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : 
                             fs.existsSync(PATH) ? ((filename = PATH), fs.readFileSync(PATH)) : 
                             typeof PATH === "string" ? PATH : Buffer.alloc(0);

                if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
                const type = (await fileTypeFromBuffer(data)) || { mime: "application/octet-stream", ext: ".bin" };
                
                if (data && saveToFile && !filename) {
                    filename = path.join(__dirname, "../tmp/" + Date.now() + "." + type.ext);
                    await fs.promises.writeFile(filename, data);
                }
                return { res, filename, ...type, data, deleteFile() { return filename && fs.promises.unlink(filename) } };
            },
            enumerable: true,
        },

        sendFile: {
            async value(jid, path, filename = "", caption = "", quoted, ptt = false, options = {}) {
                const type = await conn.getFile(path, true);
                let { data: file, filename: pathFile, mime, ext } = type;
                
                let mtype = "";
                let mimetype = options.mimetype || mime;
                
                if (/webp/.test(mime) || (/image/.test(mime) && options.asSticker)) mtype = "sticker";
                else if (/image/.test(mime) || (/webp/.test(mime) && options.asImage)) mtype = "image";
                else if (/video/.test(mime)) mtype = "video";
                else if (/audio/.test(mime)) {
                    const convert = await toAudio(file, ext);
                    file = convert.data;
                    pathFile = convert.filename;
                    mtype = "audio";
                    mimetype = "audio/mpeg; codecs=opus";
                } else mtype = "document";

                if (options.asDocument) mtype = "document";

                const message = {
                    ...options,
                    caption,
                    ptt,
                    [mtype]: { url: pathFile },
                    mimetype,
                    fileName: filename || pathFile.split("/").pop(),
                };

                let m;
                try {
                    m = await conn.sendMessage(jid, message, { quoted, ...options });
                } catch (e) {
                    m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { quoted, ...options });
                } finally {
                    file = null;
                    return m;
                }
            },
            enumerable: true,
        },

        reply: {
            value(jid, text = "", quoted, options) {
                return Buffer.isBuffer(text) ?
                    conn.sendFile(jid, text, "file", "", quoted, false, options) :
                    conn.sendMessage(jid, { text, ...options }, { quoted, ...options });
            },
        },

        parseMention: {
            value(text = "") {
                return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + "@s.whatsapp.net");
            }
        },

        getName: {
            value(jid) {
                let id = conn.decodeJid(jid);
                let v = id.endsWith("@g.us") ? (conn.chats[id] || {}) : (conn.chats[id] || {});
                return v.name || v.subject || v.verifiedName || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international');
            }
        }
    });

    return sock;
}
                               return Promise.all(processed)
                                        .then(jids => jids.filter(jid => jid && typeof jid === "string"))
                                        .catch(e => {
                                            console.error("Error in mentionedJid processing:", e);
                                            return mentioned.filter(jid => jid && typeof jid === "string");
                                        });
                                },
                                enumerable: true,
                            },
                            name: {
                                get() {
                                    const sender = this.sender;
                                    return sender ? self.conn?.getName?.(sender) : null;
                                },
                                enumerable: true,
                            },
                            vM: {
                                get() {
                                    return proto.WebMessageInfo.fromObject({
                                        key: {
                                            fromMe: this.fromMe,
                                            remoteJid: this.chat,
                                            id: this.id,
                                        },
                                        message: quoted,
                                        ...(self.isGroup ? {
                                            participant: this.sender
                                        } : {}),
                                    });
                                },
                                enumerable: true,
                            },
                            fakeObj: {
                                get() {
                                    return this.vM;
                                },
                                enumerable: true,
                            },
                            download: {
                                value(saveToFile = false) {
                                    const mtype = this.mediaType;
                                    return self.conn?.downloadM?.(
                                        this.mediaMessage?.[mtype],
                                        mtype?.replace(/message/i, ""),
                                        saveToFile,
                                    );
                                },
                                enumerable: true,
                                configurable: true,
                            },
                            reply: {
                                value(text, chatId, options) {
                                    return self.conn?.reply?.(
                                        chatId ? chatId : this.chat,
                                        text,
                                        this.vM,
                                        options,
                                    );
                                },
                                enumerable: true,
                            },
                            copy: {
                                value() {
                                    const M = proto.WebMessageInfo;
                                    return smsg(self.conn, M.fromObject(M.toObject(this.vM)));
                                },
                                enumerable: true,
                            },
                            forward: {
                                value(jid, force = false, options) {
                                    return self.conn?.sendMessage?.(
                                        jid, {
                                            forward: this.vM,
                                            force,
                                            ...options,
                                        }, {
                                            ...options
                                        },
                                    );
                                },
                                enumerable: true,
                            },
                            copyNForward: {
                                value(jid, forceForward = false, options) {
                                    return self.conn?.copyNForward?.(
                                        jid,
                                        this.vM,
                                        forceForward,
                                        options,
                                    );
                                },
                                enumerable: true,
                            },
                            cMod: {
                                value(jid, text = "", sender = this.sender, options = {}) {
                                    return self.conn?.cMod?.(jid, this.vM, text, sender, options);
                                },
                                enumerable: true,
                            },
                            delete: {
                                value() {
                                    return self.conn?.sendMessage?.(this.chat, {
                                        delete: this.vM.key,
                                    });
                                },
                                enumerable: true,
                            },
                        },
                    );
                } catch (e) {
                    console.error("Error en quoted getter:", e);
                    return null;
                }
            },
            enumerable: true,
        },
        _text: {
            value: null,
            writable: true,
            enumerable: true,
        },
        text: {
            get() {
                try {
                    const msg = this.msg;
                    const text =
                        (typeof msg === "string" ? msg : msg?.text) ||
                        msg?.caption ||
                        msg?.contentText ||
                        "";
                    return typeof this._text === "string" ?
                        this._text :
                        "" ||
                        (typeof text === "string" ?
                            text :
                            text?.selectedDisplayText ||
                            text?.hydratedTemplate?.hydratedContentText ||
                            text) ||
                        "";
                } catch (e) {
                    console.error("Error en text getter:", e);
                    return "";
                }
            },
            set(str) {
                this._text = str;
            },
            enumerable: true,
        },
        mentionedJid: {
            get() {
                try {
                    const mentioned = this.msg?.contextInfo?.mentionedJid || [];
                    const groupChatId = this.chat?.endsWith("@g.us") ? this.chat : null;

                    const processJid = (user) => {
                        try {
                            if (user && typeof user === "object") {
                                user = user.lid || user.jid || user.id || "";
                            }
                            if (typeof user === "string" && user.includes("@lid") && groupChatId) {
                                const resolved = String.prototype.resolveLidToRealJid.call(
                                    user,
                                    groupChatId,
                                    this.conn
                                );
                                return resolved.then(res => typeof res === "string" ? res : user);
                            }
                            return Promise.resolve(user);
                        } catch (e) {
                            console.error("Error processing JID:", user, e);
                            return Promise.resolve(user);
                        }
                    };

                    const processed = mentioned.map(processJid);

                    return Promise.all(processed)
                        .then(jids => jids.filter(jid => jid && typeof jid === "string"))
                        .catch(e => {
                            console.error("Error en mentionedJid getter:", e);
                            return [];
                        });
                } catch (e) {
                    console.error("Error en mentionedJid getter:", e);
                    return Promise.resolve([]);
                }
            },
            enumerable: true,
        },
        name: {
            get() {
                try {
                    if (!nullish(this.pushName) && this.pushName) return this.pushName;
                    const sender = this.sender;
                    return sender ? this.conn?.getName?.(sender) : "";
                } catch (e) {
                    console.error("Error en name getter:", e);
                    return "";
                }
            },
            enumerable: true,
        },
        download: {
            value(saveToFile = false) {
                try {
                    const mtype = this.mediaType;
                    return this.conn?.downloadM?.(
                        this.mediaMessage?.[mtype],
                        mtype?.replace(/message/i, ""),
                        saveToFile,
                    );
                } catch (e) {
                    console.error("Error en download:", e);
                    return Promise.reject(e);
                }
            },
            enumerable: true,
            configurable: true,
        },
        reply: {
            value(text, chatId, options) {
                try {
                    return this.conn?.reply?.(
                        chatId ? chatId : this.chat,
                        text,
                        this,
                        options,
                    );
                } catch (e) {
                    console.error("Error en reply:", e);
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        copy: {
            value() {
                try {
                    const M = proto.WebMessageInfo;
                    return smsg(this.conn, M.fromObject(M.toObject(this)));
                } catch (e) {
                    console.error("Error en copy:", e);
                    return null;
                }
            },
            enumerable: true,
        },
        forward: {
            value(jid, force = false, options = {}) {
                try {
                    return this.conn?.sendMessage?.(
                        jid, {
                            forward: this,
                            force,
                            ...options,
                        }, {
                            ...options
                        },
                    );
                } catch (e) {
                    console.error("Error en forward:", e);
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        copyNForward: {
            value(jid, forceForward = false, options = {}) {
                try {
                    return this.conn?.copyNForward?.(jid, this, forceForward, options);
                } catch (e) {
                    console.error("Error en copyNForward:", e);
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        cMod: {
            value(jid, text = "", sender = this.sender, options = {}) {
                try {
                    return this.conn?.cMod?.(jid, this, text, sender, options);
                } catch (e) {
                    console.error("Error en cMod:", e);
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
        getQuotedObj: {
            value() {
                try {
                    if (!this.quoted?.id) return null;
                    const q = proto.WebMessageInfo.fromObject(
                        this.conn?.loadMessage?.(this.quoted.id) || this.quoted.vM || {},
                    );
                    return smsg(this.conn, q);
                } catch (e) {
                    console.error("Error en getQuotedObj:", e);
                    return null;
                }
            },
            enumerable: true,
        },
        getQuotedMessage: {
            get() {
                return this.getQuotedObj;
            },
            enumerable: true,
        },
        delete: {
            value() {
                try {
                    return this.conn?.sendMessage?.(this.chat, {
                        delete: this.key
                    });
                } catch (e) {
                    console.error("Error en delete:", e);
                    return Promise.reject(e);
                }
            },
            enumerable: true,
        },
          react: {
	      value(text) {
            return this.conn?.sendMessage(this.chat, {
            react: {
              text,             
              key: this.key
            }})
          },
         enumerable: true
        }});
    }

    export function logic(check, inp, out) {
        if (inp.length !== out.length)
            throw new Error("Input and Output must have same length");
        for (const i in inp)
            if (util.isDeepStrictEqual(check, inp[i])) return out[i];
        return null;
    }

    export function protoType() {
        Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
            const ab = new ArrayBuffer(this.length);
            const view = new Uint8Array(ab);
            for (let i = 0; i < this.length; ++i) {
                view[i] = this[i];
            }
            return ab;
        };
        /**
         * @return {ArrayBuffer}
         */
        Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
            return this.buffer.slice(
                this.byteOffset,
                this.byteOffset + this.byteLength,
            );
        };
        /**
         * @return {Buffer}
         */
        ArrayBuffer.prototype.toBuffer = function toBuffer() {
            return Buffer.from(new Uint8Array(this));
        };
        // /**
        //  * @returns {String}
        //  */
        // Buffer.prototype.toUtilFormat = ArrayBuffer.prototype.toUtilFormat = Object.prototype.toUtilFormat = Array.prototype.toUtilFormat = function toUtilFormat() {
        //     return util.format(this)
        // }
        Uint8Array.prototype.getFileType =
            ArrayBuffer.prototype.getFileType =
            Buffer.prototype.getFileType =
            async function getFileType() {
                return await fileTypeFromBuffer(this);
            };
        /**
         * @returns {Boolean}
         */
        String.prototype.isNumber = Number.prototype.isNumber = isNumber;
        /**
         *
         * @return {String}
         */
        String.prototype.capitalize = function capitalize() {
            return this.charAt(0).toUpperCase() + this.slice(1, this.length);
        };
        /**
         * @return {String}
         */
        String.prototype.capitalizeV2 = function capitalizeV2() {
            const str = this.split(" ");
            return str.map((v) => v.capitalize()).join(" ");
        };

        // Resolver problema LIDs, Fu*k You Meta - Resolve id@lid
        String.prototype.resolveLidToRealJid = (function() {
            const lidCache = new Map();
            return async function(
                groupChatId,
                conn,
                maxRetries = 3,
                retryDelay = 60000,
            ) {
                const inputJid = this.toString();
                if (!inputJid.endsWith("@lid") || !groupChatId?.endsWith("@g.us")) {
                    return inputJid.includes("@") ? inputJid : `${inputJid}@s.whatsapp.net`;
                }
                if (lidCache.has(inputJid)) {
                    return lidCache.get(inputJid);
                }
                const lidToFind = inputJid.split("@")[0];
                let attempts = 0;
                while (attempts < maxRetries) {
                    try {
                        const metadata = await conn?.groupMetadata(groupChatId);
                        if (!metadata?.participants)
                            throw new Error("No se obtuvieron participantes");
                        for (const participant of metadata.participants) {
                            try {
                                if (!participant?.jid) continue;
                                const contactDetails = await conn?.onWhatsApp(participant.jid);
                                if (!contactDetails?.[0]?.lid) continue;
                                const possibleLid = contactDetails[0].lid.split("@")[0];
                                if (possibleLid === lidToFind) {
                                    lidCache.set(inputJid, participant.jid);
                                    return participant.jid;
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                        lidCache.set(inputJid, inputJid);
                        return inputJid;
                    } catch (e) {
                        if (++attempts >= maxRetries) {
                            lidCache.set(inputJid, inputJid);
                            return inputJid;
                        }
                        await new Promise((resolve) => setTimeout(resolve, retryDelay));
                    }
                }
                return inputJid;
            };
        })();

        String.prototype.decodeJid = function decodeJid() {
            if (/:\d+@/gi.test(this)) {
                const decode = jidDecode(this) || {};
                return (
                    (decode.user && decode.server && decode.user + "@" + decode.server) ||
                    this
                ).trim();
            } else return this.trim();
        };
        /**
         * number must be milliseconds
         * @return {string}
         */
        Number.prototype.toTimeString = function toTimeString() {
            // const milliseconds = this % 1000
            const seconds = Math.floor((this / 1000) % 60);
            const minutes = Math.floor((this / (60 * 1000)) % 60);
            const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
            const days = Math.floor(this / (24 * 60 * 60 * 1000));
            return (
                (days ? `${days} day(s) ` : "") +
                (hours ? `${hours} hour(s) ` : "") +
                (minutes ? `${minutes} minute(s) ` : "") +
                (seconds ? `${seconds} second(s)` : "")
            ).trim();
        };
        Number.prototype.getRandom =
            String.prototype.getRandom =
            Array.prototype.getRandom =
            getRandom;
    }

    function isNumber() {
        const int = parseInt(this);
        return typeof int === "number" && !isNaN(int);
    }

    function getRandom() {
        if (Array.isArray(this) || this instanceof String)
            return this[Math.floor(Math.random() * this.length)];
        return Math.floor(Math.random() * this);
    }

    /**
     * @deprecated use the operator ?? instead
     * - (null || undefined) ?? 'idk'
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_operator
     */
    function nullish(args) {
        return !(args !== null && args !== undefined);
    }
