import { deepEqual, throws } from 'assert'
import { Message } from '../../../lib/connection/Message'

describe('Message', () => {


	describe('.encode()', () => {
		function test(raw: string, should: string) {
			const result = Message.escape(Buffer.from(raw))
			deepEqual(result, Buffer.from(should), `"${result.toString('utf-8')}" should be "${should}"`)
		}

		it('should escape newlines', () => {
			test('test\nwith\nnewlines.', 'test\\nwith\\nnewlines.')
			test('\n\n\n', '\\n\\n\\n')
		})

		it('should not escape other escape sequences', () => {
			test('tabs\treturns\r', 'tabs\treturns\r')
			test('\r\r\t\t', '\r\r\t\t')
		})

		it('should escape escaped backslashes', () => {
			test('\\n not a newline \\t', '\\\\n not a newline \\\\t')
			test('\\\n', '\\\\\\n')
		})
	})

	describe('.unescape()', () => {
		function test(raw: string, should: string) {
			const result = Message.unescape(Buffer.from(raw))
			deepEqual(result, Buffer.from(should), `"${result.toString('utf-8')}" should be "${should}"`)
		}

		it('should unescape newlines', () => {
			test('\\n', '\n')
			test('\\n\\n', '\n\n')
		})

		it('should not unescape other escape sequences', () => {
			test('\r\t', '\r\t')
		})

		it('should unescape backslashes', () => {
			test('\\\\', '\\')
			test('\\\\\\n', '\\\n')
		})

		it('should throw if an unescaped backslash is found', () => {
			throws(() => {
				Message.unescape(Buffer.from('\\'))
			})
			throws(() => {
				Message.unescape(Buffer.from('\\ok'))
			})
		})
	})
})
