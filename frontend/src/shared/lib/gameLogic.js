// 📁 src/shared/lib/gameLogic.js

/**
 * Génère un code de salle aléatoire (ex: ABCDEF)
 * @param {number} length - Longueur du code
 * @returns {string}
 */
export function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const ROLE_CATALOG = [
  {
    categorie: 'Base',
    roles: [
      { nom: 'Villageois', description: 'Aucun pouvoir spécial, vote le jour', max: Infinity },
      { nom: 'Loup-Garou', description: 'Tue une victime chaque nuit avec les autres Loups', max: Infinity }
    ]
  },
  {
    categorie: 'Soutien villageois',
    roles: [
      { nom: 'Voyante', description: 'Chaque nuit, découvre le rôle d’un joueur', max: 1 },
      { nom: 'Sorcière', description: '2 potions : une pour sauver, une pour tuer', max: 1 },
      { nom: 'Chasseur', description: 'Tire sur un joueur à sa mort', max: 1 },
      { nom: 'Cupidon', description: 'Lie deux joueurs amoureux, même ou différents camps', max: 1 },
      { nom: 'Petite Fille', description: 'Espionne pendant la nuit (risque de mort si repérée)', max: 1 },
      { nom: 'Ancien', description: 'Résiste à la première attaque des Loups', max: 1 },
      { nom: 'Idiot du Village', description: 'Ne meurt pas s’il est voté, mais perd le droit de vote', max: 1 },
      { nom: 'Maire', description: 'Vote compte double, élu en début de partie', max: 1 }
    ]
  },
  {
    categorie: 'Neutres et spéciaux',
    roles: [
      { nom: 'Voleur', description: 'Choisit son rôle parmi deux cartes non distribuées', max: 1 },
      { nom: 'Enfant Sauvage', description: 'Imite un modèle et devient Loup si son modèle meurt', max: 1 },
      { nom: 'Renard', description: 'Peut détecter un Loup à proximité', max: 1 },
      { nom: 'Ange', description: 'Gagne s’il est éliminé le premier jour', max: 1 }
    ]
  },
  {
    categorie: 'Loups spéciaux',
    roles: [
      { nom: 'Loup-Garou Blanc', description: 'Tue seul un autre Loup certaines nuits', max: 1 },
      { nom: 'Grand Méchant Loup', description: 'Peut tuer deux victimes si un autre Loup est mort', max: 1 }
    ]
  },
  {
    categorie: 'Rares / bonus',
    roles: [
      { nom: 'Bouffon', description: 'Gagne s’il est éliminé par le vote du village', max: 1 },
      { nom: 'Montreur d’Ours', description: 'Grognement si un Loup est assis à côté', max: 1 }
    ]
  }
]

export const ROLE_DEFINITIONS = ROLE_CATALOG.flatMap(({ roles }) => roles).reduce(
  (acc, role) => {
    acc[role.nom] = role
    return acc
  },
  {}
)

const STANDARD_DISTRIBUTION = [
  {
    minPlayers: 8,
    maxPlayers: 8,
    getWolfCount: () => 2,
    specialRoles: ['Voyante', 'Sorcière']
  },
  {
    minPlayers: 9,
    maxPlayers: 10,
    getWolfCount: (count) => (count >= 10 ? 3 : 2),
    specialRoles: ['Voyante', 'Sorcière', 'Cupidon']
  },
  {
    minPlayers: 11,
    maxPlayers: 12,
    getWolfCount: () => 3,
    specialRoles: ['Voyante', 'Sorcière', 'Chasseur', 'Cupidon']
  },
  {
    minPlayers: 13,
    maxPlayers: 15,
    getWolfCount: () => 4,
    specialRoles: ['Voyante', 'Sorcière', 'Chasseur', 'Cupidon', 'Petite Fille']
  },
  {
    minPlayers: 16,
    maxPlayers: Infinity,
    getWolfCount: (count) => (count >= 18 ? 5 : 4),
    specialRoles: ['Voyante', 'Sorcière', 'Chasseur', 'Ancien', 'Idiot du Village', 'Renard']
  }
]

const DEFAULT_SPECIAL_ROLES = ['Voyante', 'Sorcière']

const shuffle = (items) => {
  const clone = [...items]
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[clone[i], clone[j]] = [clone[j], clone[i]]
  }
  return clone
}

const findDistribution = (playerCount) =>
  STANDARD_DISTRIBUTION.find(({ minPlayers, maxPlayers }) =>
    playerCount >= minPlayers && playerCount <= maxPlayers
  ) || null

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const computeWolfCount = (playerCount) => {
  const distribution = findDistribution(playerCount)
  if (distribution) {
    const wolves = distribution.getWolfCount(playerCount)
    return clamp(wolves, 1, Math.max(1, playerCount - 1))
  }

  return clamp(Math.round(playerCount / 3), 1, Math.max(1, playerCount - 1))
}

const computeSpecialRoles = (playerCount) => {
  const distribution = findDistribution(playerCount)
  const baseList = distribution ? distribution.specialRoles : DEFAULT_SPECIAL_ROLES
  return baseList.filter((roleName) => ROLE_DEFINITIONS[roleName])
}

/**
 * Assigne des rôles cohérents à chaque joueur (hors maître du jeu)
 * @param {Array} players - liste de joueurs PocketBase
 * @returns {Array} joueurs enrichis du rôle à attribuer
 */
export function assignRoles(players) {
  const eligiblePlayers = players.filter((player) => !player.isMaster)
  const playerCount = eligiblePlayers.length

  if (playerCount === 0) return []

  const shuffledPlayers = shuffle(eligiblePlayers)
  const wolfCount = computeWolfCount(playerCount)
  const specialRoles = computeSpecialRoles(playerCount)
  const maxSpecials = Math.max(0, playerCount - wolfCount)
  const trimmedSpecials = specialRoles.slice(0, maxSpecials)

  const assigned = []

  // Assigne les loups-garous
  const wolves = shuffledPlayers.splice(0, wolfCount)
  assigned.push(
    ...wolves.map((player) => ({
      ...player,
      role: 'Loup-Garou'
    }))
  )

  // Assigne les rôles spéciaux uniques
  trimmedSpecials.forEach((roleName) => {
    if (shuffledPlayers.length === 0) return
    const player = shuffledPlayers.shift()
    assigned.push({
      ...player,
      role: roleName
    })
  })

  // Les restants deviennent villageois
  assigned.push(
    ...shuffledPlayers.map((player) => ({
      ...player,
      role: 'Villageois'
    }))
  )

  return assigned
}
  
