import test from 'ava'
import { createServer, TestFramework } from './_util.js'

let instances = []

test.after.always(async t => {
  for (let inst of instances) {
    await inst.close()
  }
  instances = []
})


test('ping method', async t => {
  let sim = new TestFramework()
  let inst = await createServer()
  instances = [inst]
  let api = inst.api

  await sim.createCitizen(inst, 'alice')
  await sim.users.alice.login()
  await sim.createCommunity(inst, 'folks')

  const {alice, folks} = sim.users

  await alice.login()
  const res1 = await api.dbmethod.call({
    database: folks.userId,
    method: 'ctzn.network/ping-method',
    args: {message: 'Ping?'}
  })
  t.is(res1.result.code, 'success')
  t.is(res1.result.details.message, 'Ping?')

  const res2 = await api.dbmethod.getResult({call: res1.key})
  t.is(res2.value.code, 'success')
  t.is(res2.value.details.message, 'Ping?')

  const res3 = await api.dbmethod.call({
    database: folks.userId,
    method: 'ctzn.network/ping-method',
    args: {message: 1234}
  })
  t.is(res3.result.code, 'validation-failed')
  t.is(typeof res3.result.details.message, 'string')
})

test('remote handling', async t => {
  let sim = new TestFramework()
  let inst1 = await createServer()
  let inst2 = await createServer()
  instances.push(inst1)
  instances.push(inst2)
  
  await sim.createCitizen(inst1, 'bob')
  await sim.users.bob.login()
  await sim.createCommunity(inst1, 'folks')
  await sim.createCitizen(inst2, 'alice')
  const {alice, folks} = sim.users

  await alice.login()
  await inst2.api.communities.join(folks.userId)

  // await new Promise(r => setTimeout(r, 5e3))
  // await inst2.api.debug.whenAllSynced()

  const res1 = await inst2.api.dbmethod.call({
    database: folks.userId,
    method: 'ctzn.network/ping-method',
    args: {message: 'Ping?'}
  })
  t.is(res1.result.code, 'success')
  t.is(res1.result.details.message, 'Ping?')

  const res2 = await inst2.api.dbmethod.getResult({call: res1.key})
  t.is(res2.value.code, 'success')
  t.is(res2.value.details.message, 'Ping?')

  const res3 = await inst2.api.dbmethod.call({
    database: folks.userId,
    method: 'ctzn.network/ping-method',
    args: {message: 1234}
  })
  t.is(res3.result.code, 'validation-failed')
  t.is(typeof res3.result.details.message, 'string')
})