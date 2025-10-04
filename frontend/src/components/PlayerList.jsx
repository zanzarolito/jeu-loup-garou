export default function PlayerList({ players, showRoles = false }) {
    return (
    <ul>
    {players.map(p => (
    <li key={p.id}>
    {p.name} {showRoles && p.role ? `— ${p.role}` : ''}
    </li>
    ))}
    </ul>
    )
    }