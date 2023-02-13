export default async function(socket, msg) {
	return socket.sendMessage(msg.key.remoteJid, {
		image: {
			url: "https://kucing.falentio.com/720",
		}
	})
}