# 🎮 DOCUMENTATION - SYSTÈME DE CONTRÔLE MANUEL DES JEUX

## 📋 APERÇU GÉNÉRAL

Le système de contrôle manuel permet aux administrateurs de **prendre le contrôle du statut des jeux** et de **désactiver temporairement la gestion automatique** basée sur les horaires programmés.

### 🔄 MODES DE FONCTIONNEMENT

1. **Mode Automatique** (par défaut) : Le statut du jeu est géré automatiquement selon les horaires programmés
2. **Mode Manuel** : Un admin a pris le contrôle, le statut reste fixe jusqu'à intervention manuelle

---

## 🛠️ MODIFICATIONS APPORTÉES

### 1. **Modèle Game** - Nouveau champ
```javascript
manualOverride: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: 'Indique si le statut a été modifié manuellement par un admin'
}
```

### 2. **Script automatique** - Respect du contrôle manuel
- Le cron job vérifie maintenant `game.manualOverride` avant de modifier le statut
- Si `manualOverride = true`, le jeu est ignoré par la logique automatique

### 3. **Routes API** - Nouvelles fonctionnalités

---

## 🚀 ROUTES API DISPONIBLES

### 1️⃣ **MODIFIER LE STATUT MANUELLEMENT**
```http
PUT /api/games/:nom/statut
Content-Type: application/json

{
  "statut": "fermé"  // ou "ouvert"
}
```

**Effet :**
- Change le statut du jeu
- Active automatiquement `manualOverride = true`
- Le jeu reste dans cet état jusqu'à nouvelle intervention manuelle

---

### 2️⃣ **REMETTRE EN MODE AUTOMATIQUE**
```http
PATCH /api/games/:nom/auto-mode
```

**Effet :**
- Désactive `manualOverride = false`
- Le jeu redevient géré automatiquement selon ses horaires

---

### 3️⃣ **CONSULTER L'ÉTAT DES JEUX**
```http
GET /api/games/status
```

**Réponse :**
```json
{
  "message": "État des jeux récupéré avec succès.",
  "totalGames": 18,
  "gamesInManualMode": 2,
  "gamesInAutoMode": 16,
  "games": [
    {
      "nom": "benin11",
      "statut": "fermé",
      "manualOverride": true,
      "modeControle": "Manuel",
      "pays": "Benin"
    }
  ]
}
```

---

### 4️⃣ **CONSULTER UN JEU SPÉCIFIQUE**
```http
GET /api/games/:nom/status
```

---

## 🔧 SCRIPTS DE MAINTENANCE

### 1. **Migration de la base de données**
```bash
node src/scripts/addManualOverrideField.js
```
Ajoute le champ `manualOverride` aux jeux existants.

### 2. **Test du système**
```bash
node src/scripts/testManualOverride.js
```
Valide le fonctionnement du contrôle manuel.

---

## 📊 EXEMPLES D'UTILISATION

### **Scénario 1 : Bloquer un jeu temporairement**
```bash
# 1. Fermer le jeu manuellement
curl -X PUT http://localhost:4000/api/games/benin11/statut \
  -H "Content-Type: application/json" \
  -d '{"statut": "fermé"}'

# 2. Le jeu reste fermé même si l'horaire dit qu'il devrait être ouvert
# 3. Pour le remettre en automatique :
curl -X PATCH http://localhost:4000/api/games/benin11/auto-mode
```

### **Scénario 2 : Forcer l'ouverture d'un jeu**
```bash
# 1. Ouvrir le jeu manuellement (même hors horaires)
curl -X PUT http://localhost:4000/api/games/coteivoire7/statut \
  -H "Content-Type: application/json" \
  -d '{"statut": "ouvert"}'

# 2. Le jeu reste ouvert jusqu'à intervention manuelle
```

---

## ⚠️ POINTS IMPORTANTS

1. **Priorité** : Le contrôle manuel a TOUJOURS la priorité sur la logique automatique
2. **Persistance** : Un jeu en mode manuel reste dans cet état jusqu'à remise en automatique
3. **Logs** : Le système log clairement quand un jeu est ignoré car en mode manuel
4. **Sécurité** : Seuls les admins peuvent modifier le statut des jeux

---

## 🔍 MONITORING

### **Vérifier les jeux en mode manuel**
```bash
curl http://localhost:4000/api/games/status | jq '.gamesInManualMode'
```

### **Logs du cron job**
Le script automatique affiche maintenant :
```
Le jeu "benin11" est en contrôle manuel - statut non modifié automatiquement.
```

---

## 🎯 AVANTAGES

✅ **Flexibilité** : Les admins peuvent réagir rapidement aux situations exceptionnelles  
✅ **Sécurité** : Pas de changement automatique non désiré  
✅ **Traçabilité** : Distinction claire entre mode manuel et automatique  
✅ **Simplicité** : Interface API intuitive  
✅ **Réversibilité** : Retour facile en mode automatique
