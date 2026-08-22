-- ============================================================
-- Suite du correctif incident Result 4708 (benin11) :
-- Les 2 tickets déjà "attribué" à tort sur base du mauvais résultat
-- (60 21 18 14 15) sont repassés à "invalidé", leur vrai statut
-- face au résultat correct (Result 4710 : 45 60 29 10 84).
-- Le gain de 60 000 FCFA a déjà été retiré manuellement par les
-- admins du solde de l'utilisateur (jeans@gmail.com) séparément.
-- ============================================================

-- Vérification avant
SELECT id, numeroTicket, uniqueUserId, statut, gains
FROM Tickets
WHERE id IN (161862, 161867);

-- Correctif
UPDATE Tickets
SET statut = 'invalidé'
WHERE id IN (161862, 161867);

-- Vérification après (doit montrer statut = 'invalidé' pour les deux)
SELECT id, numeroTicket, uniqueUserId, statut, gains
FROM Tickets
WHERE id IN (161862, 161867);
