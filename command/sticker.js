import { downloadContentFromMessage } from "@adiwajshing/baileys"
export default async function(socket, msg) {
	const img = getImage(msg)
}

function getImage(msg) {
	console.log("f", msg)
	if (msg.message.imageMessage) {
		return msg.message.imageMessage
	}
	if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
		return getImage(msg.message.extendedTextMessage?.contextInfo?.quotedMessage)
	}
	return null
}