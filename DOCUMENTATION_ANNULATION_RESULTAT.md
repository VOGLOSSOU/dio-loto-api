# Gestion administrative d’un résultat erroné

Cette fonctionnalité est réservée aux administrateurs authentifiés. Le token reçu
depuis `POST /api/admins/login` doit être envoyé dans l’en-tête :

```http
Authorization: Bearer <token_admin>
```

## Parcours frontend conseillé

1. L’administrateur choisit un pays.
2. Le frontend charge ses jeux avec `GET /api/games/all/:pays`.
3. L’administrateur choisit le jeu concerné.
4. Le frontend lance l’analyse sans modifier les données.
5. Il affiche le résultat et l’impact détaillé.
6. Après confirmation, il appelle la route de suppression avec l’identifiant
   exact renvoyé par l’analyse.
7. Les tickets déjà attribués restent dans un espace séparé. L’administrateur
   copie leurs informations, puis peut les remettre en attente dans une seconde action.

## 1. Analyser l’impact

```http
GET /api/admin/wrong-results/analysis?pays=Benin&nomJeu=benin18
Authorization: Bearer <token_admin>
```

Réponse `200` simplifiée :

```json
{
  "message": "Analyse terminée. Aucune donnée n’a été modifiée.",
  "data": {
    "jeu": {
      "id": 21,
      "nom": "benin18",
      "pays": "Benin",
      "statut": "fermé"
    },
    "resultat": {
      "id": 5089,
      "numbers": "66 10 67 89 5",
      "numbers2": null,
      "createdAt": "2026-09-04T17:16:59.000Z"
    },
    "impact": {
      "totalTicketsTouches": 91,
      "ticketsQuiSerontRemisEnAttente": 90,
      "ticketsValides": 0,
      "ticketsInvalides": 90,
      "ticketsDejaAttribues": 1
    },
    "tickets": {
      "valides": [],
      "invalides": [],
      "attribues": []
    },
    "avertissement": "Les tickets déjà attribués et les gains crédités ne seront pas modifiés lors de l'annulation."
  }
}
```

Les tableaux `valides`, `invalides` et `attribues` contiennent le détail des
tickets. Une réponse `404` signifie que le jeu n’existe pas ou qu’il ne possède
aucun résultat actif.

## 2. Supprimer le résultat et réinitialiser les tickets

```http
DELETE /api/admin/wrong-results/5089
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "pays": "Benin",
  "nomJeu": "benin18"
}
```

Effets réalisés dans une transaction unique :

- vérification que le résultat actif est toujours celui analysé ;
- passage des tickets `validé` et `invalidé` concernés à `en attente` ;
- suppression du résultat erroné ;
- aucun changement sur les tickets `attribué` ou sur les gains déjà crédités.

Si le résultat a changé entre l’analyse et la confirmation, l’API renvoie `409`
et le frontend doit demander à l’administrateur de relancer l’analyse.

Réponse `200` simplifiée :

```json
{
  "message": "Le résultat a été supprimé et les tickets concernés ont été remis en attente.",
  "data": {
    "resultatSupprime": 5089,
    "jeu": {
      "id": 21,
      "nom": "benin18",
      "pays": "Benin"
    },
    "ticketsRemisEnAttente": 90,
    "ticketsAttribuesNonModifies": []
  }
}
```

## Valeurs acceptées pour `pays`

- `Benin`
- `Côte d'Ivoire`
- `Ghana`
- `France`
- `Togo`

Le frontend doit toujours utiliser exactement la valeur `pays` renvoyée par
l’API afin d’éviter les problèmes d’accents ou d’apostrophes.

## 3. Gérer séparément les tickets déjà attribués

Chaque ticket de `tickets.attribues` possède les propriétés `joueur`,
`gainAttribue` et `ligneACopier`. Le frontend peut copier une seule ligne ou
assembler plusieurs lignes pour les transmettre au responsable du traitement
financier manuel.

Après la suppression du résultat, le frontend doit alimenter l’espace séparé
avec `data.ticketsAttribuesNonModifies` renvoyé par la route `DELETE` (et le
conserver dans son état local), puisque le résultat supprimé ne pourra plus être
analysé une seconde fois.

Pour remettre les tickets sélectionnés en attente :

```http
PATCH /api/admin/wrong-results/attributed-tickets/reset
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "pays": "Benin",
  "nomJeu": "benin18",
  "ticketIds": [174421]
}
```

La réponse fournit `lignesACopier` et `texteACopier`. Exemple :

```text
174421 | d46fa1fa-de17-47e6-941b-e8d5c18cabd1 | Prénom Nom | 3000 FCFA
```

Cette route modifie uniquement le statut des tickets. Elle ne retire jamais le
gain déjà crédité au joueur. La régularisation financière reste manuelle.
