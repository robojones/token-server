import * as tls from 'tls'

import { Connection } from '../connection/Connection'
import { Status } from './Status'
import { TokenAPI } from './TokenAPI'

export type TokenClientOptions = tls.ConnectionOptions

export class TokenClient extends TokenAPI {
	private options: TokenClientOptions
	private socket: tls.TLSSocket
	private connection: Connection | null = null
	private hadError: boolean

	constructor(options: TokenClientOptions) {
		super()

		this.options = options

		this.connect()
	}

	public close() {
		if (this.status <= Status.CLOSED) {
			// Already closed or offline.
			return false
		}

		this.status = Status.CLOSED
		this.socket.end()
		this.connection = null
		return true
	}

	public connect() {
		if (this.status >= Status.CONNECTING) {
			// Still connected.
			return false
		}

		this.hadError = false
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
		if (this.connection) {
			return this.connection.send(token)
		}
		return false
	}

	/**
	 * Applies initial event listeners.
	 */
	private applyListeners() {
		this.socket.on('error', (error: Error) => {
			this.hadError = true

			// Emit socket errors.
			this.emit('error', error)

			// Close if the error has not already closed the connection.
			this.close()
		})

		this.socket.on('close', () => {
			this.status = Status.OFFLINE

			// Emit own close event.
			this.emit('close', this.hadError)
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
