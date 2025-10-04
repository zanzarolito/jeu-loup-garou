// 📁 src/hooks/usePlayers.js
import { useEffect, useState } from 'react'
import { listPlayers, subscribeToPlayers } from '../shared/api/players'

/**
 * Hook React pour écouter en temps réel les joueurs d'une room
 * @param {string} roomId
 */
export function usePlayers(roomId) {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    let mounted = true
    let unsubscribe = () => {}
  
    const loadPlayers = async () => {
      const list = await listPlayers(roomId)
      if (mounted) setPlayers(list)
    }
  
    const setupSubscription = async () => {
      unsubscribe = await subscribeToPlayers(roomId, () => loadPlayers())
    }
  
    loadPlayers()
    setupSubscription()
  
    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [roomId])
  

  return players
}
