import React from 'react'


/**
* Vue Joueur : affiche le rôle du joueur
*/
export default function JoueurView({ player }) {
return (
<div>
<h2>Bienvenue {player.name}</h2>
{player.role
? <p>Ton rôle est : <strong>{player.role}</strong></p>
: <p>En attente de lancement…</p>}
</div>
)
}
