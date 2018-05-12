import * as fs from 'fs'
import * as path from 'path'

function read(filename: string): Buffer {
	const p = path.join('extra/certs', filename)
	return fs.readFileSync(p)
}

const ca = read('ca/ca.crt')
const serverKey = read('server/server.key')
const serverCert = read('server/server.crt')
const clientKey = read('client/client.key')
const clientCert = read('client/client.crt')

export const serverOptions = {
	host: 'localhost',
	port: 8090,

	key: serverKey,
	cert: serverCert,
	ca,
	requestCert: true, // ask for a client cert
}

export const clientOptions = {
	host: 'localhost',
	port: 8090,

	// Necessary only if using the client certificate authentication
	key: clientKey,
	cert: clientCert,
	ca,
}
