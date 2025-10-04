export default function PlayerRoleView({ player }) {
  if (!player) return null

  return (
    <div style={{ padding: 20 }}>
      <h2>Ton rôle</h2>
      <p>Bienvenue <strong>{player.name}</strong></p>
      {player.role
        ? <p>Tu es <strong>{player.role}</strong>.</p>
        : <p>En attente de ton rôle…</p>}
      <p>Garde cette information secrète !</p>
    </div>
  )
}
