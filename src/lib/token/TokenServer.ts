import * as net from 'net'
import * as tls from 'tls'

import { Connection } from '../connection/Connection'
import { Status } from './Status'
import { TokenAPI } from './TokenAPI'

export type TokenServerOptions = tls.TlsOptions & net.ListenOptions

export class TokenServer extends TokenAPI {
	private options: TokenServerOptions
	private server: tls.Server
	private hadError: boolean

	constructor(options: TokenServerOptions) {
		super()

		this.options = options

		this.server = tls.createServer(options)
		this.applyListeners()
		this.connect()
	}

	public close() {
		if (!this.server.listening) {
			// Server already closed.
			return false
		}

		this.status = Status.CLOSED
		this.server.close()
		return true
	}

	public connect() {
		if (this.status >= Status.CONNECTING) {
			// Server already connecting or online.
			return false
		}

		this.hadError = false
		this.status = Status.CONNECTING

		this.server.listen(this.options)

		return true
	}

	private applyListeners() {
		this.server.on('listening', () => {
			this.status = Status.ONLINE

			this.emit('connect')
		})

		this.server.on('error', (error: Error) => {
			// Set status to failed so we know that it was closed by an error.
			this.hadError = true

			// Emit server errors.
			this.emit('error', error)

			// Call close so the server emits the "close" event.
			this.server.close()
		})

		this.server.on('close', () => {
			this.status = Status.OFFLINE

			// Emit the close event.
			this.emit('close', this.hadError)
		})

		this.server.on('secureConnection', (socket) => {
			const connection = new Connection(socket)

			connection.on('token', (token) => {
				this.emit('token', token, connection)
			})
		})
	}
}
