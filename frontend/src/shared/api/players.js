import pb, { createClient } from './pb'


/**
* Crée un joueur dans la base de données
*/
export async function joinRoom(roomId, name, isMaster = false) {
return await pb.collection('players').create({
name,
room: roomId,
isMaster
})
}


/**
* Récupère tous les joueurs d'une salle
*/
export async function listPlayers(roomId) {
try {
return await pb.collection('players').getFullList({
filter: `room = "${roomId}"`
})
} catch (e) {
console.warn('Erreur listPlayers:', e)
return []
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
    return await client.collection('players').subscribe('*', ({ action, record }) => {
      if (record.room === roomId) callback()
    })
  }