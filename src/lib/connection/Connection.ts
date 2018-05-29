import { EventEmitter } from 'events'
import { Duplex } from 'stream'
import { Message, NEWLINE } from './Message'

const CLOSE_TOKEN = Buffer.from('\\\n')

export declare interface Connection extends EventEmitter {
	/** The "token" event is emitted when a token is received from a socket. */
	on(event: 'token', handler: (token: Buffer) => void): this
	/**
	 * When TokenServer#close() is called it will send a close token to all clients.
	 * The client will then emit the "remoteClose" event.
	 * You need to call the Client#close() method in this event so the server can close.
	 */
	on(event: 'remoteClose', handler: () => void): this
	/** The close event of the underlying socket. */
	// tslint:disable-next-line:unified-signatures
	on(event: 'close', handler: () => void): this

	/** The "token" event is emitted when a token is received from a socket. */
	once(event: 'token', handler: (token: Buffer) => void): this
	/**
	 * When TokenServer#close() is called it will send a close token to all clients.
	 * The client will then emit the "remoteClose" event.
	 * You need to call the Client#close() method in this event so the server can close.
	 */
	once(event: 'remoteClose', handler: () => void): this
	/** The close event of the underlying socket. */
	// tslint:disable-next-line:unified-signatures
	once(event: 'close', handler: () => void): this

	emit(event: 'token', token: Buffer): boolean
	emit(event: 'remoteClose'): boolean
	// tslint:disable-next-line:unified-signatures
	emit(event: 'close'): boolean
}

/**
 * Wrapper for streams that emits "token".
 */
export class Connection extends EventEmitter {
	public socket: Duplex
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
	 * Close the other side of the connection.
	 * Returns true if the close token was written to the socket.
	 */
	public remoteClose(): boolean {
		if (this.isDead) {
			return false
		}

		this.socket.write(CLOSE_TOKEN)
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

		// Bubble up close event.
		this.socket.on('close', () => this.emit('close'))
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

			// +1 to include the separating newline
			const data = this.buffer.slice(0, i + 1)

			if (data.equals(CLOSE_TOKEN)) {
				this.emit('remoteClose')
			} else {
				this.emit('token', Message.unescape(data))
			}

			this.buffer = this.buffer.slice(i + 1)
		}
	}
}
