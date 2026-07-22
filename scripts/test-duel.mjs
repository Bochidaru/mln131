import assert from 'node:assert/strict'

const url = process.env.DUEL_TEST_URL ?? 'ws://127.0.0.1:5266/ws'
const adminUrl = process.env.ADMIN_TEST_URL ?? url.replace(/^ws/, 'http').replace(/\/ws$/, '')
const adminAuthorization = `Basic ${Buffer.from('admin:admin').toString('base64')}`

async function adminRequest(path, options = {}) {
  return fetch(`${adminUrl}${path}`, {
    ...options,
    headers: { Authorization: adminAuthorization, ...options.headers },
  })
}

class TestClient {
  constructor(name) {
    this.name = name
    this.messages = []
    this.waiters = []
  }

  async connect() {
    this.socket = new WebSocket(url)
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      this.messages.push(message)
      for (const waiter of [...this.waiters]) {
        if (waiter.type === message.type && waiter.predicate(message)) {
          waiter.resolve(message)
          this.waiters.splice(this.waiters.indexOf(waiter), 1)
        }
      }
    })
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.send('join', { name: this.name, avatarId: 'block-explorer' })
    const welcome = await this.waitFor('welcome')
    this.id = welcome.playerId
  }

  send(type, payload = {}) {
    this.socket.send(JSON.stringify({ type, payload }))
  }

  waitFor(type, predicate = () => true, timeout = 3000) {
    const existing = this.messages.find((message) => message.type === type && predicate(message))
    if (existing) return Promise.resolve(existing)
    return new Promise((resolve, reject) => {
      const waiter = {
        type,
        predicate,
        resolve: (message) => {
          clearTimeout(timer)
          resolve(message)
        },
      }
      const timer = setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(waiter), 1)
        reject(new Error(`Timed out waiting for ${type}`))
      }, timeout)
      this.waiters.push(waiter)
    })
  }

  close() {
    this.socket?.close()
  }
}

const suffix = Date.now().toString(36)
const first = new TestClient(`DuelTest-A-${suffix}`)
const second = new TestClient(`DuelTest-B-${suffix}`)
const third = new TestClient(`DuelTest-C-${suffix}`)
const fourth = new TestClient(`DuelTest-D-${suffix}`)

