import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'
import StartButton from '../components/StartButton'
import { assignRoles } from '../shared/lib/gameLogic'
import { updatePlayerRole } from '../shared/api/players'


export default function WaitingRoomMJ({ roomId, code }) {
const players = usePlayers(roomId)
const playerCount = players.length


const handleStart = () => {
const assigned = assignRoles(players)
assigned.forEach(p => updatePlayerRole(p.id, p.role))
}


return (
<div style={{ padding: 20 }}>
<h2>Salle d'attente (MJ)</h2>
<p>Code de la salle : <strong>{code}</strong></p>
<h3>Joueurs connectés ({playerCount})</h3>
{playerCount === 0
  ? <p>Aucun joueur n'a rejoint la salle pour le moment.</p>
  : <PlayerList players={players} showRoles={false} />}
<StartButton onClick={handleStart} />
</div>
)
}
