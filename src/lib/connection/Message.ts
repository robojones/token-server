export const NEWLINE = Buffer.from('\n')[0]
const ESC = Buffer.from('\\')[0]
const ESC_N = Buffer.from('n')[0]

export class Message {
	/**
	 * Escapes all newlines and backslashes in a buffer.
	 * @param data The buffer that needs to be escaped.
	 */
	public static escape(data: Buffer): Buffer {
		const result: number[] = []

		for (const char of data) {
			switch (char) {
				case ESC:
					// Escape escaped backslash.
					result.push(ESC)
					result.push(ESC)
					break
				case NEWLINE:
					// Escape newline.
					result.push(ESC)
					result.push(ESC_N)
					break
				default:
					// Copy char.
					result.push(char)
					break
			}
		}

		result.push(NEWLINE)

		return Buffer.from(result)
	}

	/**
	 * Reverts all changes of the escape method.
	 * @param data Data that needs to be unescaped.
	 */
	public static unescape(data: Buffer): Buffer {
		const result: number[] = []

		// Ignore last byte because it's the separating newline.
		for (let i = 0; i < data.length - 1; i++) {
			const char = data[i]
			const next = data[i + 1]

			if (char === ESC) {
				switch (next) {
					case ESC:
						// Escaped escaped backslash.
						result.push(ESC)
						i += 1
						break
					case ESC_N:
						// Escaped newline.
						result.push(NEWLINE)
						i += 1
						break
					default:
						throw new Error('Unescaped backslash detected!')
				}
			} else {
				// Normal char.
				result.push(char)
			}
		}

		return Buffer.from(result)
	}
}
