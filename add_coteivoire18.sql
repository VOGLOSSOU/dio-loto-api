-- Requêtes SQL pour METTRE À JOUR le jeu coteivoire18 (déjà en DB)

-- 1. Mettre à jour la description du jeu
UPDATE `Games`
SET `description` = 'Disponible dès 21h00 et devient indisponible à partir de 17h55.'
WHERE `nom` = 'coteivoire18';

-- 2. Mettre à jour les horaires
UPDATE `Schedules`
SET `startTime` = '21:00:00', `endTime` = '17:55:00'
WHERE `gameId` = (SELECT id FROM Games WHERE nom = 'coteivoire18' LIMIT 1);

-- Vérification : Afficher le jeu et son schedule mis à jour
SELECT g.nom, g.description, g.pays, g.doubleChance, s.startTime, s.endTime, s.timezone
FROM Games g
LEFT JOIN Schedules s ON g.id = s.gameId
WHERE g.nom = 'coteivoire18';