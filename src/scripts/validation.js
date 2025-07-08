/**
 * FICHIER VALIDATION.JS COMPLÈTEMENT CORRIGÉ
 * Basé sur les vrais formats de formules stockés en base de données
 * ET sur les vraies règles métier de la loterie
 * 
 * === RÈGLES MÉTIER CORRECTES ===
 * 
 * 1. FIRST OU BK:
 *    - Directe: Un seul numéro qui doit être PARMI les numéros tirés
 *    - Position1-5: Le numéro doit être à la position EXACTE (1=premier, 2=deuxième, etc.)
 * 
 * 2. TWO SURE:
 *    - Directe: Deux numéros qui doivent TOUS être parmi les numéros tirés
 *    - Turbo2: Les 2 numéros doivent être dans les 2 PREMIERS numéros tirés
 *    - Turbo3: Les 2 numéros doivent être dans les 3 PREMIERS numéros tirés
 *    - Turbo4: Les 2 numéros doivent être dans les 4 PREMIERS numéros tirés
 * 
 * 3. PERMUTATION:
 *    - Directe: Au moins 2 numéros trouvés parmi la liste choisie
 *    - Turbo2/3/4: Au moins 2 numéros trouvés dans les X premiers tirés
 * 
 * 4. NAP (3,4,5):
 *    - Tous les numéros NAP doivent être parmi les numéros tirés (ordre non important)
 * 
 * 5. DOUBLE CHANCE:
 *    - Win = 5 premiers numéros tirés (60% des gains)
 *    - Machine = 5 derniers numéros tirés (40% des gains)
 */

/**
 * Fonction principale de validation des tickets
 * @param {Array} tickets - Liste des tickets à valider
 * @param {Object} result - Résultat du jeu avec numbers et numbers2 pour double chance
 * @param {Object} game - Informations du jeu
 * @returns {Array} - Liste des tickets avec leur statut de validation
 */
function validateTickets(tickets, result, game) {
  const winningNumbers = result.numbers.split(',').map(num => parseInt(num.trim()));
  const winningNumbers2 = result.numbers2 ? result.numbers2.split(',').map(num => parseInt(num.trim())) : null;
  
  console.log(`🎯 validateTickets: ${tickets.length} tickets à valider`);
  console.log(`🎲 Numéros gagnants principaux: ${winningNumbers}`);
  if (winningNumbers2) {
    console.log(`🎲 Numéros gagnants secondaires: ${winningNumbers2}`);
  }
  
  return tickets.map(ticket => {
    const isWinning = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game);
    return {
      ...ticket,
      statut: isWinning ? 'validé' : 'invalidé',
      isWinning
    };
  });
}

/**
 * Validation d'un ticket individuel
 * @param {Object} ticket - Le ticket à valider
 * @param {Array} winningNumbers - Numéros gagnants principaux
 * @param {Array|null} winningNumbers2 - Numéros gagnants secondaires (double chance)
 * @param {Object} game - Informations du jeu
 * @returns {boolean} - true si gagnant, false sinon
 */
