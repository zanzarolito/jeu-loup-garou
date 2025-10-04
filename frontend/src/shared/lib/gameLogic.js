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
  
  export const ROLES = ['loup', 'voyante', 'villageois']
  
  /**
   * Assigne les rôles de manière aléatoire aux joueurs
   */
  export function assignRoles(players, roles = ROLES) {
    const shuffled = [...players].sort(() => 0.5 - Math.random())
    return shuffled.map((p, i) => ({
      ...p,
      role: roles[i % roles.length]
    }))
  }
  