import { publicUserDbs } from '../db/index.js'
import createMlts from 'monotonic-lexicographic-timestamp'
import * as errors from '../lib/errors.js'
import bytes from 'bytes'

const mlts = createMlts()

export function setup (wsServer, config) {
  wsServer.register('blob.get', async ([userId, name], client) => {
    if (!client?.auth) throw new errors.SessionError()
    const publicUserDb = publicUserDbs.get(userId)
    if (!publicUserDb) throw new errors.NotFoundError('User database not found')

    return publicUserDb.blobs.get(name, 'base64')
  })

  wsServer.register('blob.create', async ([base64buf], client) => {
    if (!client?.auth) throw new errors.SessionError()
    const publicUserDb = publicUserDbs.get(client.auth.userId)
    if (!publicUserDb) throw new errors.NotFoundError('User database not found')

    if ((base64buf.length / 1.33) > config.blobSizeLimit) {
      throw new errors.ValidationError(`This item is too big! It must be smaller than ${bytes(config.blobSizeLimit)}.`)
    }

    const name = mlts()
    await publicUserDb.blobs.put(name, Buffer.from(base64buf, 'base64'))
    return {name}
  })
  
  wsServer.register('blob.update', async ([name, base64buf], client) => {
    if (!client?.auth) throw new errors.SessionError()
    const publicUserDb = publicUserDbs.get(client.auth.userId)
    if (!publicUserDb) throw new errors.NotFoundError('User database not found')

    if (name === 'avatar') {
      if ((base64buf.length / 1.33) > config.avatarSizeLimit) {
        throw new errors.ValidationError(`Your avatar image is too big! It must be smaller than ${bytes(config.avatarSizeLimit)}.`)
      }
    } else {
      if ((base64buf.length / 1.33) > config.blobSizeLimit) {
        throw new errors.ValidationError(`This item is too big! It must be smaller than ${bytes(config.blobSizeLimit)}.`)
      }
    }
    
    await publicUserDb.blobs.put(name, Buffer.from(base64buf, 'base64'))
    return {name}
  })

  wsServer.register('blob.delete', async ([name], client) => {
    if (!client?.auth) throw new errors.SessionError()
    const publicUserDb = publicUserDbs.get(client.auth.userId)
    if (!publicUserDb) throw new errors.NotFoundError('User database not found')

    await publicUserDb.blobs.del(name)
  })
}