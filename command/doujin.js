import got from "got"

const categories = ["blowjob", "neko", "waifu", "trap"]

export default async function(socket, msg, { text }) {
	const [,,category] = text.split(" ")
	if (!msg.key.remoteJid.includes("g.")) {
		return
	}
	if (!categories.includes(category)) {
		return socket.sendMessage(msg.key.remoteJid, {
			text: "silahkan kirim command diikuti dengan category",
		})
	}

	const { url } = await got.get(`https://api.waifu.pics/nsfw/${category}`,).json()
	const img = await got.get(url).buffer()

	await socket.sendMessage(msg.key.remoteJid, {
		image: img,
	})
}