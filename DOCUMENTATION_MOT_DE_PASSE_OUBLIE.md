# Fonctionnalité — Mot de passe oublié

## Vue d'ensemble mise à jouré

La fonctionnalité de réinitialisation de mot de passe est disponible via **3 endpoints**. Le flux est le suivant :::

```
1. L'utilisateur soumet son email         → POST /api/auth/forgot-password
2. L'utilisateur soumet le code reçu      → POST /api/auth/verify-otp
3. L'utilisateur soumet son nouveau mdp   → POST /api/auth/reset-password
```

---

## Endpoint 1 — Demande de réinitialisation

### `POST /api/auth/forgot-password`

L'utilisateur soumet son adresse email. Un code OTP à 6 chiffres lui est envoyé par email s'il possède un compte.

**Body**
```json
{
  "email": "user@example.com"
}
```

**Réponse — Succès** `200`
```json
{
  "success": true,
  "message": "Si cet email existe, un code a été envoyé."
}
```
> La réponse est identique que l'email existe ou non en base — c'est intentionnel pour des raisons de sécurité.

**Réponse — Erreur serveur** `500`
```json
{
  "success": false,
  "message": "Erreur lors de l'envoi. Réessayez."
}
```

**Notes**
- Le code OTP expire après **10 minutes**
- Si l'utilisateur refait une demande avant expiration, l'ancien code est automatiquement invalidé et un nouveau est envoyé
- L'email reçu contient le code mis en valeur et un rappel de l'expiration

---

## Endpoint 2 — Vérification du code OTP

### `POST /api/auth/verify-otp`

L'utilisateur soumet le code reçu par email. En cas de succès, un `reset_token` temporaire est retourné pour l'étape suivante.

**Body**
```json
{
  "email": "user@example.com",
  "otp": "482910"
}
```

**Réponse — Succès** `200`
```json
{
  "success": true,
  "reset_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```
> Conserver ce `reset_token` — il sera nécessaire pour l'étape suivante.

**Réponse — Code invalide ou expiré** `400`
```json
{
  "success": false,
  "message": "Code invalide ou expiré."
}
```

**Réponse — Erreur serveur** `500`
```json
{
  "success": false,
  "message": "Une erreur est survenue. Réessayez."
}
```

**Notes**
- Le `reset_token` expire après **15 minutes**
- Un code déjà utilisé est rejeté même s'il n'est pas encore expiré

---

## Endpoint 3 — Réinitialisation du mot de passe

### `POST /api/auth/reset-password`

L'utilisateur soumet le `reset_token` obtenu à l'étape 2 ainsi que son nouveau mot de passe.

**Body**
```json
{
  "reset_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "new_password": "NouveauMotDePasse123"
}
```

**Réponse — Succès** `200`
```json
{
  "success": true,
  "message": "Mot de passe mis à jour avec succès."
}
```

**Réponse — Token invalide ou expiré** `400`
```json
{
  "success": false,
  "message": "Session expirée. Recommencez la procédure."
}
```

**Réponse — Erreur serveur** `500`
```json
{
  "success": false,
  "message": "Une erreur est survenue. Réessayez."
}
```

**Notes**
- Une fois le mot de passe réinitialisé, le `reset_token` et le code OTP sont définitivement invalidés
- Il n'est pas possible de réutiliser le même token deux fois
- Si le token a expiré (> 15 min), l'utilisateur doit recommencer depuis l'étape 1

---

## Récapitulatif des durées de validité

| Élément | Durée |
|---|---|
| Code OTP | 10 minutes |
| `reset_token` | 15 minutes |

---

## Flux d'intégration recommandé

```
Écran 1 : Saisie de l'email
  → Appel POST /api/auth/forgot-password
  → Afficher : "Vérifiez votre boîte mail"

Écran 2 : Saisie du code OTP (6 chiffres)
  → Appel POST /api/auth/verify-otp
  → En cas de succès : stocker le reset_token en mémoire (pas en localStorage)
  → En cas d'échec : afficher "Code invalide ou expiré"

Écran 3 : Saisie du nouveau mot de passe
  → Appel POST /api/auth/reset-password avec le reset_token
  → En cas de succès : rediriger vers la page de connexion
  → En cas d'échec : rediriger vers l'écran 1 avec le message "Session expirée. Recommencez la procédure."
```
