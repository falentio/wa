import got from "got"
import h from "handlebars"
import { nanoid } from "nanoid"

const tmpl = h.compile(`
{{#each movies}}
*{{{this.title}}}*
	{{#each this.downloadUrl}}
	[{{{this.label}}}] {{{this.server}}}: {{{this.href}}}
	{{/each}}

{{/each}}

{{#if titles.length}}
*Lainnya:*
{{#each titles}}
	{{{this}}}
{{/each}}
{{/if}}
`)

export default async function(socket, msg, { text, prefix, cmd }) {
	const [, ...names] = text.split(" ")
	const name = names.join(" ")
	if (!name) {
		await socket.sendMessage(msg.key.remoteJid, {
			text: 
				`coba lagi menggunakan perintah ini seperti dibawah\n` +
				`\`\`\`${prefix}${cmd} nama film\`\`\``
		})
		return
	}
	const movies = await got.get("https://meowvie.deno.dev/api/search", { searchParams: { name }}).json()
	await Promise.allSettled(
		movies.map(async m => {
			return Promise.allSettled(
				m.downloadUrl.map(async d => {
					d.server = d.server.replace(".", ".\u034f")
					const slug = `${d.label.replace(/[^0-9\w]/gi, "-")}-${nanoid(3)}`
					await got.post("https://oi.falentio.com/api/create", {
						json: {
							slug,
							target: d.href,
						}
					})
					d.href = `oi.falentio.com/${slug}`
				})
			)
		})
	)
	const result = tmpl({ 
		movies: movies.filter(i => i.downloadUrl.length).slice(0, 3),
		titles: movies.slice(3).map(i => i.title)
	}).trim()
	await socket.sendMessage(msg.key.remoteJid, { text: result }, { quoted: msg })
}