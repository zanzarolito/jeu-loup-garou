import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'


export default function WaitingRoomPlayer({ roomId, name, code }) {
const players = usePlayers(roomId)
const playerCount = players.length


return (
<div style={{ padding: 20 }}>
<h2>Salle d'attente</h2>
<p>Bienvenue <strong>{name}</strong></p>
<p>Code de la salle : <strong>{code}</strong></p>
<p>En attente du maître du jeu...</p>
<h3>Joueurs connectés ({playerCount})</h3>
{playerCount === 0
  ? <p>Aucun joueur n'a rejoint la salle pour le moment.</p>
  : <PlayerList players={players} showRoles={false} />}
</div>
)
}
