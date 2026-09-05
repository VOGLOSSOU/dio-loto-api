-- ============================================================
-- Correctif incident : Result id=5042 (beninDigital08, gameId=41)
-- inséré avec de mauvais numéros, a invalidé des tickets à tort.
-- 60 tickets "invalidé" concernés. 3 tickets déjà "attribué"
-- (15 420 FCFA crédités à Cossi Pamphile Tegbodjou) laissés
-- intacts, à gérer séparément par les admins.
-- ============================================================

-- 0) VÉRIFICATION AVANT ACTION
SELECT id, gameId, numbers, numbers2, createdAt
FROM Results
WHERE id = 5042;

SELECT id, numeroTicket, uniqueUserId, statut, updatedAt
FROM Tickets
WHERE id IN (
  172455, 172456, 172457, 172458, 172459, 172460, 172461, 172462, 172463, 172466,
  172467, 172468, 172469, 172470, 172471, 172472, 172473, 172474, 172475, 172482,
  172483, 172484, 172485, 172486, 172487, 172488, 172489, 172490, 172491, 172492,
  172493, 172494, 172495, 172497, 172500, 172501, 172502, 172503, 172504, 172505,
  172506, 172507, 172508, 172511, 172513, 172515, 172517, 172519, 172521, 172522,
  172523, 172524, 172525, 172526, 172527, 172528, 172529, 172530, 172531, 172532
);

-- ============================================================
-- 1) CORRECTIF (transaction)
-- ============================================================
START TRANSACTION;

-- Remet à "en attente" les 60 tickets concernés (IDs exacts, déjà vérifiés)
UPDATE Tickets
SET statut = 'en attente'
WHERE id IN (
  172455, 172456, 172457, 172458, 172459, 172460, 172461, 172462, 172463, 172466,
  172467, 172468, 172469, 172470, 172471, 172472, 172473, 172474, 172475, 172482,
  172483, 172484, 172485, 172486, 172487, 172488, 172489, 172490, 172491, 172492,
  172493, 172494, 172495, 172497, 172500, 172501, 172502, 172503, 172504, 172505,
  172506, 172507, 172508, 172511, 172513, 172515, 172517, 172519, 172521, 172522,
  172523, 172524, 172525, 172526, 172527, 172528, 172529, 172530, 172531, 172532
);

-- Supprime le résultat fautif (APRÈS l'UPDATE)
DELETE FROM Results
WHERE id = 5042;

COMMIT;
-- Si quelque chose semble anormal avant le COMMIT : ROLLBACK; à la place

-- ============================================================
-- 2) VÉRIFICATION APRÈS ACTION
-- ============================================================

-- Doit renvoyer 0 ligne
SELECT * FROM Results WHERE id = 5042;

-- Doit montrer statut = 'en attente' pour les 60
SELECT id, statut FROM Tickets WHERE id IN (
  172455, 172456, 172457, 172458, 172459, 172460, 172461, 172462, 172463, 172466,
  172467, 172468, 172469, 172470, 172471, 172472, 172473, 172474, 172475, 172482,
  172483, 172484, 172485, 172486, 172487, 172488, 172489, 172490, 172491, 172492,
  172493, 172494, 172495, 172497, 172500, 172501, 172502, 172503, 172504, 172505,
  172506, 172507, 172508, 172511, 172513, 172515, 172517, 172519, 172521, 172522,
  172523, 172524, 172525, 172526, 172527, 172528, 172529, 172530, 172531, 172532
);

-- Rappel : les 3 tickets attribué (172496, 172498, 172499) ne sont PAS touchés
-- par ce script — à traiter séparément.
SELECT id, numeroTicket, uniqueUserId, statut, gains
FROM Tickets
WHERE id IN (172496, 172498, 172499);
