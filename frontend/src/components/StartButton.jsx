export default function StartButton({ onClick, disabled = false, children }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children || 'Lancer la partie'}
    </button>
  )
}
