const { User } = require('../db/sequelize');
const moment = require('moment-timezone');

/**
 * Script pour remettre tous les bonus à 0
 * À exécuter chaque jour à 23h59 (heure du Bénin)
 */
async function resetAllBonuses() {
  try {
    console.log('🎯 Début de la remise à zéro des bonus...');

    // Vérifier si c'est le jour de bonus (1er Mars 2026)
    const todayBenin = moment().tz('Africa/Porto-Novo');
    const isBonusDay = todayBenin.isSame('2026-03-01', 'day');

    if (!isBonusDay) {
      console.log('📅 Pas le jour de bonus - Aucun reset nécessaire');
      return {
        success: true,
        message: 'Pas le jour de bonus',
        bonusesReset: 0
      };
    }

    // Compter les utilisateurs ayant des bonus avant reset
    const usersWithBonus = await User.count({
      where: {
        bonus: { [require('sequelize').Op.gt]: 0 }
      }
    });

    console.log(`💰 ${usersWithBonus} utilisateur(s) ont des bonus à remettre à zéro`);

    // Remettre tous les bonus à 0
    const [affectedRows] = await User.update(
      { bonus: 0 },
      {
        where: {
          bonus: { [require('sequelize').Op.gt]: 0 }
        }
      }
    );

    console.log(`✅ ${affectedRows} bonus remis à zéro avec succès`);
    console.log('🎉 Fin de la remise à zéro des bonus');

    return {
      success: true,
      message: 'Bonus remis à zéro avec succès',
      bonusesReset: affectedRows,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur lors de la remise à zéro des bonus:', error);
    throw error;
  }
}

// Export pour utilisation en tant que module
module.exports = { resetAllBonuses };

// Si exécuté directement (node resetBonuses.js)
if (require.main === module) {
  resetAllBonuses()
    .then(result => {
      console.log('Résultat:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}

// UPDATE Users SET bonus = 0 WHERE bonus > 0;
