// 📁 src/App.jsx
import { useState } from 'react'
import WaitingRoomMJ from './views/WaitingRoomMJ'
import WaitingRoomPlayer from './views/WaitingRoomPlayer'
import { createRoom, tryToGetRoom } from './shared/api/rooms'
import { joinRoom } from './shared/api/players'
import { generateRoomCode } from './shared/lib/gameLogic'

export default function App() {
  const [player, setPlayer] = useState(null)
  const [step, setStep] = useState('entry')
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleCreateGame = async () => {
    setError('')
    if (!name.trim()) {
      setError('Veuillez entrer un nom.')
      return
    }

    try {
      const code = generateRoomCode()
      const room = await createRoom(code)
      const newPlayer = await joinRoom(room.id, name, true)
      setPlayer({ ...newPlayer, room: room.id, code: room.code })
      setStep('waiting')
    } catch (err) {
      console.error('Erreur lors de la création de la partie :', err)
      setError("Erreur lors de la création de la partie.")
    }
  }

  const handleJoinGame = async () => {
    setError('')
    if (!name.trim() || !roomCode.trim()) {
      setError('Veuillez remplir tous les champs.')
      return
    }

    try {
      const room = await tryToGetRoom(roomCode)
      if (!room) {
        setError("Cette salle n'existe pas.")
        return
      }
      const newPlayer = await joinRoom(room.id, name, false)
      setPlayer({ ...newPlayer, room: room.id, code: room.code })
      setStep('waiting')
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError('Impossible de rejoindre la partie. Vérifiez le code ou réessayez.')
    }
  }

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
          <button onClick={handleCreateGame}>Créer une partie</button>
        </div>

        <div style={{ marginTop: 20 }}>
          <input
            type="text"
            placeholder="Code de la salle"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleJoinGame}>Rejoindre la partie</button>
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

  return null
}
