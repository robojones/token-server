import { strictEqual } from 'assert'

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

describe('TokenServer', () => {
	describe('#close()', () => {
		beforeEach(setupServer)
		afterEach(closeServer)

		it('should close the server', function (this: Context, cb) {
			const result = this.server.close()
			strictEqual(result, true, '#close() returned false')

			this.server.on('close', () => cb())
		})

		it('should return false if called twice', function (this: Context, cb) {
			const result = this.server.close()
			const result2 = this.server.close()

			strictEqual(result, true, 'first call returned false')
			strictEqual(result2, false, 'second call returned true')

			this.server.on('close', () => cb())
		})
	})

	describe('#connect', () => {

		describe('when already connected', () => {
			beforeEach(setupServer)
			afterEach(closeServer)
			it('should return false if already connected', function (this: Context) {
				const success = this.server.connect()
				strictEqual(success, false, 'returned true')
			})
		})

		describe('when not connected', () => {
			beforeEach(setupServer)
			beforeEach(closeServer)
			afterEach(closeServer)

			it('should reconnect when not connected', function (this: Context, cb) {
				const success = this.server.connect()
				strictEqual(success, true, 'returned false')

				this.server.on('connect', () => cb())
			})
		})
	})

	describe('error behavior', () => {

		describe('"error" event', () => {
			beforeEach(setupServer)
			afterEach(closeServer)

			it('should be emitted if port is already in use', function (this: Context, cb) {
				const secondServer = new TokenServer(serverOptions)
				secondServer.on('error', () => {
					cb()
				})
			})
		})

		describe('"close" event', () => {
			beforeEach(setupServer)
			afterEach(closeServer)

			it('should get passed hadError=true if the server could not listen to the port', function (this: Context, cb) {
				const secondServer = new TokenServer(serverOptions)
				secondServer.on('error', () => null)
				secondServer.on('close', (hadError) => {
					strictEqual(hadError, true, 'hadError is not true')
					cb()
				})
			})
		})
	})

	describe('normal behavior', () => {
		describe('"connect" event', () => {
			afterEach(closeServer)

			it('should be emitted', function (this: Context, cb) {
				this.server = new TokenServer(serverOptions)

				this.server.on('connect', () => cb())
			})
		})

		describe('"close" event', () => {
			beforeEach(setupServer)

			it('should get passed hadError=true if the server closed with no error', function (this: Context, cb) {
				this.server.on('close', (hadError) => {
					strictEqual(hadError, false, 'hadError is true')
					cb()
				})

				this.server.close()
			})
		})
	})
})