try {
  await first.connect()
  await second.connect()
  first.send('pvpRequest', { targetPlayerId: second.id })
  const [sent, received] = await Promise.all([
    first.waitFor('pvpInviteSent', (message) => message.payload?.targetPlayerId === second.id),
    second.waitFor('pvpInvite', (message) => message.payload?.fromPlayerId === first.id),
  ])
  assert.ok(Date.parse(sent.payload.expiresAt) > Date.now())
  assert.equal(sent.payload.expiresAt, sent.payload.cooldownUntil)
  assert.equal(received.payload.expiresAt, sent.payload.expiresAt)
  first.send('pvpRequest', { targetPlayerId: second.id })
  const cooldown = await first.waitFor('pvpCooldown')
  assert.ok(Date.parse(cooldown.payload.cooldownUntil) > Date.now())
  second.send('pvpResponse', { fromPlayerId: first.id, accepted: true })
  await Promise.all([first.waitFor('duelStart'), second.waitFor('duelStart')])

  const initial = await first.waitFor('duelSnapshot', (message) => message.payload?.duelPlayers?.some((player) => player.playerId === first.id))
  const initialPlayer = initial.payload.duelPlayers.find((player) => player.playerId === first.id)
  const initialTarget = initial.payload.duelPlayers.find((player) => player.playerId === second.id)
  first.send('duelInput', { moveX: 1, moveZ: 0, dirX: 1, dirZ: 0, sprint: 0, jump: 0 })
  const moved = await first.waitFor('duelSnapshot', (message) => {
    const player = message.payload?.duelPlayers?.find((candidate) => candidate.playerId === first.id)
    return player && player.x > initialPlayer.x + 0.35
  })
  first.send('duelInput', { moveX: 0, moveZ: 0, dirX: 1, dirZ: 0, sprint: 0, jump: 0 })
  const movedPlayer = moved.payload.duelPlayers.find((player) => player.playerId === first.id)
  assert.ok(movedPlayer.x > initialPlayer.x, 'Duel input must move the server-owned player')

  first.send('duelInput', { moveX: 0, moveZ: 0, dirX: 1, dirZ: 0, sprint: 0, jump: 1 })
  const jumped = await first.waitFor('duelSnapshot', (message) => {
    const player = message.payload?.duelPlayers?.find((candidate) => candidate.playerId === first.id)
    return player && player.y > 1.85
  })
  assert.ok(jumped.payload.duelPlayers.find((player) => player.playerId === first.id).y > 1.85, 'Jump must update the server-owned Y coordinate')
  first.send('duelInput', { moveX: 0, moveZ: 0, dirX: 1, dirZ: 0, sprint: 0, jump: 0 })

  second.send('duelInput', { moveX: 1, moveZ: 0, dirX: -1, dirZ: 0, sprint: 1, jump: 0 })
  await second.waitFor('duelSnapshot', (message) => {
    const player = message.payload?.duelPlayers?.find((candidate) => candidate.playerId === second.id)
    return player && player.x > initialTarget.x + 1.5
  })
  second.send('duelInput', { moveX: 0, moveZ: -1, dirX: -1, dirZ: 0, sprint: 1, jump: 0 })
  const aligned = await second.waitFor('duelSnapshot', (message) => {
    const player = message.payload?.duelPlayers?.find((candidate) => candidate.playerId === second.id)
    return player && player.z < initialTarget.z - 44.5
  }, 10000)
  second.send('duelInput', { moveX: 0, moveZ: 0, dirX: -1, dirZ: 0, sprint: 0, jump: 0 })
  const targetPlayer = aligned.payload.duelPlayers.find((player) => player.playerId === second.id)
  const aimX = targetPlayer.x - movedPlayer.x
  const aimZ = targetPlayer.z - movedPlayer.z
  const aimLength = Math.hypot(aimX, aimZ)
  first.send('duelShoot', { dirX: aimX / aimLength, dirZ: aimZ / aimLength })
  const shot = await first.waitFor('duelShot', (message) => message.payload?.shooterId === first.id)
  assert.ok(shot.payload.shotId)
  assert.ok(Number.isFinite(shot.payload.endX) && Number.isFinite(shot.payload.endZ))
  assert.equal(shot.payload.hit, true)
  const damaged = await first.waitFor('duelSnapshot', (message) => {
    const player = message.payload?.duelPlayers?.find((candidate) => candidate.playerId === second.id)
    return player && player.hp < 100
  })
  assert.equal(damaged.payload.duelPlayers.find((player) => player.playerId === second.id).hp, 66)

  second.send('duelForfeit')
  const finishedAt = Date.now()
  const [firstFinished, secondFinished] = await Promise.all([
    first.waitFor('duelFinished', (message) => message.payload?.winnerId === first.id),
    second.waitFor('duelFinished', (message) => message.payload?.winnerId === first.id),
  ])
  assert.equal(firstFinished.payload.winnerName, first.name)
  assert.equal(firstFinished.payload.loserName, second.name)
  assert.equal(firstFinished.payload.winnerWins, 3)
  assert.equal(secondFinished.payload.winnerScore, firstFinished.payload.winnerScore)
  const result = await first.waitFor('duelResult', () => true, 5_000)
  assert.equal(result.payload.winnerId, first.id)
  assert.ok(result.payload.returnPose)
  assert.ok(Date.now() - finishedAt >= 2_800, 'The result screen must stay visible for three seconds before returning players')

  await third.connect()
  await fourth.connect()
  third.send('pvpRequest', { targetPlayerId: fourth.id })
  await fourth.waitFor('pvpInvite', (message) => message.payload?.fromPlayerId === third.id)
  await Promise.all([
    third.waitFor('pvpInviteExpired', (message) => message.payload?.targetPlayerId === fourth.id, 12_000),
    fourth.waitFor('pvpInviteExpired', (message) => message.payload?.fromPlayerId === third.id, 12_000),
  ])

  third.messages = []
  fourth.messages = []
  third.send('pvpRequest', { targetPlayerId: fourth.id })
  await fourth.waitFor('pvpInvite', (message) => message.payload?.fromPlayerId === third.id)
  fourth.send('pvpResponse', { fromPlayerId: third.id, accepted: true })
  await Promise.all([third.waitFor('duelStart'), fourth.waitFor('duelStart')])

  const adminStatus = await adminRequest('/admin/api/status')
  assert.equal(adminStatus.status, 200)
  const status = await adminStatus.json()
  assert.ok(status.duels.some((duel) => duel.first.id === third.id || duel.second.id === third.id), 'Dashboard must list active duels')

  const systemChat = first.waitFor('chat', (message) => message.playerId === 'system' && message.payload?.text?.includes(third.name) === false && message.payload?.text?.includes(fourth.name))
  const kick = await adminRequest(`/admin/api/players/${fourth.id}/kick`, { method: 'POST' })
  assert.equal(kick.status, 204)
  await systemChat
  const adminDuelResult = await third.waitFor('duelFinished', (message) => message.payload?.winnerId === third.id, 5_000)
  assert.equal(adminDuelResult.payload.winnerWins, 3, 'Kicking a duel player must award the opponent the match')
  await third.waitFor('duelResult', () => true, 5_000)

  console.log('Duel smoke test passed: invite cooldown/expiry, movement, jump, shared result screen, and admin kick adjudication.')
} finally {
  first.close()
  second.close()
  third.close()
  fourth.close()
}
