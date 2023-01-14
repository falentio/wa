import { downloadContentFromMessage } from "@adiwajshing/baileys"
import got from "got"
import FormData from "form-data"
import { Buffer } from "buffer"
import * as fs from "fs/promises"

const gotenberg = [
	"https://pdf-turu.onrender.com",
	"https://demo.gotenberg.dev",
]

export default async function(socket, msg) {
	const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
	if (!quoted?.documentMessage) {
		return socket.sendMessage(msg.key.remoteJid, {
			text: "tolong reply pesan document untuk di convert ke pdf",
		})
	}

	const buff = []
	const stream = await downloadContentFromMessage(quoted.documentMessage, "document")
	for await (const b of stream) {
		buff.push(...b)
	}
	const b = Buffer.from(buff) 

	const form = new FormData()
	form.append("files", b, {
		filename: "document.docx",
	})

	socket.sendMessage(msg.key.remoteJid, {
		text: "sedang menkonversi document mu",
	}, { quoted: msg })

	for (const host of gotenberg) {
		try {
			const res = await got.post(`${host}/forms/libreoffice/convert`, { 
				body: form,
				responseType: "buffer",
			})

			socket.sendMessage(msg.key.remoteJid, {
				document: res.body,
			}, { quoted: msg })

			return
		} catch (e) {
			continue
		}
	}


	socket.sendMessage(msg.key.remoteJid, {
		text: "mohon maaf kak, aku gagal mengkonversi document mu menjadi pdf",
	}, { quoted: msg })
}