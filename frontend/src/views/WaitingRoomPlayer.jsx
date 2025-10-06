import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'

export default function WaitingRoomPlayer({ roomId, name, code }) {
  const players = usePlayers(roomId)
  const playerCount = players.length

  return (
    <div className="waiting-wrapper">
      <span className="chip">{name}</span>
      <div className="waiting-card">
        <div className="waiting-card__header">
          <span className="waiting-card__badge">Code : {code}</span>
          <p className="waiting-card__subtitle">{playerCount} joueur{playerCount > 1 ? 's' : ''} connecté{playerCount > 1 ? 's' : ''}</p>
        </div>
        <PlayerList players={players} showRoles={false} />
      </div>

      <div className="waiting-actions">
        <span className="chip">En attente du maître du jeu</span>
        <p className="status-text">Ton rôle apparaîtra dès le lancement.</p>
      </div>
    </div>
  )
}
