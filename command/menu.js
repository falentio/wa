const menu = `
{}sticker
	membuat sticker

{}ping
	ping bot

{}pdf
	membuat pdf dari document

{}melong
	mengambil link film dari web melong

{}otakudesu
	mengambil link anime dari web otakudesu

{}ygo
	info kartu yugioh

{}cat
	gambar kucing random
`
	.replace(/\{\}/gi, process.env.PREFIX || ".")
	.trim()

export default function (socket, msg) {
	socket.sendMessage(msg.key.remoteJid, {
		text: menu,
	})
}