function validateSingleTicket(ticket, winningNumbers, winningNumbers2, game) {
  const { formule, numerosJoues, typeJeu } = ticket;
  
  // Conversion sécurisée des numéros joués en entiers
  let playedNumbers;
  try {
    if (Array.isArray(numerosJoues)) {
      playedNumbers = numerosJoues.map(num => parseInt(num));
    } else if (typeof numerosJoues === 'string') {
      playedNumbers = JSON.parse(numerosJoues).map(num => parseInt(num));
    } else {
      playedNumbers = JSON.parse(numerosJoues).map(num => parseInt(num));
    }
  } catch (error) {
    console.error(`❌ Erreur parsing numerosJoues pour ticket ${ticket.id}:`, error);
    return false;
  }
  
  console.log(`\n🔍 === VALIDATION TICKET ${ticket.id} ===`);
  console.log(`📋 Formule: "${formule}"`);
  console.log(`🎮 Type de jeu: "${typeJeu}"`);
  console.log(`🎯 Numéros joués: [${playedNumbers.join(', ')}]`);
  console.log(`🎲 Numéros gagnants: [${winningNumbers.join(', ')}]`);
  if (winningNumbers2) {
    console.log(`🎲 Numéros gagnants 2: [${winningNumbers2.join(', ')}]`);
  }
  
  // Gestion de la double chance
  if (game.doubleChance && winningNumbers2) {
    console.log(`🔄 Mode double chance activé`);
    const winInFirst = validateByFormula(formule, playedNumbers, winningNumbers, typeJeu);
    const winInSecond = validateByFormula(formule, playedNumbers, winningNumbers2, typeJeu);
    
    console.log(`📊 Résultat tirage principal: ${winInFirst ? 'GAGNANT' : 'PERDANT'}`);
    console.log(`📊 Résultat tirage secondaire: ${winInSecond ? 'GAGNANT' : 'PERDANT'}`);
    
    const finalResult = winInFirst || winInSecond;
    console.log(`🏆 RÉSULTAT FINAL: ${finalResult ? 'GAGNANT' : 'PERDANT'}`);
    return finalResult;
  }
  
  const result = validateByFormula(formule, playedNumbers, winningNumbers, typeJeu);
  console.log(`🏆 RÉSULTAT FINAL: ${result ? 'GAGNANT' : 'PERDANT'}`);
  return result;
}

/**
 * Validation selon la formule de jeu - CORRIGÉE avec les vrais formats
 * @param {string} formule - Formule de jeu
 * @param {Array} playedNumbers - Numéros joués
 * @param {Array} winningNumbers - Numéros gagnants
 * @param {string} typeJeu - Type de jeu (optionnel)
 * @returns {boolean} - true si gagnant selon la formule
 */
