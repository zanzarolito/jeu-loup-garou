import { ROLE_DEFINITIONS } from '../shared/lib/gameLogic'


export default function PlayerRoleView({ player }) {
  if (!player) return null

  const roleInfo = player.role ? ROLE_DEFINITIONS[player.role] : null

  return (
    <div style={{ padding: 20 }}>
      <h2>Ton rôle</h2>
      <p>Bienvenue <strong>{player.name}</strong></p>
      {player.role
        ? (
          <div>
            <p>Tu es <strong>{player.role}</strong>.</p>
            <p>Garde cette information secrète !</p>
          </div>
          )
        : <p>En attente de ton rôle…</p>}

      {roleInfo?.description && (
        <div style={{ marginTop: 32 }}>
          <h3>Description</h3>
          <p>{roleInfo.description}</p>
        </div>
      )}
    </div>
  )
}
