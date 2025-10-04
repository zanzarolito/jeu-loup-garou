// 📁 src/App.jsx
import { useEffect, useRef, useState } from 'react'
import WaitingRoomMJ from './views/WaitingRoomMJ'
import WaitingRoomPlayer from './views/WaitingRoomPlayer'
import GameMasterView from './views/GameMasterView'
import PlayerRoleView from './views/PlayerRoleView'
import { createRoom, tryToGetRoom, getRoom, subscribeToRoom } from './shared/api/rooms'
import { joinRoom, getPlayer, subscribeToPlayer, findPlayerByName } from './shared/api/players'
import { generateRoomCode } from './shared/lib/gameLogic'

const extractRoomId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const first = value[0]
    if (!first) return null
    return typeof first === 'string' ? first : first?.id ?? null
  }
  if (typeof value === 'object') return value.id ?? null
  return null
}

const mergePlayerState = (incoming, previous) => {
  if (!incoming) return previous ?? null

  const roomId = extractRoomId(incoming.room) ?? previous?.room ?? null
  const expandedRoom = incoming.expand?.room
  const code = expandedRoom?.code ?? previous?.code ?? null

  return {
    ...previous,
    ...incoming,
    room: roomId,
    code
  }
}

export default function App() {
  const [player, setPlayer] = useState(null)
  const [step, setStep] = useState('entry')
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    playerRef.current = player
  }, [player])

  const handleCreateGame = async () => {
    if (isCreating) return
    setError('')
    if (!name.trim()) {
      setError('Veuillez entrer un nom.')
      return
    }

    try {
      setIsCreating(true)
      const code = generateRoomCode()
      const room = await createRoom(code)
      const newPlayer = await joinRoom(room.id, name, true)
      setPlayer({ ...newPlayer, room: room.id, code: room.code })
      setStep('waiting')
    } catch (err) {
      console.error('Erreur lors de la création de la partie :', err)
      setError("Erreur lors de la création de la partie.")
    } finally {
      setIsCreating(false)
    }
  }

  const generateSeedNames = (count, masterName) => {
    const seeds = []
    const baseName = 'Joueur Test'
    for (let i = 1; i <= count; i += 1) {
      const candidate = `${baseName} ${i}`
      if (candidate.toLowerCase() === masterName.toLowerCase()) {
        seeds.push(`${candidate} bis`)
      } else {
        seeds.push(candidate)
      }
    }
    return seeds
  }

  const handleCreateSeededGame = async (count) => {
    if (isCreating) return
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Veuillez entrer un nom avant de créer une partie test.')
      return
    }

    try {
      setIsCreating(true)
      const code = generateRoomCode()
      const room = await createRoom(code)
      const master = await joinRoom(room.id, trimmedName, true)

      const seedNames = generateSeedNames(count, trimmedName)
      for (const seedName of seedNames) {
        // PocketBase annule les requêtes parallèles. On les séquence donc.
        await joinRoom(room.id, seedName, false)
      }

      setPlayer({ ...master, room: room.id, code: room.code })
      setStep('waiting')
    } catch (err) {
      console.error('Erreur lors de la création de la partie de test :', err)
      setError('Impossible de créer la partie de test. Réessayez.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGame = async () => {
    if (isJoining) return
    setError('')
    const trimmedName = name.trim()
    const trimmedCode = roomCode.trim()
    if (!trimmedName || !trimmedCode) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    try {
      setIsJoining(true)
      const room = await tryToGetRoom(trimmedCode)
      if (!room) {
        setError("Cette salle n'existe pas.")
        setIsJoining(false)
        return
      }
      if (room.started) {
        setError('La partie est déjà en cours.')
        setIsJoining(false)
        return
      }

      const duplicate = await findPlayerByName(room.id, trimmedName)
      if (duplicate) {
        setError('Ce nom est déjà pris dans cette partie.')
        setIsJoining(false)
        return
      }

      const newPlayer = await joinRoom(room.id, trimmedName, false)
      setPlayer({ ...newPlayer, room: room.id, code: room.code })
      setStep('waiting')
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError('Impossible de rejoindre la partie. Vérifiez le code ou réessayez.')
    } finally {
      setIsJoining(false)
    }
  }

  useEffect(() => {
    if (!player?.id) return

    let mounted = true
    let unsubscribe = async () => {}

    const pollPlayer = async () => {
      try {
        const latest = await getPlayer(player.id)
        if (!mounted || !latest) return

        setPlayer((current) => mergePlayerState(latest, current))

        if (latest.role) {
          setStep('inGame')
        }
      } catch (error) {
        if (error?.status && error.status !== 0) {
          console.error('Polling joueur échoué :', error)
        }
      }
    }

    pollPlayer()
    const pollingTimer = setInterval(pollPlayer, 2000)

    const initialise = async () => {
      try {
        unsubscribe = await subscribeToPlayer(player.id, ({ record }) => {
          if (!record) return

          setPlayer((current) => mergePlayerState(record, current))

          if (record.role) {
            setStep('inGame')
          }
        })
      } catch (error) {
        if (error?.status === 0 || error?.isAbort) {
          console.warn('Abonnement joueur indisponible, utilisation du polling continu.')
        } else {
          console.error('Abonnement joueur échoué :', error)
        }
      }
    }

    initialise()

    return () => {
      mounted = false
      clearInterval(pollingTimer)
      Promise.resolve(unsubscribe()).catch(() => {})
    }
  }, [player?.id])

  useEffect(() => {
    const roomId = player?.room
    if (!roomId) return

    let mounted = true
    let unsubscribe = async () => {}

    const syncRoomState = (record) => {
      if (!record) return

      if (record.code) {
        setPlayer((current) => {
          if (!current || current.code === record.code) return current
          return { ...current, code: record.code }
        })
      }

      if (record.started && playerRef.current?.isMaster) {
        setStep('inGame')
      }
    }

    const pollRoom = async () => {
      try {
        const latest = await getRoom(roomId)
        if (!mounted || !latest) return
        syncRoomState(latest)
      } catch (error) {
        if (error?.status && error.status !== 0) {
          console.error('Polling salle échoué :', error)
        }
      }
    }

    pollRoom()
    const pollingTimer = setInterval(pollRoom, 2000)

    const initialise = async () => {
      try {
        unsubscribe = await subscribeToRoom(roomId, ({ record }) => {
          if (!mounted) return
          syncRoomState(record)
        })
      } catch (error) {
        if (error?.status === 0 || error?.isAbort) {
          console.warn('Abonnement salle indisponible, utilisation du polling continu.')
        } else {
          console.error('Abonnement salle échoué :', error)
        }
      }
    }

    initialise()

    return () => {
      mounted = false
      clearInterval(pollingTimer)
      Promise.resolve(unsubscribe()).catch(() => {})
    }
  }, [player?.room, player?.isMaster])

  if (step === 'entry') {
    return (
      <div style={{ padding: 20 }}>
        <h1>Jeu du Loup-Garou 🐺</h1>

        <input
          type="text"
          placeholder="Nom du joueur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div style={{ marginTop: 10 }}>
          <button onClick={handleCreateGame} disabled={isCreating}>
            {isCreating ? 'Création…' : 'Créer une partie'}
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <p>Tests rapides :</p>
          {[8, 11, 13, 16].map((count) => (
            <button
              key={count}
              style={{ marginRight: 8, marginBottom: 8 }}
              onClick={() => handleCreateSeededGame(count)}
              disabled={isCreating}
            >
              {isCreating ? 'Création…' : `Créer avec ${count} joueurs`}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <input
            type="text"
            placeholder="Code de la salle"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleJoinGame} disabled={isJoining}>
            {isJoining ? 'Connexion…' : 'Rejoindre la partie'}
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    )
  }

  if (step === 'waiting') {
    return (
      <div>
        {player.isMaster
          ? <WaitingRoomMJ roomId={player.room} code={player.code} />
          : <WaitingRoomPlayer roomId={player.room} name={player.name} code={player.code} />}
      </div>
    )
  }

  if (step === 'inGame' && player) {
    return player.isMaster
      ? <GameMasterView roomId={player.room} code={player.code} />
      : <PlayerRoleView player={player} />
  }

  return null
}
