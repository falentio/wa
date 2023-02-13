import { downloadContentFromMessage } from "@adiwajshing/baileys"
import ffmpeg from "fluent-ffmpeg"
import { execa } from "execa"
import fs from "fs/promises"
import { Buffer } from "buffer"
import WebP from "node-webpmux"

export default async function(socket, msg, { text }) {
	const media = getMedia(msg.message)
	console.log(media)
	if (!media) {
		return socket.sendMessage(msg.key.remoteJid, { text: "reply atau kirim pesan dengan gambar" })
	}
	const t = media.mimetype.split(/[^\w]/gi)[0]
	const buff = await downloadContentFromMessage(media, t)
	const url = `./auth_data/tmp/sticker-${new Date().toISOString()}.webp`
	let [, pack, author] = text.split("\n")
	if (!pack) {
		pack = msg.pushName
		author = "."
	}

	const exif = await metadata(pack, author)
	const webp = await ffmpeg(buff)
		.addOutputOptions([
			`-vcodec`,
			`libwebp`,
			`-vf`,
			`scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
		])
		.on('end', async () => {
			t: try {
				if ("seconds" in media) {
					break t;
				}
				const exif = await metadata(pack, author)
				await execa("webpmux", ["-set", "exif", exif, url, "-o", url])
			} catch (e) {
				console.error(e)
			}
			socket.sendMessage(msg.key.remoteJid, { sticker: { url } })
		})
		.on("error", console.error)
		.toFormat('webp')
		.save(url)
}

async function metadata(pack, author) {
	const url = `./auth_data/tmp/exif-${new Date().toISOString()}.webp`
	const data = {
		"sticker-pack-name": pack,
		"sticker-pack-publisher": author,
	}
	const json = JSON.stringify(data)
	const b = Buffer.from(json)
	const len = b.length

	const exif = Buffer.concat([
		Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]),
		Buffer.from([len & 0xff, len >> 8 & 0xff, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]),
	    b,
	])
	exif.writeUIntLE(json.length, 14, 4)

	await fs.writeFile(url, exif)

	return url
}
function addMetadata(packname, author) {	
	if (!packname) packname = 'WABot'; if (!author) author = 'Bot';	
	author = author.replace(/[^a-zA-Z0-9]/g, '');	
	let name = `${author}_${packname}`
	if (fs.existsSync(`./src/stickers/${name}.exif`)) return `./src/stickers/${name}.exif`
	const json = {	
		"sticker-pack-name": packname,
		"sticker-pack-publisher": author,
	}
	const littleEndian = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00])	
	const bytes = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00]	

	let len = JSON.stringify(json).length	
	let last	

	if (len > 256) {	
		len = len - 256	
		bytes.unshift(0x01)	
	} else {	
		bytes.unshift(0x00)	
	}	

	if (len < 16) {	
		last = len.toString(16)	
		last = "0" + len	
	} else {	
		last = len.toString(16)	
	}	

	const buf2 = Buffer.from(last, "hex")	
	const buf3 = Buffer.from(bytes)	
	const buf4 = Buffer.from(JSON.stringify(json))	

	const buffer = Buffer.concat([littleEndian, buf2, buf3, buf4])	

	fs.writeFile(`./src/stickers/${name}.exif`, buffer, (err) => {	
		return `./src/stickers/${name}.exif`	
	})	
}

function getMedia(msg) {
	if (msg.imageMessage) {
		return msg.imageMessage
	}
	if (msg.videoMessage) {
		return msg.videoMessage
	}
	if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
		return getMedia(msg.extendedTextMessage?.contextInfo?.quotedMessage)
	}
	return null
}