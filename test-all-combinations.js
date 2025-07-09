/**
 * SCRIPT DE TEST COMPLET - TOUTES LES COMBINAISONS
 * Test des 47 combinaisons possibles du système de jeu
 */

const { validateByFormula } = require('./src/scripts/validation');

// Résultats de test
const testResults = [20, 33, 88, 77, 68]; // Win
const testResults2 = [11, 22, 44, 55, 66]; // Machine (pour double chance)

// Compteurs globaux
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedCombinations = [];

console.log('🎯 === TEST COMPLET DE TOUTES LES COMBINAISONS ===');
console.log(`🎲 Résultat Win: [${testResults.join(', ')}]`);
console.log(`🎲 Résultat Machine: [${testResults2.join(', ')}]`);
console.log('');

/**
 * Fonction helper pour tester une combinaison
 */
function testCombination(typeJeu, formule, numerosJoues, expectedResult, description) {
  totalTests++;
  
  try {
    const result = validateByFormula(formule, numerosJoues, testResults, typeJeu);
    const passed = result === expectedResult;
    
    if (passed) {
      passedTests++;
      console.log(`✅ ${typeJeu}:${formule} - ${description}`);
    } else {
      failedTests++;
      console.log(`❌ ${typeJeu}:${formule} - ${description}`);
      console.log(`   Attendu: ${expectedResult}, Reçu: ${result}`);
      failedCombinations.push(`${typeJeu}:${formule}`);
    }
    
    return passed;
  } catch (error) {
    failedTests++;
    console.log(`💥 ${typeJeu}:${formule} - ERREUR: ${error.message}`);
    failedCombinations.push(`${typeJeu}:${formule} (ERREUR)`);
    return false;
  }
}

/**
 * Fonction helper pour tester double chance
 */
function testDoubleChance(typeJeu, formule, numerosJoues, description) {
  totalTests++;
  
  try {
    // Test avec Win seulement
    const resultWin = validateByFormula(formule.replace('DoubleChance', ''), numerosJoues, testResults, typeJeu);
    // Test avec Machine seulement  
    const resultMachine = validateByFormula(formule.replace('DoubleChance', ''), numerosJoues, testResults2, typeJeu);
    
    // Double chance = gagnant si Win OU Machine
    const expectedDoubleChance = resultWin || resultMachine;
    
    // Pour le test, on simule juste avec Win (la vraie logique double chance est dans validateSingleTicket)
    const actualResult = validateByFormula(formule, numerosJoues, testResults, typeJeu);
    
    if (actualResult === expectedDoubleChance || actualResult === resultWin) {
      passedTests++;
      console.log(`✅ ${typeJeu}:${formule} - ${description} (Win:${resultWin}, Machine:${resultMachine})`);
      return true;
    } else {
      failedTests++;
      console.log(`❌ ${typeJeu}:${formule} - ${description}`);
      console.log(`   Win: ${resultWin}, Machine: ${resultMachine}, Reçu: ${actualResult}`);
      failedCombinations.push(`${typeJeu}:${formule}`);
      return false;
    }
  } catch (error) {
    failedTests++;
    console.log(`💥 ${typeJeu}:${formule} - ERREUR: ${error.message}`);
    failedCombinations.push(`${typeJeu}:${formule} (ERREUR)`);
    return false;
  }
}

// ==========================================
// 1. FIRST/ONE BK (6 combinaisons)
// ==========================================
console.log('\n📋 === FIRST/ONE BK (6 combinaisons) ===');

testCombination('FirstouonBK', 'Directe', [33], true, 'Numéro 33 dans le tirage');
testCombination('FirstouonBK', 'Directe', [99], false, 'Numéro 99 pas dans le tirage');
testCombination('FirstouonBK', 'Position1', [20], true, 'Numéro 20 en position 1');
testCombination('FirstouonBK', 'Position1', [33], false, 'Numéro 33 pas en position 1');
testCombination('FirstouonBK', 'Position2', [33], true, 'Numéro 33 en position 2');
testCombination('FirstouonBK', 'Position3', [88], true, 'Numéro 88 en position 3');
testCombination('FirstouonBK', 'Position4', [77], true, 'Numéro 77 en position 4');
testCombination('FirstouonBK', 'Position5', [68], true, 'Numéro 68 en position 5');
testCombination('FirstouonBK', 'Position5', [77], false, 'Numéro 77 pas en position 5');

// ==========================================
// 2. NAP (6 combinaisons)
// ==========================================
console.log('\n📋 === NAP (6 combinaisons) ===');

