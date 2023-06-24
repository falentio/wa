import { default as waSocket, useMultiFileAuthState } from "@whiskeysockets/baileys"
import Fuse from "fuse.js"
import fs from "fs/promises"

import cat from "./command/cat.js"
import doujin from "./command/doujin.js"
import melong from "./command/melong.js"
import menu from "./command/menu.js"
import otakudesu from "./command/otakudesu.js"
import ingfokan from "./command/ingfokan.js"
import pdf from "./command/pdf.js"
import ping from "./command/ping.js"
import sticker from "./command/sticker.js"
import ygo from "./command/ygo.js"

function cmd(c, fn) {
	for (const cmd of c) {
		cmds.push({ cmd, fn })
	}
}

const prod = process.env.NODE_ENV == "production"
const prefix = process.env.PREFIX || "."
const { state, saveCreds } = await useMultiFileAuthState("auth_data")

const cmds = []
cmd(["cat"], cat)
cmd(["doujin"], doujin)
cmd(["melong"], melong)
cmd(["menu"], menu)
cmd(["otakudesu", "od"], otakudesu)
cmd(["ingfokan"], ingfokan)
cmd(["pdf", "p"], pdf)
cmd(["ping"], ping)
cmd(["sticker", "s", "stick", "sk"], sticker)
cmd(["ygo"], ygo)

const commands = new Fuse(cmds, { keys: ["cmd"] })

start()
async function start() {
	const socket = waSocket.default({
		printQRInTerminal: true,
		auth: state,
		syncFullHistory: true,
	})

	const handleMessage =  async msg => {
		try {
			if (msg.key.fromMe) {
				return
			}
			!prod && console.log(JSON.stringify({ msg }, null, "\t"))
			const [type] = Object.keys(msg.message)

			let text = msg.message?.conversation || 
				msg.message?.extendedTextMessage?.text ||
				msg.message.imageMessage?.caption || 
				""
			if (!text.startsWith(prefix)) {
				return
			}

			let command = text.slice(prefix.length).split(/[^\w]/gi)[0].trim()
			const [result] = commands.search(command)
			if (!result) {
				return socket.sendMessage(msg.key.remoteJid, { text: "perintah tidak diketahui"}, { quoted: msg })
			}
			const { fn, cmd } = result.item
			text = text.slice(prefix.length)
			!prod && console.log({ command, fn })
			fn && await fn(socket, msg, {
				text,
				prefix,
				cmd,
			})
		} catch (e) {
			console.error(e)
			await socket.sendMessage(msg.key.remoteJid, { text: "maaf, gagal memproses perintah anda" })
		}
	}

	socket.ev.on("creds.update", saveCreds)
	socket.ev.on("connection.update", (update) => {
		if (update.connection === "close") {
			start()
		}
	})
	socket.ev.on("messages.upsert", async m => {
		console.log(m.messages)
		const pending = m.messages.map(handleMessage)
		await Promise.allSettled(pending)
	})
}

console.log("starting bot")
console.log("prfix: ", prefix)

await fs.rm("auth_data/tmp", { recursive: true, force: true }).catch(() => {})
await fs.mkdir("auth_data/tmp", { recursive: true })