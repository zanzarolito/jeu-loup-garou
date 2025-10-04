// src/shared/api/pb.js
import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://localhost:8090')

// Utilitaire : pour des abonnements isolés
export const createClient = () => new PocketBase(import.meta.env.VITE_PB_URL || 'http://localhost:8090')

export default pb
