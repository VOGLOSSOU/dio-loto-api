/**
 * SCRIPT POUR REVALIDER COTEIVOIRE7
 * Résultat: Win [35,43,33,77,11] + Machine [11,42,34,7,36]
 */

const { Ticket, Game, Result } = require('./src/db/sequelize');
const { validateSingleTicket } = require('./src/scripts/validation');

async function revalidateCoteivoire7() {
  try {
    console.log('🎯 === REVALIDATION COTEIVOIRE7 ===');
    
    // Résultat correct
    const winNumbers = [35, 43, 33, 77, 11];
    const machineNumbers = [11, 42, 34, 7, 36];
    
    console.log(`🎲 Win: [${winNumbers.join(', ')}]`);
    console.log(`🎲 Machine: [${machineNumbers.join(', ')}]`);
    
    // Récupérer le jeu
    const game = await Game.findOne({ 
      where: { nom: 'coteivoire7' }
    });
    
    if (!game) {
      console.log('❌ Jeu coteivoire7 non trouvé');
      return;
    }
    
    console.log(`🎮 Jeu: ${game.nom} (Double chance: ${game.doubleChance})`);
    
    // Récupérer les tickets invalidés
    const tickets = await Ticket.findAll({
      where: {
        nomJeu: 'coteivoire7',
        statut: 'invalidé'
      },
      order: [['id', 'DESC']]
    });
    
    console.log(`📊 ${tickets.length} ticket(s) invalidé(s) trouvé(s)`);
    
    let revalidated = 0;
    
    for (const ticket of tickets) {
      console.log(`\n🔍 === TICKET ${ticket.id} ===`);
      console.log(`📋 ${ticket.typeJeu}:${ticket.formule}`);
      console.log(`🎯 Numéros: ${ticket.numerosJoues}`);
      
      // Validation avec nos corrections
      const isValid = validateSingleTicket(ticket, winNumbers, machineNumbers, game);
      
      if (isValid) {
        await ticket.update({ statut: 'validé' });
        console.log(`✅ REVALIDÉ: ${ticket.typeJeu}:${ticket.formule}`);
        revalidated++;
      } else {
        console.log(`❌ Reste invalide: ${ticket.typeJeu}:${ticket.formule}`);
      }
    }
    
    console.log(`\n🎯 === RÉSUMÉ ===`);
    console.log(`📊 Total: ${tickets.length}`);
    console.log(`✅ Revalidés: ${revalidated}`);
    console.log(`📈 Taux: ${((revalidated / tickets.length) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

revalidateCoteivoire7().then(() => {
  console.log('\n✅ Terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
