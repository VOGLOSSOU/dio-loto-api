// Script pour tester l'ordre des jeux par heure d'ouverture
const { Game, Schedule } = require('./src/db/sequelize');

async function testGamesOrder() {
  try {
    console.log('Test ordre des jeux Côte d\'Ivoire...');

    const games = await Game.findAll({
      where: { pays: 'Côte d\'Ivoire' },
      include: [{
        model: Schedule,
        as: 'schedules',
        attributes: ['startTime']
      }],
      order: [[Schedule, 'startTime', 'ASC']]
    });

    games.forEach(game => {
      const startTime = game.schedules[0]?.startTime || 'N/A';
      console.log(`${game.nom}: ${startTime}`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testGamesOrder();