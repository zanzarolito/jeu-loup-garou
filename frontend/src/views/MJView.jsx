import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'
import StartButton from '../components/StartButton'
import { assignRoles } from '../shared/lib/gameLogic'
import { updatePlayerRole } from '../shared/api/players'


/**
* Vue MJ : affiche la liste des joueurs et permet d'assigner les rôles
*/
export default function MJView({ roomId }) {
const players = usePlayers(roomId)


const handleStart = () => {
const assigned = assignRoles(players)
assigned.forEach(p => updatePlayerRole(p.id, p.role))
}


return (
<div>
<h2>Vue MJ</h2>
<PlayerList players={players} showRoles={true} />
<StartButton onClick={handleStart} />
</div>
)
}