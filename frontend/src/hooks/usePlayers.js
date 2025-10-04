import { useEffect, useState } from 'react'
import { listPlayers, subscribeToPlayers } from '../shared/api/players'

const sortByCreated = (items) =>
  [...items].sort((a, b) => new Date(a.created) - new Date(b.created))

export function usePlayers(roomId) {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (!roomId) {
      setPlayers([])
      return () => {}
    }

    let mounted = true
    let unsubscribe = async () => {}

    const loadPlayers = async () => {
      try {
        const list = await listPlayers(roomId)
        // PocketBase annule certaines requêtes concurrentes : on ignore ces cas silencieusement.
        if (!mounted || !Array.isArray(list)) return
        setPlayers(sortByCreated(list))
      } catch (error) {
        if (error?.isAbort || error?.status === 0) return
        console.error('Impossible de charger les joueurs :', error)
      }
    }

    const handleRealtime = async ({ record }) => {
      if (!mounted) return

      if (record) {
        const recordRoomId = Array.isArray(record.room)
          ? record.room[0]
          : typeof record.room === 'object'
            ? record.room?.id
            : record.room

        if (recordRoomId && recordRoomId !== roomId) {
          return
        }
      }

      await loadPlayers()
    }

    const init = async () => {
      await loadPlayers()
      unsubscribe = await subscribeToPlayers(roomId, handleRealtime)
    }

    init().catch((error) => {
      console.error('Initialisation players échouée :', error)
    })

    return () => {
      mounted = false
      Promise.resolve(unsubscribe()).catch(() => {})
    }
  }, [roomId])

  return players
}
