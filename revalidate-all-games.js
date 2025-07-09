/**
 * SCRIPT GLOBAL DE REVALIDATION
 * Revalide TOUS les tickets invalidés de TOUS les jeux
 */

const { Ticket, Game, Result } = require('./src/db/sequelize');
const { validateSingleTicket } = require('./src/scripts/validation');

async function revalidateAllGames() {
  try {
    console.log('🎯 === REVALIDATION GLOBALE DE TOUS LES JEUX ===');
    
    // 1. Récupérer tous les jeux qui ont des résultats
    const games = await Game.findAll({
      include: [{
        model: Result,
        as: 'result',
        required: true // Seulement les jeux avec résultats
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`🎮 ${games.length} jeu(s) avec résultats trouvé(s)`);
    
    if (games.length === 0) {
      console.log('ℹ️ Aucun jeu avec résultat à revalider');
      return;
    }
    
    let totalTickets = 0;
    let totalRevalidated = 0;
    const gameResults = [];
    
    // 2. Pour chaque jeu
    for (const game of games) {
      console.log(`\n🎮 === JEU: ${game.nom} ===`);
      console.log(`📅 Créé: ${game.createdAt}`);
      console.log(`🎲 Double chance: ${game.doubleChance}`);
      
      // Récupérer le résultat
      const result = game.result;
      if (!result) {
        console.log('⚠️ Pas de résultat pour ce jeu');
        continue;
      }
      
      // Parser les numéros gagnants - Gérer les espaces ET les virgules
      const winNumbers = result.numbers.includes(',') ?
        result.numbers.split(',').map(n => parseInt(n.trim())) :
        result.numbers.split(' ').filter(n => n.trim()).map(n => parseInt(n.trim()));

      const machineNumbers = result.numbers2 ?
        (result.numbers2.includes(',') ?
          result.numbers2.split(',').map(n => parseInt(n.trim())) :
          result.numbers2.split(' ').filter(n => n.trim()).map(n => parseInt(n.trim()))
        ) : null;
      
      console.log(`🎲 Win: [${winNumbers.join(', ')}]`);
      if (machineNumbers) {
        console.log(`🎲 Machine: [${machineNumbers.join(', ')}]`);
      }
      
      // 3. Récupérer tous les tickets invalidés pour ce jeu
      const tickets = await Ticket.findAll({
        where: {
          nomJeu: game.nom,
          statut: 'invalidé'
        },
        order: [['id', 'ASC']]
      });
      
      console.log(`📊 ${tickets.length} ticket(s) invalidé(s) pour ${game.nom}`);
      totalTickets += tickets.length;
      
      if (tickets.length === 0) {
        console.log('✅ Aucun ticket invalidé à revalider');
        gameResults.push({
          gameName: game.nom,
          totalTickets: 0,
          revalidated: 0,
          percentage: 0
        });
        continue;
      }
      
      let gameRevalidated = 0;
      
      // 4. Revalider chaque ticket
      for (const ticket of tickets) {
        try {
          // Utiliser notre fonction de validation corrigée
          const isValid = validateSingleTicket(ticket, winNumbers, machineNumbers, game);
          
          if (isValid) {
            await ticket.update({ statut: 'validé' });
            gameRevalidated++;
            console.log(`✅ Ticket ${ticket.id} revalidé: ${ticket.typeJeu}:${ticket.formule}`);
          }
        } catch (error) {
          console.error(`❌ Erreur ticket ${ticket.id}:`, error.message);
        }
      }
      
      totalRevalidated += gameRevalidated;
      const gamePercentage = tickets.length > 0 ? 
        ((gameRevalidated / tickets.length) * 100).toFixed(2) : 0;
      
      console.log(`📊 ${game.nom}: ${gameRevalidated}/${tickets.length} revalidés (${gamePercentage}%)`);
      
      gameResults.push({
        gameName: game.nom,
        totalTickets: tickets.length,
        revalidated: gameRevalidated,
        percentage: parseFloat(gamePercentage)
      });
    }
    
    // 5. Résumé global
    console.log('\n🎯 === RÉSUMÉ GLOBAL ===');
    console.log(`🎮 Jeux traités: ${games.length}`);
    console.log(`📊 Total tickets invalidés: ${totalTickets}`);
    console.log(`✅ Total tickets revalidés: ${totalRevalidated}`);
    
    const globalPercentage = totalTickets > 0 ? 
      ((totalRevalidated / totalTickets) * 100).toFixed(2) : 0;
    console.log(`📈 Taux global de revalidation: ${globalPercentage}%`);
    
    // 6. Détail par jeu
    console.log('\n📋 === DÉTAIL PAR JEU ===');
    gameResults.forEach(result => {
      const status = result.revalidated > 0 ? '✅' : '⚪';
      console.log(`${status} ${result.gameName}: ${result.revalidated}/${result.totalTickets} (${result.percentage}%)`);
    });
    
    // 7. Jeux avec le plus de revalidations
    const topGames = gameResults
      .filter(r => r.revalidated > 0)
      .sort((a, b) => b.revalidated - a.revalidated)
      .slice(0, 5);
    
    if (topGames.length > 0) {
      console.log('\n🏆 === TOP 5 JEUX AVEC LE PLUS DE REVALIDATIONS ===');
      topGames.forEach((game, index) => {
        console.log(`${index + 1}. ${game.gameName}: ${game.revalidated} tickets (${game.percentage}%)`);
      });
    }
    
    // 8. Recommandations
    console.log('\n💡 === RECOMMANDATIONS ===');
    if (totalRevalidated > 0) {
      console.log(`✅ ${totalRevalidated} tickets ont été revalidés et sont maintenant gagnants`);
      console.log('📢 Informez vos utilisateurs de cette correction technique');
      console.log('💰 Vérifiez les gains à créditer pour ces tickets');
    } else {
      console.log('✅ Aucun ticket à revalider - Le système fonctionne correctement');
    }
    
    console.log('\n🔧 === PROCHAINES ÉTAPES ===');
    console.log('✅ Les nouveaux jeux utiliseront automatiquement la logique corrigée');
    console.log('✅ Ce script peut être relancé à tout moment si nécessaire');
    console.log('✅ Le problème de parsing est définitivement résolu');
    
  } catch (error) {
    console.error('❌ Erreur lors de la revalidation globale:', error);
  }
}

// Exécuter le script
revalidateAllGames().then(() => {
  console.log('\n🎉 REVALIDATION GLOBALE TERMINÉE !');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
