import got from "got"
import { parseHTML } from "linkedom"
import h from "handlebars"
import { nanoid } from "nanoid"

const otakudesu = "https://otakudesu.asia"
let cache = {}
setInterval(() => cache = {}, 7200e3)

async function getAnimeList(name) {
    const { body } = await got(otakudesu, {
        searchParams: {
            s: name,
            post_type: "anime",
        }
    })
    const { document } = await parseHTML(body)
    const moviesEl = document.querySelectorAll("div.page > ul.chivsrc > li")
    const movies = Array
        .from(moviesEl)
        .map(moviesFn)
    const pending = movies.map(async m => {
        m.episodes = cache[m.href] ||= await getAnimeEps(m.href)
    })
    await Promise.all(pending)
    return movies
}

function moviesFn(movie) {
    const genresEl = movie.querySelectorAll(`a[rel="tag"]`)
    const genres = Array
        .from(genresEl)
        .map(i => i.textContent?.trim())
        .filter(Boolean)
        .sort()
    const title = movie.querySelector("h2 > a").textContent
    const href = movie.querySelector("h2 > a").href
    const thumbnail = movie.querySelector("img").src

    return {
        href,
        thumbnail,
        title,
        genres,
        genreStr: genres.join(", ")
    }
}

async function getAnimeEps(href) {
    const { body } = await got(href)
    const { document } = parseHTML(body)
    const episodesEl = document.querySelectorAll("div.episodelist > ul > li")
    return Array
    	.from(episodesEl)
    	.map(e => {
    		const a = e.querySelector("a")
    		const r = /\d+/i.exec(a.textContent)
    		return {
    			name: a.textContent,
    			href: a.href,
    			num: r?.[0] || "",
    		}
    	})
}

async function getAnimeLink(href) {
    const { body } = await got(href)
    const { document } = parseHTML(body)
	const linksEl = document.querySelectorAll("div.download > ul > li")
	return Array
		.from(linksEl)
		.flatMap(l => {
			const aEl = l.querySelectorAll("a")
			const resolution = l.querySelector("strong").textContent
			const downloads = Array.from(aEl).map(a => {
				return {
					href: a.href,
					server: a.textContent,
					resolution,
				}
			})
			return downloads
		})
}

const moviesTmpl = h.compile(`
{{#each movies}}
Title: {{{this.title}}}
Episodes: {{{this.episodes.length}}}
Genre: {{{this.genreStr}}}

{{/each}}
`)

const downloadsTmpl = h.compile(`
Downloads

{{#each downloads}}
[{{{this.resolution}}}]{{{this.server}}}: {{{this.href}}}
{{/each}}
`)

const epsTmpl = h.compile(`
Episodes

{{#each episodes}}
{{{this.name}}}
{{/each}}
`)


export default async function(socket, msg, { text, cmd, prefix }) {
	const [name, episode] = text.split("\n")
	const movies = cache[name] ||= await getAnimeList(name.slice(name.indexOf(" ")))
	if (!episode) {
		const text = moviesTmpl({ movies }).trim()
		await socket.sendMessage(msg.key.remoteJid, { text })
		return 
	}
	if (episode === "eps") {
		const text = epsTmpl({ episodes: movies[0].episodes }).trim()
		await socket.sendMessage(msg.key.remoteJid, { text })
		return 
	}
	console.log(movies[0].episodes)
	const ep = movies[0].episodes.find(e => e.num == episode)
	if (!ep) {
		const text = "tidak dapat menemukan episode"
		await socket.sendMessage(msg.key.remoteJid, { text })
		return
	}
	const downloads = cache[ep.href] ||= await getAnimeLink(ep.href)
	const pending = downloads.map(async d => {
		d.href = cache[movies[0].title + d.resolution + d.server] ||= await shorten(d.href)
	})
	await Promise.all(pending)
	const message = [
		moviesTmpl({ movies: [movies[0]] }).trim(),
		"Link download episode " + episode,
		downloadsTmpl({ downloads }).trim(),
	].join("\n")
	await socket.sendMessage(msg.key.remoteJid, { text: message })
}

function str(len) {
	const consonant = "bcdfghjklmnpqrstvwxyz"
	const vowel = "aiueo"
	let result = ""
	let i = Math.random() * 100 | 0 
	while (result.length < len) {
		const c = [vowel, consonant][i++ % 2]
		result += c[Math.random() * c.length | 0]
	}
	return result
}

async function shorten(target) {
	const slug = str(6)
	await got.post("https://oi.falentio.com/api/create", {
		json: { slug, target },
	})
	return `https://oi.falentio.com/${slug}`
} 