import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'


export default function WaitingRoomPlayer({ roomId, name, code }) {
const players = usePlayers(roomId)


return (
<div style={{ padding: 20 }}>
<h2>Salle d'attente</h2>
<p>Bienvenue <strong>{name}</strong></p>
<p>Code de la salle : <strong>{code}</strong></p>
<p>En attente du maître du jeu...</p>
<PlayerList players={players} showRoles={false} />
</div>
)
}