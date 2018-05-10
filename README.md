# token-server - Command Transport Protocol

[![CircleCI](https://circleci.com/gh/robojones/token-server.svg?style=svg)](https://circleci.com/gh/robojones/token-server)

A lightweight framework for executing asynchronous commands via a TCP based protocol.

## The Plan

### API

```typescript
const server = new Server(8080)
server.on('error', (error) => {
	// ...handle errors...
	// The Server will automatically retry in 1s intervals to listen to the port.
})
server.cert(...)
server.command('hasSegment', (video: string) => {
	return 0 // (0 | 1 | 2)
})

const client = new Client('c1.sharkcdn.net', 8080)
client.on('error', (error) => {
	// ...handle errors...
	// The Server will automatically retry in 1s intervals to listen to the port.
})
const status = await client.exec('hasSegment', 'video1/segment1.m4s')
```

### Layers
#### 1. Parser

- 2B ID
- 1B Command
- nB Payload
- 1B Newline (Terminates the Message)

#### 2. Socket wrapper
Result logic, Promises, ID-Manager

#### 3. Resolve Names