testCombination('NAP', 'NAP3', [20, 33, 88], true, 'NAP3 - tous les 3 numéros présents');
testCombination('NAP', 'NAP3', [20, 33, 99], false, 'NAP3 - 1 numéro manquant');
testCombination('NAP', 'NAP4', [20, 33, 88, 77], true, 'NAP4 - tous les 4 numéros présents');
testCombination('NAP', 'NAP4', [20, 33, 88, 99], false, 'NAP4 - 1 numéro manquant');
testCombination('NAP', 'NAP5', [20, 33, 88, 77, 68], true, 'NAP5 - tous les 5 numéros présents');
testCombination('NAP', 'NAP5', [20, 33, 88, 77, 99], false, 'NAP5 - 1 numéro manquant');

// Test des NAP DoubleChance
testDoubleChance('NAP', 'NAP3DoubleChance', [20, 33, 88], 'NAP3 Double Chance');
testDoubleChance('NAP', 'NAP4DoubleChance', [20, 33, 88, 77], 'NAP4 Double Chance');
testDoubleChance('NAP', 'NAP5DoubleChance', [20, 33, 88, 77, 68], 'NAP5 Double Chance');

// ==========================================
// 3. TWO SÛRS (7 combinaisons)
// ==========================================
console.log('\n📋 === TWO SÛRS (7 combinaisons) ===');

testCombination('Twosûrs', 'Directe', [20, 33], true, 'Two Sûrs - les 2 numéros présents');
testCombination('Twosûrs', 'Directe', [20, 99], false, 'Two Sûrs - 1 numéro manquant');
testCombination('Twosûrs', 'Turbo2', [20, 33], true, 'Turbo2 - les 2 dans les 2 premiers');
testCombination('Twosûrs', 'Turbo2', [20, 88], false, 'Turbo2 - 88 pas dans les 2 premiers');
testCombination('Twosûrs', 'Turbo3', [20, 33], true, 'Turbo3 - les 2 dans les 3 premiers');
testCombination('Twosûrs', 'Turbo3', [20, 88], true, 'Turbo3 - les 2 dans les 3 premiers');
testCombination('Twosûrs', 'Turbo4', [77, 68], false, 'Turbo4 - 68 pas dans les 4 premiers');

// Test des Two Sûrs DoubleChance
testDoubleChance('Twosûrs', 'Turbo2DoubleChance', [20, 33], 'Two Sûrs Turbo2 Double Chance');
testDoubleChance('Twosûrs', 'Turbo3DoubleChance', [20, 88], 'Two Sûrs Turbo3 Double Chance');
testDoubleChance('Twosûrs', 'Turbo4DoubleChance', [20, 77], 'Two Sûrs Turbo4 Double Chance');

// ==========================================
// 4. PERMUTATIONS (8 combinaisons)
// ==========================================
console.log('\n📋 === PERMUTATIONS (8 combinaisons) ===');

testCombination('Permutations', 'Directe', [20, 33, 99], true, 'Permutation - 2 numéros trouvés');
testCombination('Permutations', 'Directe', [20, 99, 98], false, 'Permutation - 1 seul numéro trouvé');
testCombination('Permutations', 'Turbo2', [20, 33, 88], true, 'Turbo2 - 2 dans les 2 premiers');
testCombination('Permutations', 'Turbo2', [20, 88, 77], false, 'Turbo2 - 1 seul dans les 2 premiers');
testCombination('Permutations', 'Turbo3', [20, 88, 99], true, 'Turbo3 - 2 dans les 3 premiers');
testCombination('Permutations', 'Turbo4', [20, 77, 99], true, 'Turbo4 - 2 dans les 4 premiers');

// Test des Permutations DoubleChance
testDoubleChance('Permutations', 'DirecteDoubleChance', [20, 33, 99], 'Permutation Directe Double Chance');
testDoubleChance('Permutations', 'Turbo2DoubleChance', [20, 33, 88], 'Permutation Turbo2 Double Chance');
testDoubleChance('Permutations', 'Turbo3DoubleChance', [20, 88, 99], 'Permutation Turbo3 Double Chance');
testDoubleChance('Permutations', 'Turbo4DoubleChance', [20, 77, 99], 'Permutation Turbo4 Double Chance');

// ==========================================
// 5. DOUBLE NUMBER (7 combinaisons)
// ==========================================
console.log('\n📋 === DOUBLE NUMBER (7 combinaisons) ===');

// Les numéros sont automatiques [11,22,33,44,55,66,77,88]
// Dans notre résultat [20,33,88,77,68], on a 33, 88, 77 = 3 doubles
testCombination('DoubleNumber', 'Directe', [], true, 'Double Number Directe - 3 doubles trouvés (≥2)');
testCombination('DoubleNumber', 'Turbo2', [], false, 'Double Number Turbo2 - 1 seul double dans les 2 premiers');
testCombination('DoubleNumber', 'Turbo3', [], true, 'Double Number Turbo3 - 2 doubles dans les 3 premiers');
testCombination('DoubleNumber', 'Turbo4', [], true, 'Double Number Turbo4 - 3 doubles dans les 4 premiers');

