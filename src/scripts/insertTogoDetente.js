const { Game, Schedule } = require('../db/sequelize');

/**
 * Insertion du jeu togodetente : nouveau produit Togo, ne se joue que le
 * dimanche à 16h heure Togo (Africa/Lome, GMT), double chance activée,
 * même fonctionnement/partage de gains que togo9.
 */
async function insertTogoDetente() {
  try {
    console.log('🔄 Insertion du jeu togodetente...');

    const [game, gameCreated] = await Game.findOrCreate({
      where: { nom: 'togodetente' },
      defaults: {
        nom: 'togodetente',
        description: "Togo Détente - Disponible uniquement le dimanche à partir de 19h00, devient indisponible le dimanche à partir de 15h55 (tirage 16h00, double chance).",
        pays: 'Togo',
        doubleChance: true,
        statut: 'ouvert',
        manualOverride: false
      }
    });
    console.log(gameCreated ? `✅ Jeu créé (id=${game.id})` : `ℹ️ Jeu déjà existant (id=${game.id}), pas de doublon créé`);

    const [schedule, scheduleCreated] = await Schedule.findOrCreate({
      where: { gameId: game.id },
      defaults: {
        gameId: game.id,
        startTime: '19:00:00',
        endTime: '15:55:00',
        pays: 'Togo',
        timezone: 'Africa/Lome',
        dayOfWeek: 0 // dimanche
      }
    });
    console.log(scheduleCreated ? `✅ Schedule créé (id=${schedule.id})` : `ℹ️ Schedule déjà existant (id=${schedule.id}), pas de doublon créé`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion :', error);
    throw error;
  }
}

if (require.main === module) {
  insertTogoDetente()
    .then(() => {
      console.log('🎉 Insertion terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de l\'insertion :', error);
      process.exit(1);
    });
}

module.exports = { insertTogoDetente };
