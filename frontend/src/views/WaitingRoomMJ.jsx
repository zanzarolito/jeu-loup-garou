import { useState } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'
import StartButton from '../components/StartButton'
import { assignRoles } from '../shared/lib/gameLogic'
import { updatePlayerRole } from '../shared/api/players'
import { startRoom } from '../shared/api/rooms'

export default function WaitingRoomMJ({ roomId, code }) {
  const players = usePlayers(roomId)
  const nonMasterPlayers = players.filter((player) => !player.isMaster)
  const playerCount = nonMasterPlayers.length
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    if (playerCount === 0 || isStarting) return

    setIsStarting(true)

    try {
      const assigned = assignRoles(players)
      if (assigned.length === 0) {
        setIsStarting(false)
        return
      }
      await Promise.all(assigned.map((player) => updatePlayerRole(player.id, player.role)))
      await startRoom(roomId)
    } catch (error) {
      console.error('Impossible de lancer la partie :', error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="waiting-wrapper">
      <span className="chip">Maître du jeu</span>
      <div className="waiting-card">
        <div className="waiting-card__header">
          <span className="waiting-card__badge">Code : {code}</span>
          <p className="waiting-card__subtitle">{playerCount} joueur{playerCount > 1 ? 's' : ''} prêt{playerCount > 1 ? 's' : ''}</p>
        </div>
        <PlayerList players={nonMasterPlayers} showRoles={false} />
      </div>

      <div className="waiting-actions">
        <StartButton
          onClick={handleStart}
          disabled={isStarting || playerCount === 0}
          className="btn-full"
        >
          {isStarting ? 'Lancement en cours…' : 'Lancer la partie'}
        </StartButton>
        <p className="status-text">
          {playerCount === 0 ? 'Invite un joueur pour démarrer.' : 'Les rôles se distribueront instantanément.'}
        </p>
      </div>
    </div>
  )
}
