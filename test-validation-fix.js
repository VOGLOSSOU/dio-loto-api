// =====================================================
// TEST SCRIPT - VALIDATION FIX POUR CÔTE D'IVOIRE
// =====================================================

const { validateSingleTicket } = require('./src/scripts/validation');

// Données de test basées sur les vrais tickets problématiques
const testTickets = [
  {
    id: 3393,
    numeroTicket: '14331fd7-447d-448c-9cab-29b7e041d606',
    typeJeu: 'FirstouonBK',
    formule: 'Directe',
    numerosJoues: [20], // Numéro joué
    nomJeu: 'coteivoire16',
    statut: 'en attente'
  },
  {
    id: 3391,
    numeroTicket: '122ac4d6-93f9-49a7-b084-b4dc8ec48499',
    typeJeu: 'FirstouonBK',
    formule: 'Directe',
    numerosJoues: [20], // Numéro joué
    nomJeu: 'coteivoire16',
    statut: 'en attente'
  }
];

// Résultat réel de coteivoire16
const result = {
  numbers: '58,86,17,49,11',    // Win - 20 PAS trouvé
  numbers2: '2,62,69,36,20'     // Machine - 20 trouvé
};

// Configuration du jeu Côte d'Ivoire
const game = {
  id: 1,
  nom: 'coteivoire16',
  doubleChance: true,  // Côte d'Ivoire = double chance activée
  pays: 'Côte d\'Ivoire'
};

console.log('🎯 === TEST DE VALIDATION - FIX CÔTE D\'IVOIRE ===\n');
console.log('📊 Résultat du jeu coteivoire16:');
console.log(`   Win: [${result.numbers}]`);
console.log(`   Machine: [${result.numbers2}]`);
console.log(`   Double Chance: ${game.doubleChance ? 'ACTIVÉ' : 'DÉSACTIVÉ'}\n`);

console.log('🎫 Tickets à tester:');
testTickets.forEach(ticket => {
  console.log(`   ${ticket.id}: ${ticket.typeJeu}:${ticket.formule} - Numéro ${ticket.numerosJoues[0]}`);
});
console.log('\n');

// Test de validation pour chaque ticket
testTickets.forEach(ticket => {
  console.log(`🔍 === VALIDATION TICKET ${ticket.id} ===`);

  const winningNumbers = result.numbers.split(',').map(n => parseInt(n.trim()));
  const winningNumbers2 = result.numbers2 ? result.numbers2.split(',').map(n => parseInt(n.trim())) : null;

  const isWinning = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game);

  console.log(`🏆 RÉSULTAT: ${isWinning ? 'GAGNANT (validé)' : 'PERDANT (invalidé)'}`);
  console.log(`📝 Attendu: PERDANT (car 20 pas dans Win et formule="Directe")\n`);
});

// Test supplémentaire avec formule DoubleChance
console.log('🔄 === TEST COMPLÉMENTAIRE - FORMULE DOUBLE CHANCE ===');

const doubleChanceTicket = {
  ...testTickets[0],
  formule: 'DirecteDoubleChance'
};

console.log(`🎫 Ticket avec formule "DirecteDoubleChance":`);
const isWinningDC = validateSingleTicket(doubleChanceTicket,
  result.numbers.split(',').map(n => parseInt(n.trim())),
  result.numbers2.split(',').map(n => parseInt(n.trim())),
  game);

console.log(`🏆 RÉSULTAT: ${isWinningDC ? 'GAGNANT (validé)' : 'PERDANT (invalidé)'}`);
console.log(`📝 Attendu: GAGNANT (car 20 trouvé dans Machine)\n`);

console.log('✅ === TEST TERMINÉ ===');