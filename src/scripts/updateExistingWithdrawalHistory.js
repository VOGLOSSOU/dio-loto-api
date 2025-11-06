const { WithdrawalHistory, sequelize } = require('../db/sequelize');

/**
 * Script pour mettre à jour les enregistrements existants de WithdrawalHistory
 * Ajouter originalCreatedAt pour les retraits archivés manuellement
 */
async function updateExistingWithdrawalHistory() {
  try {
    console.log('🔄 Mise à jour des enregistrements WithdrawalHistory existants...');

    // Pour les retraits archivés manuellement (comme celui de Liliane), on utilise une date approximative
    // Ici on met la date d'hier pour le retrait de Liliane qui a été créé hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(13, 55, 49, 0); // Heure approximative du retrait

    // Mettre à jour l'enregistrement de Liliane GNAHOUI
    const [updatedRows] = await WithdrawalHistory.update(
      {
        originalCreatedAt: yesterday // Date d'hier vers 13h55
      },
      {
        where: {
          uniqueId: '6524c9b4-b72c-4b96-8536-a5e78db0977d'
        }
      }
    );

    if (updatedRows > 0) {
      console.log('✅ Enregistrement de Liliane GNAHOUI mis à jour avec originalCreatedAt');
    } else {
      console.log('⚠️ Aucun enregistrement trouvé pour Liliane GNAHOUI');
    }

    // Pour les futurs retraits archivés automatiquement, ils auront originalCreatedAt
    console.log('📝 Note: Les futurs retraits archivés auront automatiquement originalCreatedAt');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  updateExistingWithdrawalHistory()
    .then(() => {
      console.log('🎉 Mise à jour terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la mise à jour :', error);
      process.exit(1);
    });
}

module.exports = { updateExistingWithdrawalHistory };