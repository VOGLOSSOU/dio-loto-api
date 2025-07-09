/**
 * SCRIPT POUR RELANCER LA VALIDATION DES TICKETS BENIN18
 * Avec le résultat: 20,33,88,77,68
 */

const { Ticket, Game, Result } = require('./src/db/sequelize');
const { validateSingleTicket } = require('./src/scripts/validation');

async function revalidateBenin18() {
  try {
    console.log('🎯 === REVALIDATION MANUELLE BENIN18 ===');
    
    // 1. Récupérer le jeu benin18
    const game = await Game.findOne({ 
      where: { nom: 'benin18' },
      include: [{ model: Result, as: 'result' }]
    });
    
    if (!game) {
      console.log('❌ Jeu benin18 non trouvé');
      return;
    }
    
    console.log(`🎮 Jeu trouvé: ${game.nom} (ID: ${game.id})`);
    console.log(`🎮 Double chance: ${game.doubleChance}`);
    
    // 2. Vérifier le résultat actuel
    if (game.result) {
      console.log(`🎲 Résultat actuel en base: ${game.result.numbers}`);
      if (game.result.numbers2) {
        console.log(`🎲 Résultat 2: ${game.result.numbers2}`);
      }
    } else {
      console.log('⚠️ Aucun résultat en base pour ce jeu');
    }
    
    // 3. Utiliser le résultat correct pour la revalidation
    const correctResult = '20,33,88,77,68';
    const winningNumbers = correctResult.split(',').map(num => parseInt(num.trim()));
    const winningNumbers2 = null; // benin18 n'a pas de double chance
    
    console.log(`🎲 Résultat utilisé pour revalidation: [${winningNumbers.join(', ')}]`);
    
    // 4. Récupérer tous les tickets invalidés pour benin18
    const tickets = await Ticket.findAll({
      where: {
        nomJeu: 'benin18',
        statut: 'invalidé'  // On revalide les tickets invalidés
      },
      order: [['id', 'ASC']]
    });
    
    console.log(`📊 ${tickets.length} ticket(s) invalidé(s) trouvé(s) pour revalidation`);
    
    if (tickets.length === 0) {
      console.log('ℹ️ Aucun ticket à revalider');
      return;
    }
    
    // 5. Revalider chaque ticket
    let revalidated = 0;
    let stillInvalid = 0;
    const results = [];
    
    for (const ticket of tickets) {
      try {
        console.log(`\n🔍 === REVALIDATION TICKET ${ticket.id} ===`);
        console.log(`📋 Type: ${ticket.typeJeu}, Formule: ${ticket.formule}`);
        console.log(`🎯 Numéros: ${ticket.numerosJoues}`);
        
        // Utiliser notre fonction de validation corrigée
        const isValid = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game);
        
        const newStatus = isValid ? 'validé' : 'invalidé';
        const oldStatus = ticket.statut;
        
        // Mettre à jour le statut si nécessaire
        if (newStatus !== oldStatus) {
          await ticket.update({ statut: newStatus });
          console.log(`🔄 Statut mis à jour: ${oldStatus} → ${newStatus}`);
          
          if (isValid) {
            revalidated++;
          }
        } else {
          console.log(`📊 Statut inchangé: ${newStatus}`);
          if (!isValid) {
            stillInvalid++;
          }
        }
        
        results.push({
          ticketId: ticket.id,
          numeroTicket: ticket.numeroTicket,
          typeJeu: ticket.typeJeu,
          formule: ticket.formule,
          numerosJoues: ticket.numerosJoues,
          oldStatus: oldStatus,
          newStatus: newStatus,
          changed: newStatus !== oldStatus,
          isWinning: isValid
        });
        
      } catch (error) {
        console.error(`❌ Erreur lors de la revalidation du ticket ${ticket.id}:`, error);
        stillInvalid++;
      }
    }
    
    // 6. Résumé final
    console.log('\n🎯 === RÉSUMÉ DE LA REVALIDATION ===');
    console.log(`📊 Total tickets traités: ${tickets.length}`);
    console.log(`✅ Tickets revalidés (invalidé → validé): ${revalidated}`);
    console.log(`❌ Tickets restés invalides: ${stillInvalid}`);
    console.log(`📈 Taux de revalidation: ${((revalidated / tickets.length) * 100).toFixed(2)}%`);
    
    // 7. Afficher les tickets qui sont maintenant gagnants
    const nowWinning = results.filter(r => r.changed && r.isWinning);
    if (nowWinning.length > 0) {
      console.log('\n🏆 === TICKETS MAINTENANT GAGNANTS ===');
      nowWinning.forEach(ticket => {
        console.log(`✅ Ticket ${ticket.ticketId}: ${ticket.typeJeu} ${ticket.formule} ${ticket.numerosJoues}`);
      });
    }
    
    // 8. Afficher les tickets qui restent perdants (pour debug)
    const stillLosing = results.filter(r => !r.isWinning);
    if (stillLosing.length > 0) {
      console.log('\n❌ === TICKETS RESTÉS PERDANTS ===');
      stillLosing.slice(0, 5).forEach(ticket => { // Afficher max 5 pour éviter le spam
        console.log(`❌ Ticket ${ticket.ticketId}: ${ticket.typeJeu} ${ticket.formule} ${ticket.numerosJoues}`);
      });
      if (stillLosing.length > 5) {
        console.log(`... et ${stillLosing.length - 5} autres`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la revalidation:', error);
  }
}

// Exécuter le script
revalidateBenin18().then(() => {
  console.log('\n✅ Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
