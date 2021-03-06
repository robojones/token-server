import { strictEqual } from 'assert'

import { Status, TokenClient } from '../../..'
import { clientOptions } from '../../options'
import { closeServer, setupServer } from './TokenServer'
import { Context } from './TokenServerAndClient'

export function setupClient (this: Context, cb) {
	this.client = new TokenClient(clientOptions)
	this.client.once('connect', () => cb())
}

export function closeClient (this: Context, cb) {
	if (!this.client) {
		return cb()
	}

	this.client.once('close', () => cb())

	if (!this.client.close()) {
		cb()
	}
}

export function waitForClientClose(this: Context, cb) {
	if (!this.client) {
		return cb()
	}

	this.client.once('close', () => cb())
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
			strictEqual(this.client.status, Status.CLOSED)

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
		it('should return false if not connected.', function (this: Context) {
			this.client = new TokenClient(clientOptions)
			this.client.on('error', () => null)
			this.client.close()

			const success = this.client.send(Buffer.from('test'))
			strictEqual(success, false, 'returned true')
		})
	})

	describe('#connect', () => {

		describe('when already connected', () => {
			beforeEach(setupServer)
			beforeEach(setupClient)
			afterEach(closeClient)
			afterEach(closeServer)

			it('should return false if already connected', function (this: Context) {
				const success = this.client.connect()
				strictEqual(success, false, 'returned true')
			})
		})

		describe('when not connected', () => {
			beforeEach(setupServer)
			beforeEach(setupClient)
			beforeEach(closeClient)
			afterEach(closeClient)
			afterEach(closeServer)

			it('should reconnect when not connected', function (this: Context, cb) {
				const success = this.client.connect()
				strictEqual(success, true, 'returned false')

				this.client.on('connect', () => cb())
			})
		})
	})

	describe('error behavior', () => {

		describe('"error" event', () => {
			afterEach(waitForClientClose)

			it('should be emitted if the client cannot connect', function (this: Context, cb) {

				this.client = new TokenClient(clientOptions)

				this.client.on('error', () => {
					// Status should not be updated yet.
					strictEqual(this.client.status, Status.CONNECTING)
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
					// Status should now be updated.
					strictEqual(this.client.status, Status.OFFLINE)
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

				this.client.on('connect', () => {
					strictEqual(this.client.status, Status.ONLINE)
					cb()
				})
			})
		})

		describe('"close" event', () => {
			beforeEach(setupServer)
			beforeEach(setupClient)
			afterEach(closeClient)
			afterEach(closeServer)

			it('should get passed hadError=true if no error occured', function (this: Context, cb) {
				this.client.on('close', (hadError) => {
					strictEqual(this.client.status, Status.OFFLINE)
					strictEqual(hadError, false, 'hadError is true')
					cb()
				})

				this.client.close()
			})
		})
	})
})
