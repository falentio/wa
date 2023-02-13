import got from "got"
import h from "handlebars"
import { create, insertBatch, search } from "@lyrasearch/lyra"
import data from "../data/ygo.json" assert { type: "json" }

const cardTmpl = h.compile(`
*{{{name}}}* {{#if attribute}}({{{attribute}}}){{/if}}
[{{{race}}} / {{{type}}}]
*Card Set:*
{{#each card_sets}}
	> {{{this.set_code}}} {{{this.set_rarity_code}}}
{{/each}}
*Description:*${"\u034f".repeat(2 << 9)}
{{{desc}}}
`)

const otherTmpl = h.compile(`
Other:
{{#each other}}
{{{this.name}}} {{#if this.attribut}}({{{this.attribute}}}) {{/if}}[{{{this.race}}} / {{{this.type}}}]
{{/each}}	
`)

const db = await create({
	schema: {
		name: "string",
	}
})

// const { data } = await got.get("https://db.ygoprodeck.com/api/v7/cardinfo.php").json()
await insertBatch(db, data.data.map(i => {
	return {
		name: i.name
	}
}))
const r = await search(db, {
	term: "traptrix",
	properties: ["name"],
})

let last = "dark magician"
export default async function(socket, msg, { text, cmd, prefix }) {
	const [, ...names] = text.split(" ")
	const name = names?.join(" ")
	if (!name) {
		return socket.sendMessage(msg.key.remoteJid, {
			text: "silahkan kirim pesan diikuti dengan name kartu\n" +
				`${prefix}${cmd} ${last}`
		})
	}
	const { hits, count } = await search(db, {
		term: name,
		properties: ["name"],
	})
	
	if (!count) {
		return socket.sendMessage(msg.key.remoteJid, {
			text: "tidak dapat menemukan kartu"
		})
	}

	const [card, ...other] = hits
		.slice(0, 11)
		.map(i => i.document)
		.map(i => {
			return data.data.find(d => d.name === i.name)
		})
	const cardMsg = cardTmpl(card).trim()
	const image = card.card_images[Math.random() * card.card_images.length | 0].image_url
	const otherMsg = otherTmpl({ other }).trim()
	last = card.name
	await socket.sendMessage(msg.key.remoteJid, {
		image: { url: image },
		caption: cardMsg,
	})
	other.length && await socket.sendMessage(msg.key.remoteJid, {
		text: otherMsg,
	})
}