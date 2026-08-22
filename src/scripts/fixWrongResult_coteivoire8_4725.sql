-- ============================================================
-- Correctif incident : Result id=4725 (coteivoire8, gameId=28)
-- inséré avec de mauvais numéros, a invalidé des tickets à tort.
-- 7 tickets concernés, tous "invalidé", aucun "attribué" (pas
-- d'argent bougé pour cet incident).
-- ============================================================

-- 0) VÉRIFICATION AVANT ACTION
SELECT id, gameId, numbers, numbers2, createdAt
FROM Results
WHERE id = 4725;

SELECT id, numeroTicket, uniqueUserId, statut, updatedAt
FROM Tickets
WHERE id IN (162545, 162565, 162617, 162618, 162627, 162628, 162629);

-- ============================================================
-- 1) CORRECTIF (transaction)
-- ============================================================
START TRANSACTION;

-- Remet à "en attente" les tickets concernés (IDs exacts, déjà vérifiés)
UPDATE Tickets
SET statut = 'en attente'
WHERE id IN (162545, 162565, 162617, 162618, 162627, 162628, 162629);

-- Supprime le résultat fautif (APRÈS l'UPDATE)
DELETE FROM Results
WHERE id = 4725;

COMMIT;
-- Si quelque chose semble anormal avant le COMMIT : ROLLBACK; à la place

-- ============================================================
-- 2) VÉRIFICATION APRÈS ACTION
-- ============================================================

-- Doit renvoyer 0 ligne
SELECT * FROM Results WHERE id = 4725;

-- Doit montrer statut = 'en attente' pour les 7
SELECT id, numeroTicket, statut
FROM Tickets
WHERE id IN (162545, 162565, 162617, 162618, 162627, 162628, 162629);
