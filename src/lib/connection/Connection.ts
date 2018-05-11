import { EventEmitter } from 'events'
import { Duplex } from 'stream'
import { Message, NEWLINE } from './Message'

export declare interface Connection extends EventEmitter {
	on(event: 'token', handler: (token: Buffer) => void): this
}

/**
 * Wrapper for streams that emits "token".
 */
export class Connection extends EventEmitter {
	private socket: Duplex
	private buffer = Buffer.allocUnsafe(0)

	constructor(socket: Duplex) {
		super()
		this.socket = socket
		this.applyEvents()
	}

	/**
	 * Is true if the underlying socket is not writable.
	 */
	public get isDead() {
		return !this.socket.writable
	}

	/**
	 * Writes a message to the socket. Returns true if the message was written to the socket.
	 * @param data The buffer to transmit.
	 */
	public send(data: Buffer): boolean {
		if (this.isDead) {
			return false
		}

		this.socket.write(Message.escape(data))
		this.socket.write(Buffer.from([NEWLINE]))
		return true
	}

	/**
	 * Close the connection.
	 */
	public close(): boolean {
		if (this.isDead) {
			return false
		}

		this.socket.end()
		return true
	}

	/**
	 * Initially apply all events.
	 */
	private applyEvents() {
		this.socket.on('data', (data: Buffer) => {
			this.buffer = Buffer.concat([this.buffer, data])

			this.parse()
		})
	}

	/**
	 * Parses and emits all tokens from the buffer.
	 */
	private parse(): void {
		while (true) {
			const i = this.buffer.indexOf(NEWLINE)

			if (i === -1) {
				break
			}

			const token = this.buffer.slice(0, i)
			this.emit('token', Message.unescape(token))

			this.buffer = this.buffer.slice(i + 1)
		}
	}
}