function validateByFormula(formule, playedNumbers, winningNumbers, typeJeu = null) {
  // Nettoyage de la formule (GARDE le PascalCase original)
  const formuleClean = formule.trim();
  
  console.log(`  🎯 Validation: typeJeu="${typeJeu}" + formule="${formule}" → "${formuleClean}"`);
  
  // VALIDATION BASÉE SUR LA COMBINAISON typeJeu + formule (comme le frontend !)
  const combinaison = typeJeu ? `${typeJeu}:${formuleClean}` : formuleClean;
  console.log(`  🔍 Combinaison analysée: "${combinaison}"`);
  
  switch (combinaison) {
    // === FIRST OU BK ===
    case 'FirstouonBK:Directe':
      return validateDirecte(playedNumbers, winningNumbers);
    
    case 'FirstouonBK:Position1':
      return validatePosition(playedNumbers, winningNumbers, 1);
    
    case 'FirstouonBK:Position2':
      return validatePosition(playedNumbers, winningNumbers, 2);
    
    case 'FirstouonBK:Position3':
      return validatePosition(playedNumbers, winningNumbers, 3);
    
    case 'FirstouonBK:Position4':
      return validatePosition(playedNumbers, winningNumbers, 4);
    
    case 'FirstouonBK:Position5':
      return validatePosition(playedNumbers, winningNumbers, 5);
    
    // === NAP ===
    case 'NAP:NAP3':
    case 'NAP:NAP3DoubleChance':
      return validateNAP(playedNumbers, winningNumbers, 3);
    
    case 'NAP:NAP4':
    case 'NAP:NAP4DoubleChance':
      return validateNAP(playedNumbers, winningNumbers, 4);
    
    case 'NAP:NAP5':
    case 'NAP:NAP5DoubleChance':
      return validateNAP(playedNumbers, winningNumbers, 5);
    
    // === TWO SÛRS ===
    case 'Twosûrs:Directe':
    case 'Twosûrs:DirecteDoubleChance':
      // RÈGLE : Deux numéros qui doivent TOUS être parmi les numéros tirés
      return validateDirecte(playedNumbers, winningNumbers);
    
    case 'Twosûrs:Turbo2':
    case 'Twosûrs:Turbo2DoubleChance':
      // RÈGLE : Les 2 numéros doivent être dans les 2 PREMIERS tirés
      return validateTurbo(playedNumbers, winningNumbers, 2);
    
    case 'Twosûrs:Turbo3':
    case 'Twosûrs:Turbo3DoubleChance':
      // RÈGLE : Les 2 numéros doivent être dans les 3 PREMIERS tirés
      return validateTurbo(playedNumbers, winningNumbers, 3);
    
    case 'Twosûrs:Turbo4':
    case 'Twosûrs:Turbo4DoubleChance':
      // RÈGLE : Les 2 numéros doivent être dans les 4 PREMIERS tirés
      return validateTurbo(playedNumbers, winningNumbers, 4);
    
    // === PERMUTATIONS ===
    case 'Permutations:Directe':
    case 'Permutations:DirecteDoubleChance':
      // RÈGLE : Au moins 2 numéros trouvés parmi ceux choisis
      return validatePermutation(playedNumbers, winningNumbers, playedNumbers.length);
    
    case 'Permutations:Turbo2':
    case 'Permutations:Turbo2DoubleChance':
      // RÈGLE : Au moins 2 numéros trouvés dans les 2 PREMIERS tirés
      return validateTurboPermutation(playedNumbers, winningNumbers, 2);
    
    case 'Permutations:Turbo3':
    case 'Permutations:Turbo3DoubleChance':
      // RÈGLE : Au moins 2 numéros trouvés dans les 3 PREMIERS tirés
      return validateTurboPermutation(playedNumbers, winningNumbers, 3);
    
    case 'Permutations:Turbo4':
    case 'Permutations:Turbo4DoubleChance':
      // RÈGLE : Au moins 2 numéros trouvés dans les 4 PREMIERS tirés
      return validateTurboPermutation(playedNumbers, winningNumbers, 4);
    
    // === DOUBLE NUMBER ===
    case 'DoubleNumber:Directe':
    case 'DoubleNumber:DirecteDoubleChance':
      // RÈGLE : Permutation de 8 avec tous les doubles, au moins 2 trouvés
      return validateDoubleNumber(playedNumbers, winningNumbers);
    
    case 'DoubleNumber:Turbo2':
    case 'DoubleNumber:Turbo2DoubleChance':
      // RÈGLE : Au moins 2 doubles trouvés dans les 2 PREMIERS tirés
      return validateDoubleNumberTurbo(playedNumbers, winningNumbers, 2);
    
    case 'DoubleNumber:Turbo3':
    case 'DoubleNumber:Turbo3DoubleChance':
      // RÈGLE : Au moins 2 doubles trouvés dans les 3 PREMIERS tirés
      return validateDoubleNumberTurbo(playedNumbers, winningNumbers, 3);
    
    case 'DoubleNumber:Turbo4':
    case 'DoubleNumber:Turbo4DoubleChance':
      // RÈGLE : Au moins 2 doubles trouvés dans les 4 PREMIERS tirés
      return validateDoubleNumberTurbo(playedNumbers, winningNumbers, 4);
    
    // === ANAGRAMME SIMPLE ===
    case 'Annagrammesimple:Directe':
    case 'Annagrammesimple:AnnagrammesimpleDoubleChance':
      return validateAnagrammeSimple(playedNumbers, winningNumbers);
  }
  
  // Fallback pour les anciennes formules sans typeJeu
  switch (formuleClean) {
    case 'Directe':
    case 'DirecteDoubleChance':
      // Fallback : traiter comme First BK Directe
      return validateDirecte(playedNumbers, winningNumbers);
    
    case 'Position1':
      return validatePosition(playedNumbers, winningNumbers, 1);
    
    case 'Position2':
      return validatePosition(playedNumbers, winningNumbers, 2);
    
    case 'Position3':
      return validatePosition(playedNumbers, winningNumbers, 3);
    
    case 'Position4':
      return validatePosition(playedNumbers, winningNumbers, 4);
    
    case 'Position5':
      return validatePosition(playedNumbers, winningNumbers, 5);
    
    case 'NAP3':
    case 'NAP3DoubleChance':
      return validateNAP(playedNumbers, winningNumbers, 3);
    
    case 'NAP4':
    case 'NAP4DoubleChance':
      return validateNAP(playedNumbers, winningNumbers, 4);
    
    case 'NAP5':
    case 'NAP5DoubleChance':
      return validateNAP(playedNumbers, winningNumbers, 5);
    
    case 'Turbo2':
    case 'Turbo2DoubleChance':
      // Fallback : traiter comme Two Sure Turbo2
      return validateTurbo(playedNumbers, winningNumbers, 2);
    
    case 'Turbo3':
    case 'Turbo3DoubleChance':
      // Fallback : traiter comme Two Sure Turbo3
      return validateTurbo(playedNumbers, winningNumbers, 3);
    
    case 'Turbo4':
    case 'Turbo4DoubleChance':
      // Fallback : traiter comme Two Sure Turbo4
      return validateTurbo(playedNumbers, winningNumbers, 4);
    
    case 'AnnagrammesimpleDoubleChance':
      return validateAnagrammeSimple(playedNumbers, winningNumbers);
    
    default:
      console.log(`    ❌ COMBINAISON NON RECONNUE: "${combinaison}"`);
      console.log(`    📝 Formats attendus: "typeJeu:formule" ou formule seule`);
      console.log(`    📋 typeJeu possibles: FirstouonBK, NAP, Twosûrs, Permutations, DoubleNumber, Annagrammesimple`);
      console.log(`    📋 formules possibles: Directe, Position1-5, NAP3-5, Turbo2-4, DirecteDoubleChance, etc.`);
      return false;
  }
}

