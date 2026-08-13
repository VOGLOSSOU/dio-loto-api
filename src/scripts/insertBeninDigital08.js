const { Game, Schedule } = require('../db/sequelize');

/**
 * Insertion du jeu beninDigital08 : nouveau jeu quotidien du Bénin,
 * tirage à 08h00 heure du Bénin, pas de double chance.
 */
async function insertBeninDigital08() {
  try {
    console.log('🔄 Insertion du jeu beninDigital08...');

    const [game, gameCreated] = await Game.findOrCreate({
      where: { nom: 'beninDigital08' },
      defaults: {
        nom: 'beninDigital08',
        description: 'Disponible dès 11h00 et devient indisponible à partir de 07h55.',
        pays: 'Benin',
        doubleChance: false,
        statut: 'ouvert',
        manualOverride: false
      }
    });
    console.log(gameCreated ? `✅ Jeu créé (id=${game.id})` : `ℹ️ Jeu déjà existant (id=${game.id}), pas de doublon créé`);

    const [schedule, scheduleCreated] = await Schedule.findOrCreate({
      where: { gameId: game.id },
      defaults: {
        gameId: game.id,
        startTime: '11:00:00',
        endTime: '07:55:00',
        pays: 'Benin',
        timezone: 'Africa/Porto-Novo',
        dayOfWeek: null // quotidien
      }
    });
    console.log(scheduleCreated ? `✅ Schedule créé (id=${schedule.id})` : `ℹ️ Schedule déjà existant (id=${schedule.id}), pas de doublon créé`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion :', error);
    throw error;
  }
}

if (require.main === module) {
  insertBeninDigital08()
    .then(() => {
      console.log('🎉 Insertion terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de l\'insertion :', error);
      process.exit(1);
    });
}

module.exports = { insertBeninDigital08 };
