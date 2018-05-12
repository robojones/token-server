import * as net from 'net'
import * as tls from 'tls'

import { Connection } from '../connection/Connection'
import { Status } from './Status'
import { TokenAPI } from './TokenAPI'

export type TokenServerOptions = tls.TlsOptions & net.ListenOptions

export class TokenServer extends TokenAPI {
	private options: TokenServerOptions
	private server: tls.Server

	constructor(options: TokenServerOptions) {
		super()

		this.options = options

		if (this.status) {
			console.log('asdf')
		}

		this.server = tls.createServer(options)
		this.applyListeners()
		this.connect()
	}

	public close() {
		if (!this.server.listening) {
			// Server already closed.
			return false
		}

		this.server.close()
		return true
	}

	public connect(delay = 0) {
		if (this.server.listening) {
			return false
		}

		this.status = Status.CONNECTING

		const connect = () => {
			// Apply TCP options.
			this.server.listen(this.options)
		}

		if (delay) {
			setTimeout(connect, delay)
		} else {
			connect()
		}

		return true
	}

	private applyListeners() {
		this.server.on('listening', () => {
			this.status = Status.ONLINE
			this.emit('connect')
		})

		this.server.on('error', (error: Error) => {
			// Set status to failed so we know that it was closed by an error.
			this.status = Status.FAILED
			this.server.close()

			// Emit server errors.
			this.emit('error', error)
		})

		this.server.on('close', () => {
			// Emit the close event.
			if (this.status === Status.FAILED) {
				this.emit('close', true)
			} else {
				this.status = Status.CLOSED
				this.emit('close', false)
			}
		})

		this.server.on('secureConnection', (socket) => {
			const connection = new Connection(socket)

			connection.on('token', (token) => {
				this.emit('token', token, connection)
			})
		})
	}
}