// === FONCTIONS DE VALIDATION SPÉCIFIQUES - TOUTES CORRIGÉES ===

/**
 * Validation Directe - CORRIGÉE selon les vraies règles métier
 * Pour First BK : Le numéro doit être PARMI les numéros tirés (pas en ordre exact)
 * Pour Two Sure : Les deux numéros doivent TOUS être parmi les numéros tirés
 * Pour Permutations : Au moins 2 numéros trouvés parmi ceux choisis
 */
function validateDirecte(playedNumbers, winningNumbers) {
  console.log(`    🔍 Directe: [${playedNumbers.join(', ')}] dans [${winningNumbers.join(', ')}]`);
  
  // RÈGLE CORRECTE : Tous les numéros joués doivent être PARMI les gagnants
  const allFound = playedNumbers.every(num => winningNumbers.includes(num));
  
  console.log(`    ${allFound ? '✅' : '❌'} Tous les numéros ${allFound ? 'trouvés' : 'non trouvés'} parmi les tirés`);
  
  if (allFound) {
    const foundNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
    console.log(`    📊 Numéros trouvés: [${foundNumbers.join(', ')}]`);
  }
  
  return allFound;
}

/**
 * Validation Position - vérifier si les numéros sont à la bonne position
 */
function validatePosition(playedNumbers, winningNumbers, position) {
  console.log(`    🔍 Position ${position}: [${playedNumbers.join(', ')}] vs position ${position-1}`);
  
  const index = position - 1;
  if (index >= winningNumbers.length) {
    console.log(`    ❌ Position ${position} n'existe pas (seulement ${winningNumbers.length} résultats)`);
    return false;
  }
  
  const targetNumber = winningNumbers[index];
  const isValid = playedNumbers.includes(targetNumber);
  
  console.log(`    ${isValid ? '✅' : '❌'} Numéro à la position ${position}: ${targetNumber} ${isValid ? 'trouvé' : 'non trouvé'}`);
  
  return isValid;
}

/**
 * Validation NAP - tous les numéros joués doivent être dans les gagnants
 */
function validateNAP(playedNumbers, winningNumbers, requiredCount) {
  console.log(`    🔍 NAP ${requiredCount}: [${playedNumbers.join(', ')}] dans [${winningNumbers.join(', ')}]`);
  
  if (playedNumbers.length !== requiredCount) {
    console.log(`    ❌ Mauvais nombre de numéros: ${playedNumbers.length} au lieu de ${requiredCount}`);
    return false;
  }
  
  const allFound = playedNumbers.every(num => winningNumbers.includes(num));
  
  console.log(`    ${allFound ? '✅' : '❌'} Tous les numéros NAP ${allFound ? 'trouvés' : 'non trouvés'}`);
  
  if (allFound) {
    console.log(`    📊 Numéros NAP trouvés: [${playedNumbers.join(', ')}]`);
  }
  
  return allFound;
}

