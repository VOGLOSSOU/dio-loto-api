const { User, Ticket, sequelize } = require('../db/sequelize');
const { Op } = require('sequelize');

/**
 * Script pour recalculer et corriger les soldes des utilisateurs
 * en se basant sur leurs tickets validés (non en panier)
 */
async function fixUserBalances() {
  try {
    console.log('🔄 Début de la correction des soldes utilisateurs...');

    // 1) Récupérer tous les utilisateurs
    const users = await User.findAll();
    console.log(`👥 ${users.length} utilisateurs trouvés`);

    let totalCorrections = 0;
    let totalAmountCorrected = 0;

    // 2) Pour chaque utilisateur, recalculer son solde
    for (const user of users) {
      console.log(`\n🔍 Vérification de ${user.firstName} ${user.lastName} (${user.uniqueUserId})`);

      // Calculer le total des mises pour TOUS les tickets NON en panier (peu importe le statut)
      const ticketsPayants = await Ticket.findAll({
        where: {
          uniqueUserId: user.uniqueUserId,
          isCart: false // Uniquement les tickets sortis du panier (payés)
        },
        attributes: ['mise']
      });

      const totalMises = ticketsPayants.reduce((sum, ticket) => sum + ticket.mise, 0);
      console.log(`   🎫 ${ticketsPayants.length} tickets payants = ${totalMises} FCFA dépensés`);

      // SI la somme des mises dépasse le solde actuel, débiter complètement
      const soldeActuel = user.solde;

      if (totalMises > soldeActuel) {
        // L'utilisateur doit payer pour ses tickets - débiter même si ça va en négatif
        const soldeCorrige = soldeActuel - totalMises;
        console.log(`   💰 Correction: ${soldeActuel} → ${soldeCorrige} FCFA (dépassement autorisé)`);

        // Mettre à jour le solde (peut être négatif)
        user.solde = soldeCorrige;
        await user.save();

        totalCorrections++;
        totalAmountCorrected += totalMises; // On récupère tout ce qui était dû
      } else {
        console.log(`   ✅ Solde suffisant: ${soldeActuel} FCFA (rien à corriger)`);
      }
    }

    console.log(`\n🎉 Correction terminée !`);
    console.log(`📊 ${totalCorrections} utilisateurs corrigés`);
    console.log(`💰 ${totalAmountCorrected} FCFA récupérés`);

    return {
      totalUsers: users.length,
      correctedUsers: totalCorrections,
      totalAmountRecovered: totalAmountCorrected
    };

  } catch (error) {
    console.error('❌ Erreur lors de la correction des soldes :', error);
    throw error;
  }
}

// REMISE À ZÉRO SUPPRIMÉE - TROP DANGEREUSE

// Exécution si appelé directement
if (require.main === module) {
  console.log('🔧 Correction douce des soldes utilisateurs');
  console.log('⚠️ Assure-toi d\'avoir fait une sauvegarde de la base !');

  fixUserBalances()
    .then(result => {
      console.log('✅ Correction terminée:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Échec:', error);
      process.exit(1);
    });
}

module.exports = { fixUserBalances };