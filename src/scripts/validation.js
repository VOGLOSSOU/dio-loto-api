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
  const playedNumbers = Array.isArray(numerosJoues) ? numerosJoues : JSON.parse(numerosJoues);
  
  // Gestion de la double chance
  if (game.doubleChance && winningNumbers2) {
    const winInFirst = validateByFormula(formule, playedNumbers, winningNumbers);
    const winInSecond = validateByFormula(formule, playedNumbers, winningNumbers2);
    return winInFirst || winInSecond;
  }
  
  return validateByFormula(formule, playedNumbers, winningNumbers);
}

/**
 * Validation selon la formule de jeu
 * @param {string} formule - Formule de jeu
 * @param {Array} playedNumbers - Numéros joués
 * @param {Array} winningNumbers - Numéros gagnants
 * @returns {boolean} - true si gagnant selon la formule
 */
function validateByFormula(formule, playedNumbers, winningNumbers) {
  switch (formule.toLowerCase()) {
    // === FIRST OU BK ===
    case 'directe':
      return validateDirecte(playedNumbers, winningNumbers);
    
    case 'position 1':
      return validatePosition(playedNumbers, winningNumbers, 1);
    
    case 'position 2':
      return validatePosition(playedNumbers, winningNumbers, 2);
    
    case 'position 3':
      return validatePosition(playedNumbers, winningNumbers, 3);
    
    case 'position 4':
      return validatePosition(playedNumbers, winningNumbers, 4);
    
    case 'position 5':
      return validatePosition(playedNumbers, winningNumbers, 5);
    
    // === NAP ===
    case 'nap 3':
      return validateNAP(playedNumbers, winningNumbers, 3);
    
    case 'nap 3 perm 4':
      return validateNAPPerm(playedNumbers, winningNumbers, 3, 4);
    
    case 'nap 3 perm 5':
      return validateNAPPerm(playedNumbers, winningNumbers, 3, 5);
    
    case 'nap 4':
      return validateNAP(playedNumbers, winningNumbers, 4);
    
    case 'nap 4 perm 5':
      return validateNAPPerm(playedNumbers, winningNumbers, 4, 5);
    
    case 'nap 5':
      return validateNAP(playedNumbers, winningNumbers, 5);
    
    // === TWO SÛRS ===
    case 'two sûr directe':
      return validateTwoSurDirecte(playedNumbers, winningNumbers);
    
    case 'turbo 2':
      return validateTurbo(playedNumbers, winningNumbers, 2);
    
    case 'turbo 3':
      return validateTurbo(playedNumbers, winningNumbers, 3);
    
    case 'turbo 4':
      return validateTurbo(playedNumbers, winningNumbers, 4);
    
    // === PERMUTATIONS ===
    case 'perm 3':
      return validatePermutation(playedNumbers, winningNumbers, 3);
    
    case 'perm 4':
      return validatePermutation(playedNumbers, winningNumbers, 4);
    
    case 'perm 5':
      return validatePermutation(playedNumbers, winningNumbers, 5);
    
    case 'perm 6':
      return validatePermutation(playedNumbers, winningNumbers, 6);
    
    case 'perm 7':
    case 'perm 8':
    case 'perm 9':
    case 'perm 10':
    case 'perm 11':
    case 'perm 12':
    case 'perm 13':
    case 'perm 14':
    case 'perm 15':
    case 'perm 16':
    case 'perm 17':
    case 'perm 18':
    case 'perm 19':
    case 'perm 20':
      const permSize = parseInt(formule.split(' ')[1]);
      return validatePermutationLarge(playedNumbers, winningNumbers, permSize);
    
    // === AUTRES FORMULES ===
    case 'double number':
      return validateDoubleNumber(playedNumbers, winningNumbers);
    
    case 'anagramme simple':
      return validateAnagrammeSimple(playedNumbers, winningNumbers);
    
    default:
      console.warn(`Formule non reconnue: ${formule}`);
      return false;
  }
}

// === FONCTIONS DE VALIDATION SPÉCIFIQUES ===

/**
 * Validation Directe - les numéros doivent sortir dans l'ordre exact
 */
