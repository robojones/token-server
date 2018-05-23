import { deepEqual, strictEqual } from 'assert'
import { IBeforeAndAfterContext, ITestCallbackContext } from 'mocha'
import { Duplex } from 'stream'
import * as through from 'through2'
import { Connection } from '../../../lib/connection/Connection'


describe('Connection', () => {
	describe('"token" event', () => {
		interface Context extends ITestCallbackContext, IBeforeAndAfterContext {
			stream: Duplex
			con: Connection
		}

		beforeEach(function beforeEachFn(this: Context) {
			this.stream = through()
			this.con = new Connection(this.stream)
		})

		it('should be emitted when a token is received', async function (this: Context, cb) {
			this.con.once('token', (token) => {
				strictEqual(token.toString(), 'test')
				cb()
			})
			this.stream.write('test\n')
		})

		it('should be able to transmit multiple tokens in one message', function (this: Context) {
			const tokens = ['test1', 'test2', 'test3']
			const results: string[] = []

			this.con.on('token', (token) => {
				results.push(token.toString())
			})

			this.stream.push(tokens.join('\n') + '\n')

			deepEqual(results, tokens)
		})
	})

	describe('#send()', () => {
		interface Context extends ITestCallbackContext, IBeforeAndAfterContext {
			client: Duplex
			server: Duplex
			clientCon: Connection
			serverCon: Connection
		}

		beforeEach(function beforeEachFn(this: Context) {
			this.client = through()
			this.server = through()

			this.client.pipe(this.server)

			this.clientCon = new Connection(this.client)
			this.serverCon = new Connection(this.server)
		})

		it('should send the message', function (this: Context, cb) {
			const msg = 'Test message\n with newline'
			this.serverCon.on('token', (token) => {
				strictEqual(token.toString(), msg)
				cb()
			})

			this.clientCon.send(Buffer.from(msg))
		})

		it('should return false if the message could not be written.', function (this: Context) {
			const msg = 'Test message\n with newline'

			this.clientCon.close()
			strictEqual(this.clientCon.send(Buffer.from(msg)), false)
		})
	})

	describe('#close()', () => {
		interface Context extends ITestCallbackContext, IBeforeAndAfterContext {
			stream: Duplex
			con: Connection
		}

		beforeEach(function beforeEachFn(this: Context) {
			this.stream = through()
			this.con = new Connection(this.stream)
		})

		it('should end the stream', function (this: Context) {
			strictEqual(this.con.isDead, false, 'should initially be writable')
			this.con.close()
			strictEqual(this.con.isDead, true, 'should be closed.')
		})

		it('should return false when the stream is already closed', function (this: Context) {
			strictEqual(this.con.close(), true, 'first call should return true')
			strictEqual(this.con.close(), false, 'second call should return false')
		})
	})

	describe('#remoteClose()', () => {
		interface Context extends ITestCallbackContext, IBeforeAndAfterContext {
			input: Duplex
			output: Duplex
			con: Connection
		}

		beforeEach(function beforeEachFn(this: Context) {
			this.input = through()
			this.output = through()
			this.input.pipe(this.output)

			this.con = new Connection(this.input)
		})

		it('should close the connection', function (this: Context, cb) {
			this.output.on('finish', cb)
			const success = this.con.remoteClose()
			strictEqual(success, true)
		})

		it('should not close twice.', function (this: Context, cb) {
			this.output.on('finish', cb)
			const success = this.con.remoteClose()
			strictEqual(success, true)
		})

		it('should return false if the close message was not written', function (this: Context, cb) {
			this.output.on('finish', cb)
			this.con.close()
			const success = this.con.remoteClose()
			strictEqual(success, false)
		})
	})
})