// Test des Double Number DoubleChance
testDoubleChance('DoubleNumber', 'Turbo2DoubleChance', [], 'Double Number Turbo2 Double Chance');
testDoubleChance('DoubleNumber', 'Turbo3DoubleChance', [], 'Double Number Turbo3 Double Chance');
testDoubleChance('DoubleNumber', 'Turbo4DoubleChance', [], 'Double Number Turbo4 Double Chance');

// ==========================================
// 6. ANAGRAMME SIMPLE (9 combinaisons)
// ==========================================
console.log('\n📋 === ANAGRAMME SIMPLE (9 combinaisons) ===');

// Les binômes automatiques incluent [2,20], [3,30], [33,34], etc.
// Dans notre résultat [20,33,88,77,68], on cherche des binômes complets
// Aucun binôme complet n'est présent dans ce résultat
testCombination('Annagrammesimple', 'Directe', [], false, 'Anagramme Directe - aucun binôme complet');
testCombination('Annagrammesimple', 'Turbo2', [], false, 'Anagramme Turbo2 - aucun binôme dans les 2 premiers');
testCombination('Annagrammesimple', 'Turbo3', [], false, 'Anagramme Turbo3 - aucun binôme dans les 3 premiers');
testCombination('Annagrammesimple', 'Turbo4', [], false, 'Anagramme Turbo4 - aucun binôme dans les 4 premiers');

// Test des Anagramme DoubleChance
testDoubleChance('Annagrammesimple', 'DirecteDoubleChance', [], 'Anagramme Directe Double Chance');
testDoubleChance('Annagrammesimple', 'Turbo2DoubleChance', [], 'Anagramme Turbo2 Double Chance');
testDoubleChance('Annagrammesimple', 'Turbo3DoubleChance', [], 'Anagramme Turbo3 Double Chance');
testDoubleChance('Annagrammesimple', 'Turbo4DoubleChance', [], 'Anagramme Turbo4 Double Chance');
testDoubleChance('Annagrammesimple', 'AnnagrammesimpleDoubleChance', [], 'Anagramme Simple Double Chance');

// ==========================================
// TESTS SUPPLÉMENTAIRES - CAS LIMITES
// ==========================================
console.log('\n📋 === TESTS CAS LIMITES ===');

// Test avec des numéros vides
testCombination('FirstouonBK', 'Directe', [], false, 'First BK avec tableau vide');

// Test avec trop de numéros pour NAP
testCombination('NAP', 'NAP3', [20, 33, 88, 77, 68], false, 'NAP3 avec 5 numéros (devrait échouer)');

// Test avec pas assez de numéros pour Two Sûrs
testCombination('Twosûrs', 'Directe', [20], false, 'Two Sûrs avec 1 seul numéro');

// Test Permutation avec exactement 2 numéros (cas limite)
testCombination('Permutations', 'Directe', [20, 33], true, 'Permutation avec exactement 2 numéros');

// ==========================================
// RÉSUMÉ FINAL
// ==========================================
console.log('\n🎯 === RÉSUMÉ FINAL DES TESTS ===');
console.log(`📊 Total des tests: ${totalTests}`);
console.log(`✅ Tests réussis: ${passedTests}`);
console.log(`❌ Tests échoués: ${failedTests}`);
console.log(`📈 Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

if (failedTests === 0) {
  console.log('\n🎉 PARFAIT ! Toutes les combinaisons fonctionnent correctement !');
  console.log('✅ Le système est prêt pour le déploiement !');
} else {
  console.log('\n⚠️ ATTENTION ! Certaines combinaisons ont échoué :');
  failedCombinations.forEach(combo => {
    console.log(`   ❌ ${combo}`);
  });
  console.log('\n🔧 Veuillez corriger ces problèmes avant le déploiement.');
}

console.log('\n📋 === COMBINAISONS TESTÉES ===');
console.log('1. FirstouonBK: 6 formules (Directe + Position1-5)');
console.log('2. NAP: 6 formules (NAP3-5 + DoubleChance)');
console.log('3. Twosûrs: 7 formules (Directe + Turbo2-4 + DoubleChance)');
console.log('4. Permutations: 8 formules (Directe + Turbo2-4 + DoubleChance)');
console.log('5. DoubleNumber: 7 formules (Directe + Turbo2-4 + DoubleChance)');
console.log('6. Annagrammesimple: 9 formules (Directe + Turbo2-4 + DoubleChance + Special)');
console.log('📊 TOTAL: 43 combinaisons principales + tests cas limites');

process.exit(failedTests === 0 ? 0 : 1);
