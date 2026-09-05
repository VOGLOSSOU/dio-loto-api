# Programmer un Bonus Manuellement

Ce guide explique comment programmer une journée de bonus pour les recharges reseller→user (10% sur la première recharge du jour).

## Étapes à suivre

### 1. Choisir la date
- Décidez de la date du bonus (format YYYY-MM-DD, heure Bénin).
- Exemple : `'2026-03-01'` pour le 1er Mars 2026.

### 2. Modifier le code de vérification du bonus
- Ouvrez le fichier `src/routes/transaction/recharge-reseller-user.js`
- Trouvez la ligne avec `const isBonusDay = todayBenin.isSame('2025-12-XX', 'day');`
- Remplacez `'2025-12-XX'` par votre date choisie.
- Mettez à jour le commentaire pour refléter la nouvelle date.

### 3. Modifier le script de remise à zéro des bonus
- Ouvrez le fichier `src/scripts/resetBonuses.js`
- Trouvez la ligne avec `const isBonusDay = todayBenin.isSame('2026-03-01', 'day');`
- Remplacez `'2026-03-01'` par votre date choisie.
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

## Exemple pour le 1er Mars 2026
- Date : `'2026-03-01'`
- Jour : Dimanche
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

UPDATE Tickets 
SET statut = 'en attente' 
WHERE nomJeu = 'benin18' 
AND statut IN ('validé', 'invalidé') 
AND created >= DATE_SUB(NOW(), INTERVAL 24 HOUR);


SELECT 
    *
FROM Users 
WHERE email = 'jeanoke76@gmail.com';


UPDATE Users 
SET 
    gain = 9000,
    updatedAt = NOW()
WHERE email = 'tossoufolly@gmail.fr';



-- Ajouter un montant au gain existant
UPDATE Users 
SET 
    gain = gain + 27600,
    updatedAt = NOW()
WHERE email = 'jeans@gmail.com';

-- Ajouter un montant au solde existant
UPDATE Users 
SET 
    solde = solde + 1080,
    updatedAt = NOW()
WHERE email = 'esaieodjo@gmail.com';


UPDATE Users 
SET 
    solde = solde - 3000,
    updatedAt = NOW()
WHERE email = 'jeanoke76@gmail.com';

UPDATE Users 
SET 
    gain = gain - 140,
    updatedAt = NOW()
WHERE email = 'lyneadekou@gmail.com';





---------------





-- ============================================================
-- Correctif incident : Result id=4708 (benin11, gameId=19)
-- inséré avec de mauvais numéros, a invalidé/validé des tickets à tort.
-- ============================================================

-- 0) VÉRIFICATION AVANT ACTION (à exécuter et regarder d'abord)
-- Doit confirmer gameId=19 pour le Result 4708, et donner le detail des tickets concernés
SELECT id, gameId, numbers, numbers2, createdAt
FROM Results
WHERE id = 4708;

SELECT statut, COUNT(*) AS nombre
FROM Tickets
WHERE nomJeu = 'benin11'
  AND statut IN ('validé', 'invalidé', 'attribué')
  AND updatedAt >= (SELECT createdAt FROM Results WHERE id = 4708)
GROUP BY statut;

-- ============================================================
-- 1) CORRECTIF (à exécuter dans une transaction)
-- ============================================================
START TRANSACTION;

-- Remet à "en attente" les tickets validé/invalidé touchés PRÉCISÉMENT
-- par la validation automatique déclenchée par ce résultat fautif.
-- Les tickets déjà "attribué" (argent déjà crédité) sont EXCLUS volontairement.
UPDATE Tickets
SET statut = 'en attente'
WHERE nomJeu = 'benin11'
  AND statut IN ('validé', 'invalidé')
  AND updatedAt >= (SELECT createdAt FROM Results WHERE id = 4708);

-- Supprime le résultat fautif (à faire APRÈS l'UPDATE ci-dessus,
-- car la sous-requête a besoin que la ligne existe encore)
DELETE FROM Results
WHERE id = 4708;

-- Si tout semble correct après avoir vérifié les résultats ci-dessous : COMMIT;
-- Si quelque chose semble anormal : ROLLBACK;
COMMIT;

-- ============================================================
-- 2) VÉRIFICATION APRÈS ACTION
-- ============================================================

-- Doit renvoyer 0 ligne (le résultat a bien été supprimé)
SELECT * FROM Results WHERE id = 4708;

-- Doit montrer 0 ticket 'validé'/'invalidé' restant pour benin11 sur cette fenêtre,
-- et confirmer les 2 tickets 'attribué' toujours présents (non touchés, à gérer séparément)
SELECT id, numeroTicket, uniqueUserId, statut, gains, updatedAt
FROM Tickets
WHERE nomJeu = 'benin11'
  AND updatedAt >= '2026-08-14 10:14:49'
ORDER BY statut, updatedAt;
