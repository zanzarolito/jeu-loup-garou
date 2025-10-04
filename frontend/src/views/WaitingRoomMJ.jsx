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
    <div style={{ padding: 20 }}>
      <h2>Salle d'attente (MJ)</h2>
      <p>
        Code de la salle : <strong>{code}</strong>
      </p>
      <h3>Joueurs connectés (hors MJ) — {playerCount}</h3>
      {playerCount === 0
        ? <p>Aucun joueur n'a rejoint la salle pour le moment.</p>
        : <PlayerList players={nonMasterPlayers} showRoles={false} />}
      <StartButton onClick={handleStart} disabled={isStarting || playerCount === 0}>
        {isStarting ? 'Lancement en cours…' : 'Lancer la partie'}
      </StartButton>
    </div>
  )
}