/**
 * Validation NAP avec permutation
 */
function validateNAPPerm(playedNumbers, winningNumbers, napCount, permCount) {
  console.log(`    🔍 NAP ${napCount} Perm ${permCount}: [${playedNumbers.join(', ')}] dans [${winningNumbers.join(', ')}]`);
  
  if (playedNumbers.length !== permCount) {
    console.log(`    ❌ Mauvais nombre de numéros: ${playedNumbers.length} au lieu de ${permCount}`);
    return false;
  }
  
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  const isValid = matchingNumbers.length >= napCount;
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length} correspondances (min NAP: ${napCount})`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Turbo - CORRIGÉE selon les vraies règles métier
 * Turbo2 : Les numéros doivent être dans les 2 PREMIERS tirés
 * Turbo3 : Les numéros doivent être dans les 3 PREMIERS tirés  
 * Turbo4 : Les numéros doivent être dans les 4 PREMIERS tirés
 */
function validateTurbo(playedNumbers, winningNumbers, topCount) {
  console.log(`    🔍 Turbo ${topCount}: [${playedNumbers.join(', ')}] dans les ${topCount} premiers de [${winningNumbers.join(', ')}]`);
  
  // Prendre seulement les X premiers numéros tirés
  const topWinningNumbers = winningNumbers.slice(0, topCount);
  
  console.log(`    📊 ${topCount} premiers numéros tirés: [${topWinningNumbers.join(', ')}]`);
  
  // RÈGLE CORRECTE : Les numéros joués doivent être dans les X premiers tirés
  const matchingNumbers = playedNumbers.filter(num => topWinningNumbers.includes(num));
  const isValid = matchingNumbers.length === playedNumbers.length; // TOUS les numéros joués doivent être trouvés
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length}/${playedNumbers.length} numéros trouvés dans les ${topCount} premiers`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Permutation (3-6 boules) - CORRIGÉE
 * RÈGLE : Au moins 2 numéros trouvés parmi ceux choisis
 */
function validatePermutation(playedNumbers, winningNumbers, permSize) {
  console.log(`    🔍 Permutation ${permSize}: [${playedNumbers.join(', ')}] dans [${winningNumbers.join(', ')}]`);
  
  if (playedNumbers.length !== permSize) {
    console.log(`    ❌ Mauvais nombre de numéros: ${playedNumbers.length} au lieu de ${permSize}`);
    return false;
  }
  
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  const isValid = matchingNumbers.length >= 2; // Au moins 2 boules pour gagner
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length} correspondances parmi tous les tirés (min: 2)`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Turbo pour Permutations - NOUVELLE
 * Pour permutations : Au moins 2 numéros doivent être trouvés dans les X premiers tirés
 */
function validateTurboPermutation(playedNumbers, winningNumbers, topCount) {
  console.log(`    🔍 Turbo Permutation ${topCount}: [${playedNumbers.join(', ')}] dans les ${topCount} premiers de [${winningNumbers.join(', ')}]`);
  
  // Prendre seulement les X premiers numéros tirés
  const topWinningNumbers = winningNumbers.slice(0, topCount);
  
  console.log(`    📊 ${topCount} premiers numéros tirés: [${topWinningNumbers.join(', ')}]`);
  
  // RÈGLE : Au moins 2 numéros doivent être trouvés dans les X premiers
  const matchingNumbers = playedNumbers.filter(num => topWinningNumbers.includes(num));
  const isValid = matchingNumbers.length >= 2;
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length} correspondances dans les ${topCount} premiers (min: 2)`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Permutation large (7-20 boules)
 */
