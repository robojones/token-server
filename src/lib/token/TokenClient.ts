import * as tls from 'tls'

import { Connection } from '../connection/Connection'
import { Status } from './Status'
import { TokenAPI } from './TokenAPI'

export type TokenClientOptions = tls.ConnectionOptions

export class TokenClient extends TokenAPI {
	private options: TokenClientOptions
	private socket: tls.TLSSocket
	private connection: Connection | null = null

	constructor(options: TokenClientOptions) {
		super()

		this.options = options

		this.connect()
	}

	public close() {
		if (this.connection) {
			const result = this.connection.close()
			this.connection = null
			return result
		}

		return false
	}

	public connect() {
		if (this.connection && !this.connection.isDead) {
			// Old connection is still online → don't reconnect.
			return false
		}

		this.status = Status.CONNECTING

		this.socket = tls.connect(this.options)
		this.connection = null

		this.applyListeners()

		return true
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
	 * Applies initial event listeners.
	 */
	private applyListeners() {
		this.socket.on('error', (error: Error) => {
			// Emit socket errors.
			this.emit('error', error)
		})

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
		const connection = new Connection(this.socket)

		connection.on('token', (token) => {
			// Emit token
			this.emit('token', token, connection)
		})

		this.connection = connection
	}
}
