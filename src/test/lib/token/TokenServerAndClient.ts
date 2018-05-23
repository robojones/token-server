import { deepEqual, strictEqual } from 'assert'
import { IBeforeAndAfterContext, ITestCallbackContext } from 'mocha'
import { TokenClient, TokenServer } from '../../..'
import { closeClient, setupClient } from './TokenClient'
import { closeServer, setupServer } from './TokenServer'

export interface Context extends ITestCallbackContext, IBeforeAndAfterContext {
	server: TokenServer
	client: TokenClient
}

describe('TokenServer and TokenClient', () => {

	describe('#write and "token" event', () => {
		beforeEach(setupServer)
		beforeEach(setupClient)

		afterEach(closeClient)
		afterEach(closeServer)

		it('should send tokens to the server', function (this: Context, cb) {
			const message = 'test\nwith newline'
			const data = Buffer.from(message)

			this.server.on('token', (token, connection) => {
				strictEqual(token.toString(), message)
				cb()
			})

			this.client.send(data)
		})

		it('should send tokens back to the client', function (this: Context, cb) {
			const message = 'test\nwith newline'
			const data = Buffer.from(message)

			this.server.on('token', (token, connection) => {
				connection.send(data)
			})

			this.client.on('token', (token) => {
				strictEqual(token.toString(), message)
				cb()
			})

			this.client.send(Buffer.allocUnsafe(0))
		})

		it('should remove closed connections from server#connections', function (this: Context, cb) {
			this.client.on('close', () => {
				deepEqual(this.server.connections, [])
				cb()
			})

			this.client.close()
		})
	})
})
