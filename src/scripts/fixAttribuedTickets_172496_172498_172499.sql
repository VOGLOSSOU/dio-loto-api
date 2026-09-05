-- ============================================================
-- Suite du correctif incident Result 5042 (beninDigital08) :
-- Les 3 tickets déjà "attribué" à tort sur base du mauvais résultat
-- (71 44 76 19 54) sont remis à "en attente" (pas de résultat
-- correct encore saisi pour ce jeu, contrairement au cas benin11).
-- Le gain de 15 420 FCFA a déjà été retiré manuellement par les
-- admins du solde de Cossi Pamphile Tegbodjou (gain actuel = 0).
-- ============================================================

-- Vérification avant
SELECT id, numeroTicket, uniqueUserId, statut, gains
FROM Tickets
WHERE id IN (172496, 172498, 172499);

-- Correctif
UPDATE Tickets
SET statut = 'en attente'
WHERE id IN (172496, 172498, 172499);

-- Vérification après (doit montrer statut = 'en attente' pour les trois)
SELECT id, numeroTicket, uniqueUserId, statut, gains
FROM Tickets
WHERE id IN (172496, 172498, 172499);
