const s = new Map()

let i = 326
s.set("ABELIA  NARINDI AGSYA", i++)
s.set("ADINDA APRILLIA WAHYU P P", i++)
s.set("AFANDI PRASETYA", i++)
s.set("AGNES RAHMI PUTRI ANANDA", i++)
s.set("ALFIKO FARDHAN AKBAR F", i++)
s.set("ALYA NOVALYANA RISANTI", i++)
s.set("ANASTASIA RIMA MAHARANI", i++)
s.set("ANGDA TENADO ABRIANZAVEO", i++)
s.set("ANGGA SYAHPUTRA ", i++)
s.set("ARZYDHAN AULADIRAFA .A.", i++)
s.set("AULINISA GITA HERDIYANTI", i++)
s.set("AYUHANA AGNES NARULITA", i++)
s.set("DAVA ASMARA PUTRA ROIS", i++)
s.set("ELANG ADITYA PANDU D", i++)
s.set("EVA NATALIA FIRDYA NINGSIH", i++)
s.set("GILANG FACHRUL HUDA", i++)
s.set("JOVITA ELOK VERAWATI", i++)
s.set("KAKA AFRIZIANO", i++)
s.set("KAROLINE REGINA VADYA A", i++)
s.set("MARISSA SASHA AMELIA", i++)
s.set("MARISTA ARIMBI NOVIA SARI", i++)
s.set("MIKE ARUM CAHYANTI", i++)
s.set("NADIA MARETA AYU PUTRI", i++)
s.set("NAYLA ZAHRA", i++)
s.set("NI PUTU TYA ANGELLA SARI", i++)
s.set("RISKA WULAN RAHMAWATI", i++)
s.set("RIVALDI KEVIN FALENTIO", i++)
s.set("SINDI DWI PRATIWI", i++)
s.set("TJOKORDA PUTRI SARASWATI", i++)
s.set("WANDA NUR HAMIDAH", i++)
i = 362
s.set("Adinda Ivanka Maysanda Putri", i++)
s.set("Aisyah Rizkya Triyuniasari", i++)
s.set("Alfarrel zaidan syafik mazaya", i++)
s.set("Alfina Rosyada", i++)
s.set("ALIFFIA NAZILA", i++)
s.set("ALIFINDY ANNAJWAH FILLAH ", i++)
s.set("Anatasya Silvi Pramudia", i++)
s.set("Angel Septia Wulansari", i++)
s.set("Aryo Gading", i++)
s.set("Aurellya Nayshilla Karangan ", i++)
s.set("Az- Zhura Pratiwi", i++)
s.set("Dania Rahma Sari", i++)
s.set("David argya", i++)
s.set("Dini Elminingtyas Rahayu", i++)
s.set("Eka Tasya Sandra Saputri ", i++)
s.set("Farhan Arief Muhammad", i++)
s.set("Imro'atul Anifa Ijzah", i++)
s.set("Mayfrida Putri Purwanti", i++)
s.set("Mayra Tanaya Syahla Arifadi ", i++)
s.set("Melvina Monica Sari", i++)
s.set("Najwah Amirah", i++)
s.set("RAHMA QURROTU'AIN AMANINA", i++)
s.set("Raihan Muzayyin amalana Wahid", i++)
s.set("RANI PUTRI WINDIARTI", i++)
s.set("Rifko Widiastama Dwi Putra", i++)
s.set("Roby Putra Arditia", i++)
s.set("Sabila Ilmi Galuh Widotomo", i++)
s.set("VIONI EKA PRATIWI", i++)
s.set("Wahyu Trinita Dewi", i++)
s.set("Rere Shakila Pasha", i++)
s.set("Irfanty Septiarini", i++)

import Fuse from "fuse.js"
const stds = [...s.keys()].map(name => ({ name, num: s.get(name) }))
const sf = new Fuse(stds, { keys: ["name"] })
import * as h from "handlebars"
import got from "got"
const subjects = {
	pai: 1,
	pkn: 2,
	indo: 3,
	mat_w: 4,
	sejarah: 5,
	inggris: 6, 
	senbud: 7,
	pjok: 8,
	pkwu: 9,
	jawa: 10,
	fisika: 11,
	kimia: 12,
	bio: 13,
	mat_p: 14,
	geo: 15,
}
export default async function(socket, msg, { text }) {
	if (msg.key.remoteJid.includes("g.us") && msg.key.remoteJid !== "120363027958811048@g.us") {
		return
	}
	const subject = text.split(" ")[1]
	if (!subject) {
		return
	}
	const name = text.split(subject)[1]?.trim()
	if (subject === "list") {
		const text = [...Object.keys(subjects)].sort().join("\n")
		socket.sendMessage(msg.key.remoteJid, { text })
	}
	if (subject.toLowerCase() in subjects && name) {
		const result = sf.search(name)
		if (!result?.length) {
			return
		}
		const num = result[0].item.num
		const { answers } = await got.get("https://si-koceng-jawab.deno.dev/api/questions", {
			searchParams: {
				subject: subject.toLowerCase(),
				student: num,
			}
		}).json()
		let text = result[0].item.name + "\n"
		answers.forEach((a, i) => {
			if (a === "X") {
				a = ""
			}
			if (i % 5 === 0) {
				text += "\n"
			}
			text += `${i + 1}.) ${a}\n`
		})
		socket.sendMessage(msg.key.remoteJid, { text })
	}
}