function validatePermutationLarge(playedNumbers, winningNumbers, permSize) {
  console.log(`    🔍 Permutation Large ${permSize}: [${playedNumbers.join(', ')}] dans [${winningNumbers.join(', ')}]`);
  
  if (playedNumbers.length !== permSize) {
    console.log(`    ❌ Mauvais nombre de numéros: ${playedNumbers.length} au lieu de ${permSize}`);
    return false;
  }
  
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  const isValid = matchingNumbers.length >= 2; // Au moins 2 boules pour gagner
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length} correspondances (min: 2)`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Double Number - CORRIGÉE
 * RÈGLE : Permutation de 8 avec tous les doubles, au moins 2 trouvés parmi tous les tirés
 */
function validateDoubleNumber(playedNumbers, winningNumbers) {
  console.log(`    🔍 Double Number: [${playedNumbers.join(', ')}] dans [${winningNumbers.join(', ')}]`);
  
  const doubleNumbers = [11, 22, 33, 44, 55, 66, 77, 88];
  
  // Vérifier que les numéros joués sont bien des doubles
  const validDoubles = playedNumbers.filter(num => doubleNumbers.includes(num));
  if (validDoubles.length === 0) {
    console.log(`    ❌ Aucun double number valide dans: [${playedNumbers.join(', ')}]`);
    console.log(`    📝 Doubles valides: [${doubleNumbers.join(', ')}]`);
    return false;
  }
  
  console.log(`    📊 Doubles valides joués: [${validDoubles.join(', ')}]`);
  
  // RÈGLE : Au moins 2 doubles doivent être trouvés parmi tous les tirés
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  const isValid = matchingNumbers.length >= 2;
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length} correspondances parmi tous les tirés (min: 2)`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Double Number Turbo - NOUVELLE
 * Au moins 2 doubles trouvés dans les X premiers tirés
 */
function validateDoubleNumberTurbo(playedNumbers, winningNumbers, topCount) {
  console.log(`    🔍 Double Number Turbo ${topCount}: [${playedNumbers.join(', ')}] dans les ${topCount} premiers de [${winningNumbers.join(', ')}]`);
  
  const doubleNumbers = [11, 22, 33, 44, 55, 66, 77, 88];
  
  // Vérifier que les numéros joués sont bien des doubles
  const validDoubles = playedNumbers.filter(num => doubleNumbers.includes(num));
  if (validDoubles.length === 0) {
    console.log(`    ❌ Aucun double number valide dans: [${playedNumbers.join(', ')}]`);
    console.log(`    📝 Doubles valides: [${doubleNumbers.join(', ')}]`);
    return false;
  }
  
  console.log(`    📊 Doubles valides joués: [${validDoubles.join(', ')}]`);
  
  // Prendre seulement les X premiers numéros tirés
  const topWinningNumbers = winningNumbers.slice(0, topCount);
  console.log(`    📊 ${topCount} premiers numéros tirés: [${topWinningNumbers.join(', ')}]`);
  
  // RÈGLE : Au moins 2 doubles doivent être trouvés dans les X premiers
  const matchingNumbers = playedNumbers.filter(num => topWinningNumbers.includes(num));
  const isValid = matchingNumbers.length >= 2;
  
  console.log(`    ${isValid ? '✅' : '❌'} ${matchingNumbers.length} correspondances dans les ${topCount} premiers (min: 2)`);
  console.log(`    📊 Numéros trouvés: [${matchingNumbers.join(', ')}]`);
  
  return isValid;
}

/**
 * Validation Anagramme Simple - CORRIGÉE
 * 37 two sûrs réunis en un seul jeu
 */
