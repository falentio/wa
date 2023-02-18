const consonant = "bcdfghjklmnpqrstvwxyz"
const vowel = "aiueo"

export const slug = len => {
	let result = ""
	let i = Math.random() * 2 | 0
	while (result.length < len) {
		const c = [consonant, vowel][i++ % 2]
		result += c[Math.random() * c.length | 0]
	}
	return result
}