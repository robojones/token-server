import { TokenServer } from '../../..'
import { serverOptions } from '../../options'
import { Context } from './TokenServerAndClient'

export function setupServer (this: Context, cb) {
	this.server = new TokenServer(serverOptions)
	this.server.once('connect', () => {
		cb()
	})
}

export function closeServer (this: Context, cb) {
	if (!this.server) {
		return cb()
	}

	this.server.once('close', () => {
		cb()
	})

	if (!this.server.close()) {
		cb()
	}
}
