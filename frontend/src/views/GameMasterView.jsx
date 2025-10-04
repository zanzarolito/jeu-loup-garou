import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'

export default function GameMasterView({ roomId, code }) {
  const players = usePlayers(roomId)
  const visiblePlayers = players.filter((player) => !player.isMaster)

  return (
    <div style={{ padding: 20 }}>
      <h2>Tableau du maître du jeu</h2>
      {code && (
        <p>
          Code de la salle : <strong>{code}</strong>
        </p>
      )}
      <p>Voici les rôles attribués à chaque joueur :</p>
      <PlayerList players={visiblePlayers} showRoles={true} />
    </div>
  )
}
