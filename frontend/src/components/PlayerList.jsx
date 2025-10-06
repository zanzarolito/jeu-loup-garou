const computeRoleVariant = (role) => {
  if (!role) return 'tag--villager'
  const lower = role.toLowerCase()
  if (lower.includes('loup')) return 'tag--wolf'
  if (lower === 'villageois') return 'tag--villager'
  return 'tag--special'
}

export default function PlayerList({ players = [], showRoles = false }) {
  if (!players || players.length === 0) {
    return <p className="helper-subtle">Aucun joueur pour le moment.</p>
  }

  if (showRoles) {
    return (
      <ul className="player-rows">
        {players.map((player) => {
          const role = player.role || 'Rôle non attribué'
          const variant = computeRoleVariant(player.role)

          return (
            <li key={player.id} className="player-row">
              <span className="player-pill">{player.name}</span>
              <span className={`player-role ${variant}`}>{role}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ul className="player-grid">
      {players.map((player) => (
        <li key={player.id} className="player-card">
          {player.name}
        </li>
      ))}
    </ul>
  )
}
