export default async function(socket, msg) {
	socket.sendMessage(msg.key.remoteJid, {
		text: "pong!!!",
	})
}