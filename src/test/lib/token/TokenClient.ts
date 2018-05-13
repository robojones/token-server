import { strictEqual } from 'assert'
import { TokenClient } from '../../..'
import { clientOptions } from '../../options'
import { closeServer, setupServer } from './TokenServer'
import { Context } from './TokenServerAndClient'

export function setupClient (this: Context, cb) {
	console.log('setupClient()')
	this.client = new TokenClient(clientOptions)
	this.client.on('connect', () => cb())
}

export function closeClient (this: Context, cb) {
	console.log('closeClient()')
	if (!this.client) {
		return cb()
	}

	this.client.on('close', () => cb())

	if (!this.client.close()) {
		cb()
	}
}

export function waitForClientClose(this: Context, cb) {
	console.log('waitForClientClose()')
	if (!this.client) {
		return cb()
	}

	this.client.on('close', () => cb())
}

describe('TokenClient', () => {
	describe('#close()', () => {
		beforeEach(setupServer)
		beforeEach(setupClient)
		afterEach(closeClient)
		afterEach(closeServer)

		it('should close the client', function (this: Context, cb) {
			const result = this.client.close()
			strictEqual(result, true, '#close() returned false')

			this.client.on('close', () => cb())
		})

		it('should return false if called twice', function (this: Context, cb) {
			const result = this.client.close()
			const result2 = this.client.close()

			strictEqual(result, true, 'first call returned false')
			strictEqual(result2, false, 'second call returned true')

			this.client.on('close', () => cb())
		})
	})

	describe('#send', () => {
		it ('should return false if not connected.', function (this: Context) {
			this.client = new TokenClient(clientOptions)
			this.client.on('error', () => null)
			this.client.close()

			const success = this.client.send(Buffer.from('test'))
			strictEqual(success, false, 'returned true')
		})
	})

	describe('error behavior', () => {

		describe('"error" event', () => {
			afterEach(waitForClientClose)

			it('should be emitted if the client cannot connect', function (this: Context, cb) {

				this.client = new TokenClient(clientOptions)

				this.client.on('error', () => {
					cb()
				})
			})
		})

		describe('"close" event', () => {
			afterEach(closeClient)
			afterEach(closeServer)

			it('should get passed hadError=true if the client could not connect', function (this: Context, cb) {
				this.client = new TokenClient(clientOptions)
				this.client.on('error', () => null)
				this.client.on('close', (hadError) => {
					strictEqual(hadError, true, 'hadError is not true')
					cb()
				})
			})
		})
	})

	describe('normal behavior', () => {
		describe('"connect" event', () => {
			beforeEach(setupServer)
			afterEach(closeClient)
			afterEach(closeServer)

			it('should be emitted', function (this: Context, cb) {
				this.client = new TokenClient(clientOptions)

				this.client.on('connect', () => cb())
			})
		})

		describe('"close" event', () => {
			beforeEach(setupServer)
			beforeEach(setupClient)
			afterEach(closeClient)
			afterEach(closeServer)

			it('should get passed hadError=true if the client closed with no error', function (this: Context, cb) {
				this.client.on('close', (hadError) => {
					console.log('close!!!')
					strictEqual(hadError, false, 'hadError is true')
					cb()
				})

				this.client.close()
			})
		})
	})
})
