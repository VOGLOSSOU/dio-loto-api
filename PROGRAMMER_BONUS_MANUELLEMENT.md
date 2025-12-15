# Programmer un Bonus Manuellement

Ce guide explique comment programmer une journée de bonus pour les recharges reseller→user (10% sur la première recharge du jour).

## Étapes à suivre

### 1. Choisir la date
- Décidez de la date du bonus (format YYYY-MM-DD, heure Bénin).
- Exemple : `'2025-12-14'` pour le 14 décembre 2025.

### 2. Modifier le code de vérification du bonus
- Ouvrez le fichier `src/routes/transaction/recharge-reseller-user.js`
- Trouvez la ligne avec `const isBonusDay = todayBenin.isSame('2025-12-XX', 'day');`
- Remplacez `'2025-12-XX'` par votre date choisie.
- Mettez à jour le commentaire pour refléter la nouvelle date.

### 3. Modifier le script de remise à zéro des bonus
- Ouvrez le fichier `src/scripts/resetBonuses.js`
- Trouvez la ligne avec `const isBonusDay = todayBenin.isSame('2025-12-XX', 'day');`
- Remplacez `'2025-12-XX'` par votre date choisie.
- Mettez à jour le commentaire.

### 4. Tester localement (optionnel)
- Lancez `node -e "const moment = require('moment-timezone'); console.log('Heure Bénin:', moment().tz('Africa/Porto-Novo').format('YYYY-MM-DD HH:mm:ss')); const isBonusDay = moment().tz('Africa/Porto-Novo').isSame('2025-12-XX', 'day'); console.log('isBonusDay:', isBonusDay);"` en remplaçant la date pour vérifier.

### 5. Déployer le code
- Commitez et poussez les changements sur Git.
- Déployez sur Render (ou votre plateforme de déploiement).
- Le bonus sera actif le jour spécifié de 00h00 à 23h59 heure Bénin.

### 6. Vérifier après déploiement
- Le lendemain, vérifiez les notifications et les soldes bonus des utilisateurs.
- Utilisez les scripts de diagnostic créés précédemment si nécessaire.

## Notes importantes
- Le bonus s'applique seulement sur la première recharge reseller→user du jour par utilisateur.
- Les bonus sont automatiquement remis à 0 à 23h59 via cron.
- Assurez-vous que la date est dans le futur pour éviter les conflits.

## Exemple pour le 14 décembre 2025
- Date : `'2025-12-14'`
- Jour : Samedi
- Bonus : 10% sur première recharge du jour

## Remettre tous les bonus à 0 manuellement

Si vous voulez remettre tous les soldes bonus des utilisateurs à 0 (par exemple, après une journée de bonus), utilisez cette requête SQL dans phpMyAdmin :

```sql
UPDATE Users SET bonus = 0 WHERE bonus > 0;
```

Cette requête :
- Met à jour la table `Users`
- Remet le champ `bonus` à 0 pour tous les utilisateurs ayant bonus > 0
- Affiche le nombre de lignes affectées

**Note :** Utilisez `WHERE bonus > 0` pour ne toucher que ceux qui ont des bonus, ou `UPDATE Users SET bonus = 0;` pour tous les utilisateurs.