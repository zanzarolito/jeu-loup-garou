// 📁 src/App.jsx
import { useEffect, useRef, useState } from 'react'
import './App.css'
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

const AppShell = ({ children }) => (
  <div className="app-surface">
    {children}
  </div>
)

export default function App() {
  const [player, setPlayer] = useState(null)
  const [step, setStep] = useState('code')
  const [roomCode, setRoomCode] = useState('')
  const [pendingRoom, setPendingRoom] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isSearchingRoom, setIsSearchingRoom] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    playerRef.current = player
  }, [player])

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

  const handleCreateGame = async (withSeeds = 0) => {
    if (isCreating) return
    setError('')

    const masterName = name.trim()
    if (!masterName) {
      setError('Veuillez entrer un nom.')
      setStep('name')
      return
    }

    try {
      setIsCreating(true)
      const code = generateRoomCode()
      const room = await createRoom(code)
      const master = await joinRoom(room.id, masterName, true)

      if (withSeeds > 0) {
        const seedNames = generateSeedNames(withSeeds, masterName)
        for (const seedName of seedNames) {
          await joinRoom(room.id, seedName, false)
        }
      }

      setPlayer({ ...master, room: room.id, code: room.code })
      setStep('waiting')
    } catch (err) {
      console.error('Erreur lors de la création de la partie :', err)
      setError('Erreur lors de la création de la partie.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSearchRoom = async () => {
    if (isSearchingRoom) return
    setError('')
    const trimmedCode = roomCode.trim().toUpperCase()
    if (!trimmedCode) {
      setError('Veuillez entrer un code de salle.')
      return
    }

    try {
      setIsSearchingRoom(true)
      const room = await tryToGetRoom(trimmedCode)
      if (!room) {
        setError("Cette salle n'existe pas.")
        return
      }
      if (room.started) {
        setError('La partie est déjà en cours.')
        return
      }
      setPendingRoom(room)
      setError('')
      setStep('name')
    } catch (err) {
      console.error('Erreur lors de la recherche de salle :', err)
      setError('Impossible de vérifier cette salle. Réessayez.')
    } finally {
      setIsSearchingRoom(false)
    }
  }

  const handleJoinSubmit = (event) => {
    event.preventDefault()
    handleSearchRoom()
  }

  const handleConfirmName = async (isMaster) => {
    if (isJoining) return
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Veuillez entrer un nom.')
      return
    }

    try {
      setIsJoining(true)

      if (isMaster) {
        await handleCreateGame()
        return
      }

      if (!pendingRoom) {
        setError('Aucune salle sélectionnée.')
        return
      }

      const duplicate = await findPlayerByName(pendingRoom.id, trimmedName)
      if (duplicate) {
        setError('Ce nom est déjà pris dans cette partie.')
        return
      }

      const newPlayer = await joinRoom(pendingRoom.id, trimmedName, false)
      setPlayer({ ...newPlayer, room: pendingRoom.id, code: pendingRoom.code })
      setPendingRoom(null)
      setStep('waiting')
    } catch (err) {
      console.error('Erreur lors de l’inscription :', err)
      setError('Impossible de rejoindre la partie. Réessayez.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleNameSubmit = (event) => {
    event.preventDefault()
    handleConfirmName(!pendingRoom)
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

  const renderLandingStep = () => (
    <AppShell>
      <div className="app-hero">
        <span className="wolf-emoji" role="img" aria-label="Loup-garou">🐺</span>
        <h1 className="tagline">Lance une nuit de loups-garous en quelques secondes</h1>
        <p className="tagline-sub">Rejoins un village existant ou crée le tien en un clic.</p>
      </div>

      <div className="screen-block">
        <section className="screen-section">
          <div className="screen-section__title">
            <h2>Rejoindre un village</h2>
            <p>Entre le code partagé par le maître du jeu.</p>
          </div>
          <form onSubmit={handleJoinSubmit} className="inline-actions" aria-label="Rejoindre une partie">
            <div className="input-row">
              <input
                id="room-code"
                type="text"
                className="input-control"
                placeholder="ex. ABCDE"
                value={roomCode}
                onChange={(event) => {
                  if (error) setError('')
                  setRoomCode(event.target.value.toUpperCase())
                }}
                autoComplete="off"
                maxLength={8}
              />
              <button type="submit" className="btn">
                {isSearchingRoom ? 'Recherche…' : 'Rejoindre'}
              </button>
            </div>
          </form>
        </section>

        <section className="screen-section">
          <div className="screen-section__title">
            <h2>Créer une partie</h2>
            <p>Deviens maître du jeu et invite ton village.</p>
          </div>
          <div className="inline-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setError('')
                setPendingRoom(null)
                setStep('name')
              }}
            >
              Lancer une nouvelle salle
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setError('')
                setPendingRoom(null)
                setStep('name')
                setName('Test MJ')
              }}
            >
              Essayer rapidement
            </button>
          </div>
        </section>

        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </AppShell>
  )

  const renderNameStep = () => {
    const isMasterPath = !pendingRoom

    return (
      <AppShell>
        <div className="app-hero">
          <span className="wolf-emoji" role="img" aria-label="Loup-garou">🐺</span>
          <h1 className="tagline">Choisis ton identifiant</h1>
          <p className="tagline-sub">{isMasterPath ? 'Visible par les joueurs.' : `Salle ${pendingRoom.code}`}</p>
        </div>

        <div className="screen-section">
          <form onSubmit={handleNameSubmit} className="inline-actions inline-actions--compact">
            <input
              id="player-name"
              type="text"
              className="input-control"
              placeholder="Pseudo nocturne"
              value={name}
              onChange={(event) => {
                if (error) setError('')
                setName(event.target.value)
              }}
              required
              autoComplete="off"
            />
            <button type="submit" className="btn" disabled={isMasterPath ? isCreating : isJoining}>
              {isMasterPath
                ? isCreating ? 'Création…' : 'Créer la partie'
                : isJoining ? 'Connexion…' : 'Entrer dans la salle'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setError('')
                setPendingRoom(null)
                setStep('code')
              }}
              disabled={isCreating || isJoining}
            >
              Retour
            </button>
          </form>

          {isMasterPath && (
            <div className="try-buttons">
              {[8, 11, 13, 16].map((count) => (
                <button
                  key={count}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setError('')
                    handleCreateGame(count)
                  }}
                  disabled={isCreating}
                >
                  {isCreating ? 'Création…' : `${count} joueurs test`}
                </button>
              ))}
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </AppShell>
    )
  }

  const renderWaitingStep = () => (
    <AppShell>
      <span className="wolf-emoji" role="img" aria-label="Loup-garou">🐺</span>
      {player.isMaster
        ? <WaitingRoomMJ roomId={player.room} code={player.code} />
        : <WaitingRoomPlayer roomId={player.room} name={player.name} code={player.code} />}
    </AppShell>
  )

  const renderInGameStep = () => (
    <AppShell>
      {player.isMaster
        ? <GameMasterView roomId={player.room} code={player.code} masterName={player.name} />
        : <PlayerRoleView player={player} />}
    </AppShell>
  )

  if (step === 'code') {
    return renderLandingStep()
  }

  if (step === 'name') {
    return renderNameStep()
  }

  if (step === 'waiting') {
    return renderWaitingStep()
  }

  if (step === 'inGame' && player) {
    return renderInGameStep()
  }

  return null
}
