-- Requêtes SQL pour ajouter le jeu coteivoire18 manuellement dans phpMyAdmin

-- 1. Insérer le jeu dans la table Games
INSERT INTO `Games` (`nom`, `description`, `statut`, `pays`, `doubleChance`, `manualOverride`, `createdAt`, `updatedAt`)
VALUES ('coteivoire18', 'Disponible dès 18h00 et devient indisponible à partir de 17h55.', 'ouvert', 'Côte d\'Ivoire', 1, 0, NOW(), NOW());

-- 2. Insérer le schedule dans la table Schedules
-- Récupérer d'abord l'ID du jeu créé
SET @gameId = (SELECT id FROM Games WHERE nom = 'coteivoire18' LIMIT 1);

INSERT INTO `Schedules` (`gameId`, `startTime`, `endTime`, `pays`, `timezone`, `createdAt`, `updatedAt`)
VALUES (@gameId, '18:00:00', '17:55:00', 'Côte d\'Ivoire', 'Africa/Abidjan', NOW(), NOW());

-- Vérification : Afficher le jeu et son schedule
SELECT g.nom, g.description, g.pays, g.doubleChance, s.startTime, s.endTime, s.timezone
FROM Games g
LEFT JOIN Schedules s ON g.id = s.gameId
WHERE g.nom = 'coteivoire18';