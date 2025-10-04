import pb, { createClient } from './pb'


export async function createRoom(code) {
return await pb.collection('rooms').create({
code,
started: false
})
}


export async function getRoom(id) {
return await pb.collection('rooms').getOne(id)
}


export async function tryToGetRoom(code) {
const rooms = await pb.collection('rooms').getFullList({
filter: `code = "${code}"`
})
return rooms[0] || null
}


export async function startRoom(roomId) {
return await pb.collection('rooms').update(roomId, { started: true })
}


export async function subscribeToRoom(roomId, callback) {
  const client = createClient()

  const unsubscribe = await client.collection('rooms').subscribe(
    roomId,
    (payload) => {
      if (!callback) return
      callback(payload)
    }
  )

  return async () => {
    try {
      await unsubscribe()
    } finally {
      client.realtime.unsubscribeAll()
    }
  }
}
