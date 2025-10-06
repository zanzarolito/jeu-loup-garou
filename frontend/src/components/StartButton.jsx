export default function StartButton({ onClick, disabled = false, children, variant = 'primary', className = '' }) {
  const variantClass = variant === 'secondary'
    ? 'btn-secondary'
    : variant === 'ghost'
      ? 'btn-ghost'
      : ''

  const classes = ['btn', variantClass, className].filter(Boolean).join(' ')

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children || 'Lancer la partie'}
    </button>
  )
}