function validateAnagrammeSimple(playedNumbers, winningNumbers) {
  console.log(`    🔍 Anagramme Simple dans: [${winningNumbers.join(', ')}]`);
  
  // Les 37 anagrammes possibles selon votre cahier des charges
  const anagrammes = [
    [1, 10], [2, 20], [3, 30], [4, 40], [5, 50], [6, 60], [7, 70], [8, 80], [9, 90],
    [10, 1], [11, 12], [12, 21], [13, 31], [14, 41], [15, 51], [16, 61], [17, 71],
    [18, 81], [19, 91], [20, 2], [21, 12], [22, 23], [23, 32], [24, 42], [25, 52],
    [26, 62], [27, 72], [28, 82], [29, 92], [30, 3], [31, 13], [32, 23], [33, 34],
    [34, 43], [35, 53], [36, 63], [37, 73]
  ];
  
  console.log(`    📊 Recherche parmi ${anagrammes.length} anagrammes possibles...`);
  
  // Vérifier si au moins un anagramme est gagnant
  const gagnants = [];
  for (const [num1, num2] of anagrammes) {
    if (winningNumbers.includes(num1) && winningNumbers.includes(num2)) {
      gagnants.push([num1, num2]);
    }
  }
  
  const isValid = gagnants.length > 0;
  
  if (isValid) {
    console.log(`    ✅ ${gagnants.length} anagramme(s) gagnant(s) trouvé(s):`);
    gagnants.forEach(([num1, num2]) => {
      console.log(`      - [${num1}, ${num2}]`);
    });
  } else {
    console.log(`    ❌ Aucun anagramme gagnant trouvé`);
  }
  
  return isValid;
}

/**
 * Fonction utilitaire pour obtenir le nombre de numéros correspondants
 * @param {Array} playedNumbers - Numéros joués
 * @param {Array} winningNumbers - Numéros gagnants
 * @returns {number} - Nombre de correspondances
 */
function getMatchingCount(playedNumbers, winningNumbers) {
  // Conversion sécurisée en entiers
  const played = playedNumbers.map(num => parseInt(num));
  const winning = winningNumbers.map(num => parseInt(num));
  
  const matchingCount = played.filter(num => winning.includes(num)).length;
  
  console.log(`📊 getMatchingCount: [${played.join(', ')}] vs [${winning.join(', ')}] = ${matchingCount} correspondances`);
  
  return matchingCount;
}

/**
 * Fonction pour valider tous les tickets d'un jeu donné
 * @param {Object} models - Modèles Sequelize
 * @param {number} gameId - ID du jeu
 * @returns {Promise<Array>} - Tickets validés
 */
async function validateGameTickets(models, gameId) {
  try {
    console.log(`🎯 validateGameTickets pour le jeu ${gameId}`);
    
    // Récupérer le jeu et son résultat
    const game = await models.Game.findByPk(gameId, {
      include: [{
        model: models.Result,
        as: 'result'
      }]
    });
    
    if (!game || !game.result) {
      throw new Error('Jeu ou résultat non trouvé');
    }
    
    console.log(`🎮 Jeu trouvé: ${game.nom} (doubleChance: ${game.doubleChance})`);
    console.log(`🎲 Résultat: ${game.result.numbers}${game.result.numbers2 ? ` / ${game.result.numbers2}` : ''}`);
    
    // Récupérer tous les tickets en attente pour ce jeu
    const tickets = await models.Ticket.findAll({
      where: {
        nomJeu: game.nom,
        statut: 'en attente'
      }
    });
    
    if (tickets.length === 0) {
      console.log(`ℹ️ Aucun ticket en attente pour le jeu ${game.nom}`);
      return [];
    }
    
    console.log(`📊 ${tickets.length} ticket(s) en attente trouvé(s)`);
    
    // Valider les tickets
    const validatedTickets = validateTickets(tickets, game.result, game);
    
    // Mettre à jour le statut des tickets en base
    for (const ticket of validatedTickets) {
      await models.Ticket.update(
        { statut: ticket.statut },
        { where: { id: ticket.id } }
      );
    }
    
    const validesCount = validatedTickets.filter(t => t.statut === 'validé').length;
    const invalidesCount = validatedTickets.filter(t => t.statut === 'invalidé').length;
    
    console.log(`🏆 Validation terminée: ${validesCount} validés, ${invalidesCount} invalidés`);
    
    return validatedTickets;
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation des tickets:', error);
    throw error;
  }
}

module.exports = {
  validateTickets,
  validateSingleTicket,
  validateGameTickets,
  getMatchingCount
};