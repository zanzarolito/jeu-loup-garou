import pb, { createClient } from './pb'


/**
* Crée un joueur dans la base de données
*/
export async function joinRoom(roomId, name, isMaster = false) {
  const player = await pb.collection('players').create({
name,
room: roomId,
isMaster
})
  return player
}


/**
* Récupère tous les joueurs d'une salle
*/
export async function listPlayers(roomId) {
    try {
      const result = await pb.collection('players').getFullList({
        filter: `room = "${roomId}" || room.id = "${roomId}"`,
        expand: 'room',
        sort: 'created'
      })
      return result
    } catch (e) {
      if (e?.isAbort || e?.status === 0) {
        // PocketBase annule automatiquement les requêtes concurrentes ; on ignore ce cas
        return null
      }
      console.warn('Erreur listPlayers:', e)
      throw e
    }
  }


/**
* Met à jour le rôle d’un joueur
*/
export async function updatePlayerRole(playerId, role) {
return await pb.collection('players').update(playerId, { role })
}


/**
* Abonnement temps réel à la collection des joueurs d'une salle
* @param {string} roomId
* @param {function} callback
* @returns {function} unsubscribe
*/
export async function subscribeToPlayers(roomId, callback) {
  const client = createClient()

  const getRoomId = (record) => {
    if (!record) return null

    const value = record.room

    if (Array.isArray(value)) {
      return value[0] ?? null
    }

    if (value && typeof value === 'object') {
      return value.id ?? null
    }

    return value ?? null
  }

  const unsubscribe = await client.collection('players').subscribe(
    '*',
    (payload) => {
      if (!callback) return

      const recordRoomId = getRoomId(payload?.record)

      if (recordRoomId && recordRoomId !== roomId) {
        return
      }

      callback(payload)
    },
    { filter: `room = "${roomId}" || room.id = "${roomId}"` }
  )

  return async () => {
    try {
      await unsubscribe()
    } finally {
      client.realtime.unsubscribeAll()
    }
  }
}
