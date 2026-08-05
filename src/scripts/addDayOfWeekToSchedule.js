const { sequelize } = require('../db/sequelize');

/**
 * Migration : ajout du champ dayOfWeek à la table Schedules
 * Permet de gérer des jeux qui ne s'ouvrent/ferment qu'un jour précis de la semaine
 * (ex: togodetente, uniquement le dimanche). null = comportement quotidien historique.
 */
async function addDayOfWeekToSchedule() {
  try {
    console.log('🔄 Migration: Ajout du champ dayOfWeek à Schedules...');

    await sequelize.query(`
      ALTER TABLE Schedules
      ADD COLUMN dayOfWeek INT NULL COMMENT '0=dimanche...6=samedi, null=tous les jours';
    `);

    console.log('✅ Migration réussie ! Nouveau champ ajouté: dayOfWeek');
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  }
}

if (require.main === module) {
  addDayOfWeekToSchedule()
    .then(() => {
      console.log('🎉 Migration terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration :', error);
      process.exit(1);
    });
}

module.exports = { addDayOfWeekToSchedule };
