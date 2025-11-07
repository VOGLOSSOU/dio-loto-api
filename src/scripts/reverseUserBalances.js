const { User, Ticket, sequelize } = require('../db/sequelize');
const { Op } = require('sequelize');

/**
 * Script pour ANNULER les corrections de soldes
 * Remet les soldes à leur état avant correction
 */
async function reverseUserBalances() {
  try {
    console.log('🔄 ANNULATION DES CORRECTIONS DE SOLDES...');
    console.log('⚠️ ATTENTION: Cette opération est IRRÉVERSIBLE !');

    // 1) Récupérer tous les utilisateurs
    const users = await User.findAll();
    console.log(`👥 ${users.length} utilisateurs trouvés`);

    let totalReversed = 0;
    let totalAmountRestored = 0;

    // 2) Pour chaque utilisateur, ANNULER la correction
    for (const user of users) {
      console.log(`\n🔍 Vérification de ${user.firstName} ${user.lastName} (${user.uniqueUserId})`);

      // Calculer le total des mises pour les tickets payants (isCart: false)
      const ticketsPayants = await Ticket.findAll({
        where: {
          uniqueUserId: user.uniqueUserId,
          isCart: false // Tickets sortis du panier (payants)
        },
        attributes: ['mise']
      });

      const totalMises = ticketsPayants.reduce((sum, ticket) => sum + ticket.mise, 0);
      console.log(`   🎫 ${ticketsPayants.length} tickets payants = ${totalMises} FCFA dépensés`);

      // Le solde devrait être : solde_actuel + total_mises (remettre l'argent)
      const soldeActuel = user.solde;

      if (totalMises > 0) {
        // Remettre l'argent débité
        const soldeRestaure = soldeActuel + totalMises;
        console.log(`   💰 Annulation: ${soldeActuel} → ${soldeRestaure} FCFA`);

        // Mettre à jour le solde
        user.solde = soldeRestaure;
        await user.save();

        totalReversed++;
        totalAmountRestored += totalMises;
      } else {
        console.log(`   ✅ Aucun ticket payant trouvé`);
      }
    }

    console.log(`\n🎉 Annulation terminée !`);
    console.log(`📊 ${totalReversed} utilisateurs restaurés`);
    console.log(`💰 ${totalAmountRestored} FCFA restitués`);

    return {
      totalUsers: users.length,
      reversedUsers: totalReversed,
      totalAmountRestored
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'annulation :', error);
    throw error;
  }
}

// Exécution si appelé directement (SANS CONFIRMATION)
if (require.main === module) {
  console.log('🚨 ANNULATION DES CORRECTIONS DE SOLDES');
  console.log('⚠️ Cette opération va REMETTRE LES SOLDES À LEUR ÉTAT PRÉCÉDENT');
  console.log('🔄 Lancement automatique...');

  reverseUserBalances()
    .then(result => {
      console.log('✅ Annulation terminée:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Échec:', error);
      process.exit(1);
    });
}

module.exports = { reverseUserBalances };