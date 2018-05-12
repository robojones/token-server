import { EventEmitter } from 'events'

import { Connection } from '../connection/Connection'
import { Status } from './Status'

export type ErrorListener = (error: Error) => void

export type ConnectListener = () => void

export type CloseListener = (
	/** Is true if the connection was closed by an error. */
	hadError: boolean,
) => void

export type TokenListener = (
	/** Is true if the connection was closed by an error. */
	token: Buffer,
	/** The connection that sent this token. */
	connection: Connection,
) => void

export declare interface TokenAPI extends EventEmitter {
	/** The error event is emitted before the "close" event. */
	on(event: 'error', listener: ErrorListener): this
	/** Is emitted when the server/client is connected to its port. */
	on(event: 'connect', listener: ConnectListener): this
	/** Is always emitted after the "error" event or when the connection gets closed. */
	on(event: 'close', listener: CloseListener): this
	on(event: 'token', listener: TokenListener): this

	/** The error event is emitted before the "close" event. */
	once(event: 'error', listener: ErrorListener): this
	/** Is emitted when the server/client is connected to its port. */
	once(event: 'connect', listener: ConnectListener): this
	/** Is always emitted after the "error" event or when the connection gets closed. */
	once(event: 'close', listener: CloseListener): this
	once(event: 'token', listener: TokenListener): this

	emit(event: 'error', Error): boolean
	emit(event: 'connect'): boolean
	emit(event: 'close', hadError: boolean): boolean
	emit(event: 'token', token: Buffer, connection: Connection): boolean
}

export abstract class TokenAPI extends EventEmitter {
	/** The status of the client. */
	public status: Status

	/**
	 * Closes the connection to the server/client.
	 * Returns false if the connection was already closed.
	 */
	public abstract close(): boolean

	/**
	 * If the connection was closed you can use this method to connect it again.
	 * If a new connection was created the method returns false.
	 * If there already is an active connection false will be retured.
	 * @param delay Number of milliseconds until the reconnect. (default: 0)
	 */
	public abstract connect(delay: number): boolean
}
