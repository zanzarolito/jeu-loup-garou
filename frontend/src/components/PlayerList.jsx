export default function PlayerList({ players, showRoles = false }) {
  return (
    <ul>
      {players.map((player) => {
        const masterBadge = player.isMaster ? ' (Maître du jeu)' : ''
        const roleBadge = showRoles && player.role ? ` — ${player.role}` : ''

        return (
          <li key={player.id}>
            {player.name}
            {masterBadge}
            {roleBadge}
          </li>
        )
      })}
    </ul>
  )
}
