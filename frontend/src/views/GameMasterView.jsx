import { useMemo } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import PlayerList from '../components/PlayerList'

const isWolfRole = (role) => role && role.toLowerCase().includes('loup')
const isSpecialRole = (role) => {
  if (!role) return false
  if (isWolfRole(role)) return false
  return role.toLowerCase() !== 'villageois'
}

export default function GameMasterView({ roomId, code, masterName }) {
  const players = usePlayers(roomId)
  const { wolves, specials, villagers } = useMemo(() => {
    const filtered = players.filter((player) => !player.isMaster)

    const wolvesAcc = []
    const specialsAcc = []
    const villagersAcc = []

    filtered.forEach((player) => {
      if (isWolfRole(player.role)) {
        wolvesAcc.push(player)
      } else if (isSpecialRole(player.role)) {
        specialsAcc.push(player)
      } else {
        villagersAcc.push(player)
      }
    })

    return {
      wolves: wolvesAcc,
      specials: specialsAcc,
      villagers: villagersAcc
    }
  }, [players])

  const sections = [
    {
      key: 'wolves',
      title: 'Loups-garous',
      description: 'Rassemble la meute et garde un œil sur leurs cibles.',
      players: wolves
    },
    {
      key: 'specials',
      title: 'Rôles spéciaux',
      description: 'Noter leurs capacités pour rythmer la nuit.',
      players: specials
    },
    {
      key: 'villagers',
      title: 'Villageois',
      description: 'Leur force est le nombre : surveille les réactions.',
      players: villagers
    }
  ]

  const totalPlayers = wolves.length + specials.length + villagers.length

  return (
    <div className="players-section">
      <div className="screen-heading screen-heading--center">
        <span className="wolf-icon-small" role="img" aria-hidden="true">🐺</span>
        <h2>{masterName || 'Maître du jeu'}</h2>
      </div>

      <div className="wait-stack">
        <div className="info-card">Code : {code}</div>
        <span className="chip">{totalPlayers} joueur{totalPlayers > 1 ? 's' : ''}</span>
      </div>

      <div className="roles-groups">
        {sections.map((section) => (
          section.players.length > 0 && (
            <div key={section.key} className="roles-group">
              <span className="section-label">{section.title}</span>
              <PlayerList players={section.players} showRoles={true} />
            </div>
          )
        ))}
      </div>

      <p className="secret-warning">Garde ces informations secrètes ! 🤫</p>
    </div>
  )
}
