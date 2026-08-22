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