function validateDirecte(playedNumbers, winningNumbers) {
  if (playedNumbers.length !== winningNumbers.length) return false;
  
  for (let i = 0; i < playedNumbers.length; i++) {
    if (playedNumbers[i] !== winningNumbers[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Validation Position - vérifier si les numéros sont à la bonne position
 */
function validatePosition(playedNumbers, winningNumbers, position) {
  // Position 1 = index 0, Position 2 = index 1, etc.
  const index = position - 1;
  
  if (index >= winningNumbers.length) return false;
  
  return playedNumbers.includes(winningNumbers[index]);
}

/**
 * Validation NAP - tous les numéros joués doivent être dans les gagnants
 */
function validateNAP(playedNumbers, winningNumbers, requiredCount) {
  if (playedNumbers.length !== requiredCount) return false;
  
  return playedNumbers.every(num => winningNumbers.includes(num));
}

/**
 * Validation NAP avec permutation
 */
function validateNAPPerm(playedNumbers, winningNumbers, napCount, permCount) {
  if (playedNumbers.length !== permCount) return false;
  
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  return matchingNumbers.length >= napCount;
}

/**
 * Validation Two Sûr Directe - exactement 2 numéros dans l'ordre
 */
function validateTwoSurDirecte(playedNumbers, winningNumbers) {
  if (playedNumbers.length !== 2) return false;
  
  // Vérifier si les 2 numéros sont consécutifs dans les résultats
  for (let i = 0; i < winningNumbers.length - 1; i++) {
    if (winningNumbers[i] === playedNumbers[0] && winningNumbers[i + 1] === playedNumbers[1]) {
      return true;
    }
  }
  return false;
}

/**
 * Validation Turbo - au moins N numéros doivent être trouvés
 */
function validateTurbo(playedNumbers, winningNumbers, minRequired) {
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  return matchingNumbers.length >= minRequired;
}

/**
 * Validation Permutation (3-6 boules)
 */
function validatePermutation(playedNumbers, winningNumbers, permSize) {
  if (playedNumbers.length !== permSize) return false;
  
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  
  // Au moins 2 boules doivent être trouvées pour gagner
  return matchingNumbers.length >= 2;
}

/**
 * Validation Permutation large (7-20 boules)
 */
function validatePermutationLarge(playedNumbers, winningNumbers, permSize) {
  if (playedNumbers.length !== permSize) return false;
  
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  
  // Au moins 2 boules doivent être trouvées pour gagner
  return matchingNumbers.length >= 2;
}

/**
 * Validation Double Number - perm de 8 avec tous les doubles
 */
function validateDoubleNumber(playedNumbers, winningNumbers) {
  const doubleNumbers = [11, 22, 33, 44, 55, 66, 77, 88];
  
  // Vérifier que les numéros joués sont bien des doubles
  const validDoubles = playedNumbers.filter(num => doubleNumbers.includes(num));
  if (validDoubles.length === 0) return false;
  
  // Appliquer les règles de permutation
  const matchingNumbers = playedNumbers.filter(num => winningNumbers.includes(num));
  return matchingNumbers.length >= 2;
}

/**
 * Validation Anagramme Simple - 37 two sûrs réunis
 */
function validateAnagrammeSimple(playedNumbers, winningNumbers) {
  // Les 37 anagrammes possibles en loto
  const anagrammes = [
    [1, 10], [2, 20], [3, 30], [4, 40], [5, 50], [6, 60], [7, 70], [8, 80], [9, 90],
    [10, 1], [11, 12], [12, 21], [13, 31], [14, 41], [15, 51], [16, 61], [17, 71],
    [18, 81], [19, 91], [20, 2], [21, 12], [22, 23], [23, 32], [24, 42], [25, 52],
    [26, 62], [27, 72], [28, 82], [29, 92], [30, 3], [31, 13], [32, 23], [33, 34],
    [34, 43], [35, 53], [36, 63], [37, 73]
  ];
  
  // Vérifier si au moins un anagramme est gagnant
  for (const [num1, num2] of anagrammes) {
    if (winningNumbers.includes(num1) && winningNumbers.includes(num2)) {
      return true;
    }
  }
  return false;
}

/**
 * Fonction utilitaire pour obtenir le nombre de numéros correspondants
 * Utile pour calculer les gains selon le nombre de boules trouvées
 */
function getMatchingCount(playedNumbers, winningNumbers) {
  return playedNumbers.filter(num => winningNumbers.includes(num)).length;
}

/**
 * Fonction pour valider tous les tickets d'un jeu donné
 * @param {Object} models - Modèles Sequelize
 * @param {number} gameId - ID du jeu
 * @returns {Promise<Array>} - Tickets validés
 */
async function validateGameTickets(models, gameId) {
  try {
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
    
    // Récupérer tous les tickets en attente pour ce jeu
    const tickets = await models.Ticket.findAll({
      where: {
        nomJeu: game.nom,
        statut: 'en attente'
      }
    });
    
    if (tickets.length === 0) {
      return [];
    }
    
    // Valider les tickets
    const validatedTickets = validateTickets(tickets, game.result, game);
    
    // Mettre à jour le statut des tickets en base
    for (const ticket of validatedTickets) {
      await models.Ticket.update(
        { statut: ticket.statut },
        { where: { id: ticket.id } }
      );
    }
    
    return validatedTickets;
    
  } catch (error) {
    console.error('Erreur lors de la validation des tickets:', error);
    throw error;
  }
}

module.exports = {
  validateTickets,
  validateSingleTicket,
  validateGameTickets,
  getMatchingCount
};