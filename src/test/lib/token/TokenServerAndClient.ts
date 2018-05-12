import { strictEqual } from 'assert'
import { IBeforeAndAfterContext, ITestCallbackContext } from 'mocha'
import { TokenClient, TokenServer } from '../../..'
import { clientOptions, serverOptions } from '../../options'

interface Context extends ITestCallbackContext, IBeforeAndAfterContext {
	server: TokenServer
	client: TokenClient
}

function beforeEachFn (this: Context, cb) {
	this.server = new TokenServer(serverOptions)
	this.server.on('connect', () => {
		this.client = new TokenClient(clientOptions)
		this.client.on('connect', () => {
			cb()
		})
	})
}

function afterEachFn (this: Context, cb) {
	this.server.on('close', () => {
		cb()
	})
	this.client.close()
	this.server.close()
}

describe('TokenServer and TokenClient', () => {

	beforeEach(beforeEachFn)

	afterEach(afterEachFn)

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
})
