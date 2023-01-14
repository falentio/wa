import { default as waSocket, useMultiFileAuthState } from "@adiwajshing/baileys"

import ping from "./command/ping.js"
import pdf from "./command/pdf.js"
import sticker from "./command/sticker.js"

const prod = process.env.NODE_ENV == "production"
const commands = new Map()
function cmd(c, fn) {
	for (const k of c) {
		commands.set(k, fn)
	}
}
cmd(["ping"], ping)
cmd(["pdf", "p"], pdf)
cmd(["sticker", "s", "stick", "sk"], sticker)

const { state, saveCreds } = await useMultiFileAuthState("auth_data")

const socket = waSocket.default({
	printQRInTerminal: true,
	auth: state,
})

socket.ev.on("creds.update", saveCreds)

socket.ev.on("messages.upsert", async m => {
	const msg = m.messages[0]
	!prod && console.log({ msg })

	const text = msg.message?.conversation || msg.message.extendedTextMessage?.text || ""
	if (text[0] !== ".") {
		return
	}

	const command = text.split(" ")[0].slice(1).trim()
	const fn = commands.get(command)
	!prod && console.log({ command, fn })
	if (fn) {
		fn(socket, msg, text)
	}
})

console.log("starting bot")