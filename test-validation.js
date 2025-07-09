/**
 * SCRIPT DE TEST POUR DÉBOGUER LA VALIDATION
 */

// Simuler les données exactes de vos tickets
const testTickets = [
  {
    id: 294,
    numeroTicket: "f4c06234-3805-4a27-8c95-a9099ff58629",
    numerosJoues: "[20,33]",
    typeJeu: "Twosûrs",
    formule: "Directe",
    nomJeu: "benin18"
  },
  {
    id: 298,
    numeroTicket: "fe5b7271-34a3-4dbd-a453-49369d3b9947",
    numerosJoues: "[33]",
    typeJeu: "FirstouonBK", 
    formule: "Directe",
    nomJeu: "benin18"
  },
  {
    id: 301,
    numeroTicket: "e8c901c8-0bd0-4e19-acfe-704a10d6e305",
    numerosJoues: "[88,68,77]",
    typeJeu: "NAP",
    formule: "NAP3",
    nomJeu: "benin18"
  }
];

// Résultat du jeu benin18
const winningNumbers = [20, 33, 88, 77, 68];
const winningNumbers2 = null; // benin18 n'a pas de double chance
const game = { doubleChance: false, nom: "benin18" };

// Importer la fonction de validation
const { validateSingleTicket, validateByFormula } = require('./src/scripts/validation');

console.log('🎯 === TEST DE VALIDATION POUR BENIN18 ===');
console.log(`🎲 Numéros gagnants: [${winningNumbers.join(', ')}]`);
console.log(`🎮 Jeu: ${game.nom} (double chance: ${game.doubleChance})`);

testTickets.forEach(ticket => {
  console.log(`\n🔍 === TEST TICKET ${ticket.id} ===`);
  console.log(`📋 Type: ${ticket.typeJeu}, Formule: ${ticket.formule}`);
  console.log(`🎯 Numéros: ${ticket.numerosJoues}`);
  
  try {
    const result = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game);
    console.log(`🏆 RÉSULTAT: ${result ? '✅ GAGNANT' : '❌ PERDANT'}`);
    
    // Test direct de la formule pour déboguer
    let playedNumbers = JSON.parse(ticket.numerosJoues);
    const directResult = validateByFormula(ticket.formule, playedNumbers, winningNumbers, ticket.typeJeu);
    console.log(`🔧 Test direct formule: ${directResult ? '✅ GAGNANT' : '❌ PERDANT'}`);
    
  } catch (error) {
    console.error(`❌ ERREUR: ${error.message}`);
  }
});

console.log('\n🎯 === TESTS MANUELS SPÉCIFIQUES ===');

// Test manuel Two Sûrs
console.log('\n📋 Test Two Sûrs Directe [20,33]:');
const twoSureResult = validateByFormula('Directe', [20, 33], winningNumbers, 'Twosûrs');
console.log(`Résultat: ${twoSureResult ? '✅ GAGNANT' : '❌ PERDANT'}`);

// Test manuel First BK
console.log('\n📋 Test First BK Directe [33]:');
const firstBKResult = validateByFormula('Directe', [33], winningNumbers, 'FirstouonBK');
console.log(`Résultat: ${firstBKResult ? '✅ GAGNANT' : '❌ PERDANT'}`);

// Test manuel NAP3
console.log('\n📋 Test NAP3 [88,68,77]:');
const nap3Result = validateByFormula('NAP3', [88, 68, 77], winningNumbers, 'NAP');
console.log(`Résultat: ${nap3Result ? '✅ GAGNANT' : '❌ PERDANT'}`);
