import { EventEmitter } from 'events'
import * as tls from 'tls'
import { Connection } from '../connection/Connection'
import { Status } from '../Status'

export type CloseListener = (
	/** Is true if the connection was closed by an error. */
	hadError: boolean,
) => void

export type TokenListener = (
	/** Is true if the connection was closed by an error. */
	token: Buffer,
	/** The connection that sent this token. */
	connection: Connection,
) => void

export declare interface TokenClient extends EventEmitter {
	on(event: 'connect', listener: () => void): this
	on(event: 'close', listener: CloseListener): this
	on(event: 'token', listener: TokenListener): this
	once(event: 'connect', listener: () => void): this
	once(event: 'close', listener: CloseListener): this
	once(event: 'token', listener: TokenListener): this
}

export class TokenClient extends EventEmitter {
	/** The status of the client. */
	public status: Status

	private options: tls.ConnectionOptions
	private socket: tls.TLSSocket
	private connection: Connection | null = null

	constructor(options: tls.ConnectionOptions) {
		super()

		this.options = options

		this.connect()
	}

	/**
	 * Closes the connection to the server.
	 * Returns false if the connection was already closed.
	 */
	public close(): boolean {
		if (this.connection) {
			const result = this.connection.close()
			this.connection = null
			return result
		}

		return false
	}

	/**
	 * Send a token to the server.
	 * Returns true if the token was written to the connection.
	 * @param token The token to transmit to the server.
	 */
	public send(token: Buffer): boolean {
		if (this.connection && this.connection.send(token)) {
			return true
		}
		return false
	}

	/**
	 * If the client connection was closed you can use this method to connect it again.
	 * If a new connection was created the method returns false.
	 * If there already is an active connection false will be retured.
	 */
	public connect(): boolean {
		this.status = Status.CONNECTING

		if (this.connection && !this.connection.isDead) {
			// Old connection is still online → don't reconnect.
			return false
		}

		this.socket = tls.connect(this.options)
		this.connection = null

		this.applyListeners()

		return true
	}

	/**
	 * Applies initial event listeners.
	 */
	private applyListeners() {
		this.socket.on('close', (hadError) => {
			// Update status.
			if (hadError) {
				this.status = Status.FAILED
			} else {
				this.status = Status.CLOSED
			}

			// Emit own close event.
			this.emit('close', hadError)
		})

		this.socket.on('secureConnect', () => {
			this.updateConnection()

			// The socket is now connected.
			this.status = Status.ONLINE
			this.emit('connect')
		})
	}

	/**
	 * Creates a new connection object for the socket.
	 */
	private updateConnection() {
		this.connection = new Connection(this.socket)

		this.connection.on('token', (token) => {
			// Emit token
			this.emit('token', token, this.connection)
		})
	}
}
