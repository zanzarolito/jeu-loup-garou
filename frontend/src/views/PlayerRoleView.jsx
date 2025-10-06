import { ROLE_DEFINITIONS } from '../shared/lib/gameLogic'

export default function PlayerRoleView({ player }) {
  if (!player) return null

  const roleInfo = player.role ? ROLE_DEFINITIONS[player.role] : null

  return (
    <div className="player-screen">
      <div className="player-screen__header">
        <span className="wolf-icon-small" role="img" aria-hidden="true">🐺</span>
        <h2>{player.name}</h2>
      </div>

      <div className="player-section">
        <span className="section-label">Ton rôle</span>
        <div className="role-card role-card--player">
          <span className="role-name">{player.role || 'Distribution en cours…'}</span>
        </div>
      </div>

      {roleInfo?.description && (
        <div className="player-section">
          <span className="section-label">Description</span>
          <p className="status-text player-screen__description">{roleInfo.description}</p>
        </div>
      )}

      <p className="secret-warning">Garde ces informations secrètes ! 🤫</p>
    </div>
  )
}
