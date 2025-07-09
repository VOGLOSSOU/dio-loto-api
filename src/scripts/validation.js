/**
 * VALIDATION.JS - LOGIQUE DE VALIDATION COMPLÈTEMENT CORRIGÉE
 *
 * ⚠️ ATTENTION : Cette version est alignée à 100% avec le frontend gameCalculations.ts
 *
 * === FORMATS FRONTEND EXACTS ===
 * - typeJeu: "FirstouonBK" | "NAP" | "Twosûrs" | "Permutations" | "DoubleNumber" | "Annagrammesimple"
 * - formule: "Directe" | "Position1-5" | "NAP3-5" | "Turbo2-4" | "*DoubleChance"
 *
 * === RÈGLES MÉTIER STRICTES ===
 * - First BK Directe: 1 numéro parmi les tirés
 * - Two Sure Directe: 2 numéros TOUS parmi les tirés
 * - Permutation Directe: Au moins 2 trouvés parmi plusieurs
 * - NAP: TOUS les numéros NAP dans les tirés (ordre non important)
 * - Turbo: Dans les X premiers tirés
 * - Double chance: Validation sur Win OU Machine
 *
 * === TYPES SPÉCIAUX AUTOMATIQUES ===
 * - DoubleNumber: 8 doubles [11,22,33,44,55,66,77,88] + TOUTES LES FORMULES
 * - Annagrammesimple: 37 binômes automatiques + TOUTES LES FORMULES
 */

/**
 * Fonction principale de validation des tickets
 * @param {Array} tickets - Liste des tickets à valider
 * @param {Object} result - Résultat du jeu avec numbers et numbers2 pour double chance
 * @param {Object} game - Informations du jeu
 * @returns {Array} - Liste des tickets avec leur statut de validation
 */
function validateTickets(tickets, result, game) {
  const winningNumbers = result.numbers.split(",").map((num) => Number.parseInt(num.trim()))
  const winningNumbers2 = result.numbers2 ? result.numbers2.split(",").map((num) => Number.parseInt(num.trim())) : null

  console.log(`🎯 validateTickets: ${tickets.length} tickets à valider`)
  console.log(`🎲 Numéros gagnants principaux (Win): [${winningNumbers.join(", ")}]`)
  if (winningNumbers2) {
    console.log(`🎲 Numéros gagnants secondaires (Machine): [${winningNumbers2.join(", ")}]`)
  }

  return tickets.map((ticket) => {
    const isWinning = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game)
    return {
      ...ticket,
      statut: isWinning ? "validé" : "invalidé",
      isWinning,
    }
  })
}

/**
 * Validation d'un ticket individuel - FONCTION PRINCIPALE CORRIGÉE
 * @param {Object} ticket - Le ticket à valider
 * @param {Array} winningNumbers - Numéros gagnants principaux (Win)
 * @param {Array|null} winningNumbers2 - Numéros gagnants secondaires (Machine)
 * @param {Object} game - Informations du jeu
 * @returns {boolean} - true si gagnant, false sinon
 */
function validateSingleTicket(ticket, winningNumbers, winningNumbers2, game) {
  const { formule, typeJeu } = ticket

  // ✅ PARSING CORRIGÉ - Gérer les cas où numerosJoues est une chaîne JSON ou un tableau
  let playedNumbers = []
  try {
    if (Array.isArray(ticket.numerosJoues)) {
      // Cas où c'est déjà un tableau (getter Sequelize)
      playedNumbers = ticket.numerosJoues.map((num) => Number.parseInt(num))
    } else if (typeof ticket.numerosJoues === 'string') {
      // Cas où c'est une chaîne JSON (stockage brut en base)
      const parsed = JSON.parse(ticket.numerosJoues)
      if (Array.isArray(parsed)) {
        playedNumbers = parsed.map((num) => Number.parseInt(num))
      } else {
        console.warn(`⚠️ numerosJoues parsé n'est pas un tableau pour ticket ${ticket.id}:`, parsed)
        return false
      }
    } else {
      console.warn(`⚠️ numerosJoues format inconnu pour ticket ${ticket.id}:`, ticket.numerosJoues)
      return false
    }
  } catch (error) {
    console.error(`❌ Erreur parsing numerosJoues pour ticket ${ticket.id}:`, error)
    return false
  }

  console.log(`\n🔍 === VALIDATION TICKET ${ticket.numeroTicket} ===`)
  console.log(`📋 Type de jeu: "${typeJeu}"`)
  console.log(`📋 Formule: "${formule}"`)

  // NOTE SPÉCIALE pour les types automatiques
  if (typeJeu === "DoubleNumber") {
    console.log(`🎯 Numéros automatiques: [11,22,33,44,55,66,77,88] (applique formule "${formule}")`)
  } else if (typeJeu === "Annagrammesimple") {
    console.log(`🎯 Binômes automatiques: 37 paires (applique formule "${formule}")`)
  } else {
    console.log(`🎯 Numéros joués: [${playedNumbers.join(", ")}]`)
  }

  console.log(`🎲 Numéros gagnants Win: [${winningNumbers.join(", ")}]`)
  if (winningNumbers2) {
    console.log(`🎲 Numéros gagnants Machine: [${winningNumbers2.join(", ")}]`)
  }

  // Gestion de la double chance
  if (game.doubleChance && winningNumbers2) {
    console.log(`🔄 Mode double chance activé - Test sur Win ET Machine`)

    const winInWin = validateByFormula(formule, playedNumbers, winningNumbers, typeJeu)
    const winInMachine = validateByFormula(formule, playedNumbers, winningNumbers2, typeJeu)

    console.log(`📊 Résultat Win: ${winInWin ? "GAGNANT" : "PERDANT"}`)
    console.log(`📊 Résultat Machine: ${winInMachine ? "GAGNANT" : "PERDANT"}`)

    const finalResult = winInWin || winInMachine
    console.log(`🏆 RÉSULTAT FINAL DOUBLE CHANCE: ${finalResult ? "GAGNANT" : "PERDANT"}`)

    return finalResult
  }

  const result = validateByFormula(formule, playedNumbers, winningNumbers, typeJeu)
  console.log(`🏆 RÉSULTAT FINAL: ${result ? "GAGNANT" : "PERDANT"}`)

  return result
}

/**
 * Validation selon la formule de jeu - COMPLÈTEMENT CORRIGÉE
 * @param {string} formule - Formule de jeu (exactement comme envoyée par le frontend)
 * @param {Array} playedNumbers - Numéros joués
 * @param {Array} winningNumbers - Numéros gagnants
 * @param {string} typeJeu - Type de jeu (exactement comme envoyé par le frontend)
 * @returns {boolean} - true si gagnant selon la formule
 */
function validateByFormula(formule, playedNumbers, winningNumbers, typeJeu = null) {
  const formuleClean = formule.trim()
  console.log(`  🎯 Validation: typeJeu="${typeJeu}" + formule="${formule}"`)

  // Construire la combinaison exacte comme le frontend
  const combinaison = typeJeu ? `${typeJeu}:${formuleClean}` : formuleClean
  console.log(`  🔍 Combinaison testée: "${combinaison}"`)

  // VALIDATION BASÉE SUR TOUS LES CAS POSSIBLES DU FRONTEND
  switch (combinaison) {
    // ==========================================
    // === FIRSTOUONBK (exactement du frontend)
    // ==========================================
    case "FirstouonBK:Directe":
      return validateFirstBKDirecte(playedNumbers, winningNumbers)

    case "FirstouonBK:Position1":
      return validatePosition(playedNumbers, winningNumbers, 1)

    case "FirstouonBK:Position2":
      return validatePosition(playedNumbers, winningNumbers, 2)

    case "FirstouonBK:Position3":
      return validatePosition(playedNumbers, winningNumbers, 3)

    case "FirstouonBK:Position4":
      return validatePosition(playedNumbers, winningNumbers, 4)

    case "FirstouonBK:Position5":
      return validatePosition(playedNumbers, winningNumbers, 5)

    // ==========================================
    // === NAP (exactement du frontend)
    // ==========================================
    case "NAP:NAP3":
      return validateNAP(playedNumbers, winningNumbers, 3)

    case "NAP:NAP4":
      return validateNAP(playedNumbers, winningNumbers, 4)

    case "NAP:NAP5":
      return validateNAP(playedNumbers, winningNumbers, 5)

    case "NAP:NAP3DoubleChance":
      return validateNAPDoubleChance(playedNumbers, winningNumbers, 3)

    case "NAP:NAP4DoubleChance":
      return validateNAPDoubleChance(playedNumbers, winningNumbers, 4)

    case "NAP:NAP5DoubleChance":
      return validateNAPDoubleChance(playedNumbers, winningNumbers, 5)

    // ==========================================
    // === TWOSÛRS (avec accent circonflexe exact du frontend)
    // ==========================================
    case "Twosûrs:Directe":
      return validateTwoSureDirecte(playedNumbers, winningNumbers)

    case "Twosûrs:Turbo2":
      return validateTurbo(playedNumbers, winningNumbers, 2)

    case "Twosûrs:Turbo3":
      return validateTurbo(playedNumbers, winningNumbers, 3)

    case "Twosûrs:Turbo4":
      return validateTurbo(playedNumbers, winningNumbers, 4)

    case "Twosûrs:Turbo2DoubleChance":
      return validateTurbo(playedNumbers, winningNumbers, 2)

    case "Twosûrs:Turbo3DoubleChance":
      return validateTurbo(playedNumbers, winningNumbers, 3)

    case "Twosûrs:Turbo4DoubleChance":
      return validateTurbo(playedNumbers, winningNumbers, 4)

    // ==========================================
    // === PERMUTATIONS (exactement du frontend)
    // ==========================================
    case "Permutations:Directe":
      return validatePermutation(playedNumbers, winningNumbers)

    case "Permutations:Turbo2":
      return validateTurboPermutation(playedNumbers, winningNumbers, 2)

    case "Permutations:Turbo3":
      return validateTurboPermutation(playedNumbers, winningNumbers, 3)

    case "Permutations:Turbo4":
      return validateTurboPermutation(playedNumbers, winningNumbers, 4)

    case "Permutations:DirecteDoubleChance":
      return validatePermutation(playedNumbers, winningNumbers)

    case "Permutations:Turbo2DoubleChance":
      return validateTurboPermutation(playedNumbers, winningNumbers, 2)

    case "Permutations:Turbo3DoubleChance":
      return validateTurboPermutation(playedNumbers, winningNumbers, 3)

    case "Permutations:Turbo4DoubleChance":
      return validateTurboPermutation(playedNumbers, winningNumbers, 4)

    // ==========================================
    // === DOUBLENUMBER (applique la formule aux 8 doubles automatiques)
    // ==========================================
    case "DoubleNumber:Directe":
      return validateDoubleNumberFormula(winningNumbers, "Directe")

    case "DoubleNumber:Turbo2":
      return validateDoubleNumberFormula(winningNumbers, "Turbo2")

    case "DoubleNumber:Turbo3":
      return validateDoubleNumberFormula(winningNumbers, "Turbo3")

    case "DoubleNumber:Turbo4":
      return validateDoubleNumberFormula(winningNumbers, "Turbo4")

    case "DoubleNumber:Turbo2DoubleChance":
      return validateDoubleNumberFormula(winningNumbers, "Turbo2")

    case "DoubleNumber:Turbo3DoubleChance":
      return validateDoubleNumberFormula(winningNumbers, "Turbo3")

    case "DoubleNumber:Turbo4DoubleChance":
      return validateDoubleNumberFormula(winningNumbers, "Turbo4")

    // ==========================================
    // === ANNAGRAMMESIMPLE (applique la formule aux 37 binômes automatiques)
    // ==========================================
    case "Annagrammesimple:Directe":
      return validateAnagrammeFormula(winningNumbers, "Directe")

    case "Annagrammesimple:Turbo2":
      return validateAnagrammeFormula(winningNumbers, "Turbo2")

    case "Annagrammesimple:Turbo3":
      return validateAnagrammeFormula(winningNumbers, "Turbo3")

    case "Annagrammesimple:Turbo4":
      return validateAnagrammeFormula(winningNumbers, "Turbo4")

    case "Annagrammesimple:DirecteDoubleChance":
      return validateAnagrammeFormula(winningNumbers, "Directe")

    case "Annagrammesimple:Turbo2DoubleChance":
      return validateAnagrammeFormula(winningNumbers, "Turbo2")

    case "Annagrammesimple:Turbo3DoubleChance":
      return validateAnagrammeFormula(winningNumbers, "Turbo3")

    case "Annagrammesimple:Turbo4DoubleChance":
      return validateAnagrammeFormula(winningNumbers, "Turbo4")

    case "Annagrammesimple:AnnagrammesimpleDoubleChance":
      return validateAnagrammeFormula(winningNumbers, "Directe")

    // ==========================================
    // === FALLBACK POUR COMPATIBILITÉ (formules sans typeJeu)
    // ==========================================
    default:
      console.log(`  📝 Pas de match exact, test fallback pour: "${formuleClean}"`)

      switch (formuleClean) {
        // === FORMULES DIRECTES ===
        case "Directe":
          // Auto-détection intelligente selon le nombre de numéros
          if (playedNumbers.length === 1) {
            console.log(`    📝 Fallback: 1 numéro → First BK Directe`)
            return validateFirstBKDirecte(playedNumbers, winningNumbers)
          } else if (playedNumbers.length === 2) {
            console.log(`    📝 Fallback: 2 numéros → Two Sure Directe`)
            return validateTwoSureDirecte(playedNumbers, winningNumbers)
          } else {
            console.log(`    📝 Fallback: ${playedNumbers.length} numéros → Permutation`)
            return validatePermutation(playedNumbers, winningNumbers)
          }

        case "DirecteDoubleChance":
          // Même logique que Directe
          if (playedNumbers.length === 1) {
            return validateFirstBKDirecte(playedNumbers, winningNumbers)
          } else if (playedNumbers.length === 2) {
            return validateTwoSureDirecte(playedNumbers, winningNumbers)
          } else {
            return validatePermutation(playedNumbers, winningNumbers)
          }

        // === POSITIONS ===
        case "Position1":
          return validatePosition(playedNumbers, winningNumbers, 1)
        case "Position2":
          return validatePosition(playedNumbers, winningNumbers, 2)
        case "Position3":
          return validatePosition(playedNumbers, winningNumbers, 3)
        case "Position4":
          return validatePosition(playedNumbers, winningNumbers, 4)
        case "Position5":
          return validatePosition(playedNumbers, winningNumbers, 5)

        // === NAP ===
        case "NAP3":
          return validateNAP(playedNumbers, winningNumbers, 3)
        case "NAP4":
          return validateNAP(playedNumbers, winningNumbers, 4)
        case "NAP5":
          return validateNAP(playedNumbers, winningNumbers, 5)
        case "NAP3DoubleChance":
          return validateNAPDoubleChance(playedNumbers, winningNumbers, 3)
        case "NAP4DoubleChance":
          return validateNAPDoubleChance(playedNumbers, winningNumbers, 4)
        case "NAP5DoubleChance":
          return validateNAPDoubleChance(playedNumbers, winningNumbers, 5)

        // === TURBOS ===
        case "Turbo2":
          // Auto-détection : 2 numéros = Two Sure, plus = Permutation
          if (playedNumbers.length === 2) {
            console.log(`    📝 Fallback: 2 numéros → Two Sure Turbo2`)
            return validateTurbo(playedNumbers, winningNumbers, 2)
          } else {
            console.log(`    📝 Fallback: ${playedNumbers.length} numéros → Permutation Turbo2`)
            return validateTurboPermutation(playedNumbers, winningNumbers, 2)
          }

        case "Turbo3":
          if (playedNumbers.length === 2) {
            return validateTurbo(playedNumbers, winningNumbers, 3)
          } else {
            return validateTurboPermutation(playedNumbers, winningNumbers, 3)
          }

        case "Turbo4":
          if (playedNumbers.length === 2) {
            return validateTurbo(playedNumbers, winningNumbers, 4)
          } else {
            return validateTurboPermutation(playedNumbers, winningNumbers, 4)
          }

        case "Turbo2DoubleChance":
        case "Turbo3DoubleChance":
        case "Turbo4DoubleChance":
          const turboNum = Number.parseInt(formuleClean.replace(/[^0-9]/g, ""))
          if (playedNumbers.length === 2) {
            return validateTurbo(playedNumbers, winningNumbers, turboNum)
          } else if (playedNumbers.length === 8) {
            return validateDoubleNumberFormula(winningNumbers, `Turbo${turboNum}`)
          } else if (playedNumbers.length === 74) {
            return validateAnagrammeFormula(winningNumbers, `Turbo${turboNum}`)
          } else {
            return validateTurboPermutation(playedNumbers, winningNumbers, turboNum)
          }

        // === ANAGRAMME - Fallback avec détection de formule ===
        case "AnnagrammesimpleDoubleChance":
          return validateAnagrammeFormula(winningNumbers, "Directe")

        default:
          console.log(`    ❌ FORMULE NON RECONNUE: "${combinaison}"`)
          console.log(`    📝 typeJeu reçu: "${typeJeu}"`)
          console.log(`    📝 formule reçue: "${formule}"`)
          console.log(`    📝 Formats attendus du frontend:`)
          console.log(`    📋 BetTypes: FirstouonBK, NAP, Twosûrs, Permutations, DoubleNumber, Annagrammesimple`)
          console.log(`    📋 Formules: Directe, Position1-5, NAP3-5, Turbo2-4, *DoubleChance`)
          return false
      }
  }
}

// ==========================================
// === FONCTIONS DE VALIDATION SPÉCIFIQUES - TOUTES CORRIGÉES
// ==========================================

/**
 * Validation First BK Directe - RÈGLE STRICTE
 * RÈGLE : UN SEUL numéro qui doit être PARMI les numéros tirés
 */
function validateFirstBKDirecte(playedNumbers, winningNumbers) {
  console.log(`    🔍 First BK Directe: [${playedNumbers.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  // Vérification stricte : exactement 1 numéro
  if (playedNumbers.length !== 1) {
    console.log(`    ❌ First BK Directe exige exactement 1 numéro (reçu: ${playedNumbers.length})`)
    return false
  }

  const playedNumber = playedNumbers[0]
  const isFound = winningNumbers.includes(playedNumber)

  console.log(
    `    ${isFound ? "✅" : "❌"} Numéro ${playedNumber} ${isFound ? "trouvé" : "NON trouvé"} parmi les tirés`,
  )

  if (isFound) {
    const position = winningNumbers.indexOf(playedNumber) + 1
    console.log(`    📊 ✅ Numéro trouvé à la position ${position}`)
  }

  return isFound
}

/**
 * Validation Two Sure Directe - RÈGLE STRICTE
 * RÈGLE : DEUX numéros qui doivent TOUS être parmi les numéros tirés
 */
function validateTwoSureDirecte(playedNumbers, winningNumbers) {
  console.log(`    🔍 Two Sure Directe: [${playedNumbers.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  // Vérification stricte : exactement 2 numéros
  if (playedNumbers.length !== 2) {
    console.log(`    ❌ Two Sure Directe exige exactement 2 numéros (reçu: ${playedNumbers.length})`)
    return false
  }

  // RÈGLE : LES DEUX numéros doivent être parmi les gagnants
  const foundNumbers = playedNumbers.filter((num) => winningNumbers.includes(num))
  const allFound = foundNumbers.length === playedNumbers.length

  console.log(`    ${allFound ? "✅" : "❌"} ${foundNumbers.length}/${playedNumbers.length} numéros trouvés`)
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  if (!allFound) {
    const notFound = playedNumbers.filter((num) => !winningNumbers.includes(num))
    console.log(`    ❌ Numéros manquants: [${notFound.join(", ")}]`)
  }

  return allFound
}

/**
 * Validation Position - RÈGLE STRICTE
 * Le numéro joué doit être exactement à la position demandée
 */
function validatePosition(playedNumbers, winningNumbers, position) {
  console.log(`    🔍 Position ${position}: [${playedNumbers.join(", ")}] vs position ${position}`)

  const index = position - 1
  if (index >= winningNumbers.length) {
    console.log(`    ❌ Position ${position} n'existe pas (seulement ${winningNumbers.length} résultats)`)
    return false
  }

  const targetNumber = winningNumbers[index]
  const isValid = playedNumbers.includes(targetNumber)

  console.log(
    `    ${isValid ? "✅" : "❌"} Numéro à position ${position}: ${targetNumber} ${isValid ? "trouvé" : "NON trouvé"} dans joués`,
  )

  return isValid
}

/**
 * Validation NAP - RÈGLE STRICTE
 * TOUS les numéros NAP doivent être dans les gagnants (ordre non important)
 */
function validateNAP(playedNumbers, winningNumbers, requiredCount) {
  console.log(`    🔍 NAP ${requiredCount}: [${playedNumbers.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  // Vérification du nombre correct de numéros
  if (playedNumbers.length !== requiredCount) {
    console.log(`    ❌ NAP ${requiredCount} exige exactement ${requiredCount} numéros (reçu: ${playedNumbers.length})`)
    return false
  }

  // RÈGLE : TOUS les numéros NAP doivent être trouvés
  const foundNumbers = playedNumbers.filter((num) => winningNumbers.includes(num))
  const allFound = foundNumbers.length === playedNumbers.length

  console.log(`    ${allFound ? "✅" : "❌"} ${foundNumbers.length}/${playedNumbers.length} numéros NAP trouvés`)
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  if (!allFound) {
    const notFound = playedNumbers.filter((num) => !winningNumbers.includes(num))
    console.log(`    ❌ Numéros NAP manquants: [${notFound.join(", ")}]`)
  }

  return allFound
}

/**
 * ✅ NOUVELLE FONCTION - Validation NAP DoubleChance
 * AU MOINS le nombre requis de numéros doivent être dans les gagnants
 * Le joueur peut jouer plus de numéros que requis
 */
function validateNAPDoubleChance(playedNumbers, winningNumbers, requiredCount) {
  console.log(`    🔍 NAP ${requiredCount} DoubleChance: [${playedNumbers.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  // RÈGLE : AU MOINS requiredCount numéros doivent être trouvés
  const foundNumbers = playedNumbers.filter((num) => winningNumbers.includes(num))
  const hasEnough = foundNumbers.length >= requiredCount

  console.log(`    ${hasEnough ? "✅" : "❌"} ${foundNumbers.length}/${playedNumbers.length} numéros trouvés (min requis: ${requiredCount})`)
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  if (!hasEnough) {
    console.log(`    ❌ Seulement ${foundNumbers.length} numéro(s), il en faut au moins ${requiredCount}`)
  }

  return hasEnough
}

/**
 * Validation Turbo - RÈGLE STRICTE
 * Les numéros joués doivent être dans les X PREMIERS tirés
 */
function validateTurbo(playedNumbers, winningNumbers, topCount) {
  console.log(`    🔍 Turbo ${topCount}: [${playedNumbers.join(", ")}] dans les ${topCount} premiers`)

  // Prendre seulement les X premiers numéros tirés
  const topWinningNumbers = winningNumbers.slice(0, topCount)
  console.log(`    📊 ${topCount} premiers tirés: [${topWinningNumbers.join(", ")}]`)

  // RÈGLE : TOUS les numéros joués doivent être dans les X premiers
  const foundNumbers = playedNumbers.filter((num) => topWinningNumbers.includes(num))
  const allFound = foundNumbers.length === playedNumbers.length

  console.log(
    `    ${allFound ? "✅" : "❌"} ${foundNumbers.length}/${playedNumbers.length} numéros trouvés dans les ${topCount} premiers`,
  )
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  if (!allFound) {
    const notFound = playedNumbers.filter((num) => !topWinningNumbers.includes(num))
    console.log(`    ❌ Numéros manquants dans les ${topCount} premiers: [${notFound.join(", ")}]`)
  }

  return allFound
}

/**
 * Validation Permutation - RÈGLE SOUPLE
 * Au moins 2 numéros trouvés parmi ceux choisis (dans TOUS les tirés)
 */
function validatePermutation(playedNumbers, winningNumbers) {
  console.log(`    🔍 Permutation: [${playedNumbers.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  // Compter les correspondances
  const foundNumbers = playedNumbers.filter((num) => winningNumbers.includes(num))
  const isValid = foundNumbers.length >= 2 // Au moins 2 pour gagner

  console.log(`    ${isValid ? "✅" : "❌"} ${foundNumbers.length} correspondances (min requis: 2)`)
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  if (!isValid && foundNumbers.length > 0) {
    console.log(`    ⚠️ Seulement ${foundNumbers.length} correspondance(s), il en faut au moins 2`)
  }

  return isValid
}

/**
 * Validation Turbo Permutation - RÈGLE SOUPLE
 * Au moins 2 numéros trouvés dans les X premiers tirés
 */
function validateTurboPermutation(playedNumbers, winningNumbers, topCount) {
  console.log(`    🔍 Turbo Permutation ${topCount}: [${playedNumbers.join(", ")}] dans les ${topCount} premiers`)

  // Prendre seulement les X premiers numéros tirés
  const topWinningNumbers = winningNumbers.slice(0, topCount)
  console.log(`    📊 ${topCount} premiers tirés: [${topWinningNumbers.join(", ")}]`)

  // RÈGLE : Au moins 2 numéros dans les X premiers
  const foundNumbers = playedNumbers.filter((num) => topWinningNumbers.includes(num))
  const isValid = foundNumbers.length >= 2

  console.log(
    `    ${isValid ? "✅" : "❌"} ${foundNumbers.length} correspondances dans les ${topCount} premiers (min requis: 2)`,
  )
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  if (!isValid && foundNumbers.length > 0) {
    console.log(`    ⚠️ Seulement ${foundNumbers.length} dans les ${topCount} premiers, il en faut au moins 2`)
  }

  return isValid
}

/**
 * Validation Double Number avec formule - LOGIQUE COMPLÈTEMENT CORRIGÉE
 * RÈGLE : Les 8 doubles [11,22,33,44,55,66,77,88] sont automatiquement joués
 * Applique la logique de la formule : au moins 2 doubles doivent respecter la règle
 */
function validateDoubleNumberFormula(winningNumbers, formule) {
  console.log(`    🔍 Double Number + ${formule}: 8 doubles vs [${winningNumbers.join(", ")}]`)

  // Les 8 doubles automatiques (toujours les mêmes)
  const autoDoubles = [11, 22, 33, 44, 55, 66, 77, 88]
  console.log(`    📊 Doubles automatiques: [${autoDoubles.join(", ")}]`)

  let foundDoubles
  switch (formule) {
    case "Directe":
      // RÈGLE : Au moins 2 doubles dans TOUS les tirés
      foundDoubles = autoDoubles.filter((num) => winningNumbers.includes(num))
      break

    case "Turbo2":
      // RÈGLE : Au moins 2 doubles dans les 2 PREMIERS tirés
      const top2 = winningNumbers.slice(0, 2)
      console.log(`    📊 2 premiers tirés: [${top2.join(", ")}]`)
      foundDoubles = autoDoubles.filter((num) => top2.includes(num))
      break

    case "Turbo3":
      // RÈGLE : Au moins 2 doubles dans les 3 PREMIERS tirés
      const top3 = winningNumbers.slice(0, 3)
      console.log(`    📊 3 premiers tirés: [${top3.join(", ")}]`)
      foundDoubles = autoDoubles.filter((num) => top3.includes(num))
      break

    case "Turbo4":
      // RÈGLE : Au moins 2 doubles dans les 4 PREMIERS tirés
      const top4 = winningNumbers.slice(0, 4)
      console.log(`    📊 4 premiers tirés: [${top4.join(", ")}]`)
      foundDoubles = autoDoubles.filter((num) => top4.includes(num))
      break

    default:
      console.log(`    ❌ Formule Double Number non reconnue: ${formule}`)
      return false
  }

  const isValid = foundDoubles.length >= 2
  console.log(`    ${isValid ? "✅" : "❌"} ${foundDoubles.length}/8 doubles trouvés (min requis: 2)`)
  console.log(`    📊 Doubles gagnants: [${foundDoubles.join(", ")}]`)

  if (!isValid && foundDoubles.length > 0) {
    console.log(`    ⚠️ Seulement ${foundDoubles.length} double(s), il en faut au moins 2`)
  }

  return isValid
}

/**
 * Validation Anagramme avec formule - LOGIQUE COMPLÈTEMENT CORRIGÉE
 * RÈGLE : Les 37 binômes sont automatiquement joués
 * Applique la logique de la formule : au moins 1 binôme doit respecter la règle
 */
function validateAnagrammeFormula(winningNumbers, formule) {
  console.log(`    🔍 Anagramme + ${formule}: 37 binômes vs [${winningNumbers.join(", ")}]`)

  // Les 37 binômes automatiques (selon votre liste exacte)
  const anagrammes = [
    [1, 10],
    [2, 20],
    [3, 30],
    [4, 40],
    [5, 50],
    [6, 60],
    [7, 70],
    [8, 80],
    [9, 90],
    [10, 1],
    [11, 12],
    [12, 21],
    [13, 31],
    [14, 41],
    [15, 51],
    [16, 61],
    [17, 71],
    [18, 81],
    [19, 91],
    [20, 2],
    [21, 12],
    [22, 23],
    [23, 32],
    [24, 42],
    [25, 52],
    [26, 62],
    [27, 72],
    [28, 82],
    [29, 92],
    [30, 3],
    [31, 13],
    [32, 23],
    [33, 34],
    [34, 43],
    [35, 53],
    [36, 63],
    [37, 73],
  ]

  console.log(`    📊 Test de ${anagrammes.length} binômes automatiques...`)

  let gagnants = []
  switch (formule) {
    case "Directe":
      // RÈGLE : Au moins 1 binôme a ses 2 numéros dans TOUS les tirés
      gagnants = anagrammes.filter(([num1, num2]) => winningNumbers.includes(num1) && winningNumbers.includes(num2))
      break

    case "Turbo2":
      // RÈGLE : Au moins 1 binôme a ses 2 numéros dans les 2 PREMIERS tirés
      const top2 = winningNumbers.slice(0, 2)
      console.log(`    📊 2 premiers tirés: [${top2.join(", ")}]`)
      gagnants = anagrammes.filter(([num1, num2]) => top2.includes(num1) && top2.includes(num2))
      break

    case "Turbo3":
      // RÈGLE : Au moins 1 binôme a ses 2 numéros dans les 3 PREMIERS tirés
      const top3 = winningNumbers.slice(0, 3)
      console.log(`    📊 3 premiers tirés: [${top3.join(", ")}]`)
      gagnants = anagrammes.filter(([num1, num2]) => top3.includes(num1) && top3.includes(num2))
      break

    case "Turbo4":
      // RÈGLE : Au moins 1 binôme a ses 2 numéros dans les 4 PREMIERS tirés
      const top4 = winningNumbers.slice(0, 4)
      console.log(`    📊 4 premiers tirés: [${top4.join(", ")}]`)
      gagnants = anagrammes.filter(([num1, num2]) => top4.includes(num1) && top4.includes(num2))
      break

    default:
      console.log(`    ❌ Formule Anagramme non reconnue: ${formule}`)
      return false
  }

  const isValid = gagnants.length > 0

  if (isValid) {
    console.log(`    ✅ ${gagnants.length}/37 binôme(s) gagnant(s):`)
    gagnants.slice(0, 3).forEach(([num1, num2]) => {
      // Affiche max 3 pour éviter le spam
      console.log(`      - [${num1}, ${num2}]`)
    })
    if (gagnants.length > 3) {
      console.log(`      ... et ${gagnants.length - 3} autres`)
    }
  } else {
    console.log(`    ❌ Aucun binôme gagnant trouvé parmi les 37 possibles`)
    console.log(`    📝 Un binôme gagne si ses 2 numéros respectent la règle de "${formule}"`)
  }

  return isValid
}

/**
 * Fonction pour valider tous les tickets d'un jeu donné
 * @param {Object} models - Modèles Sequelize
 * @param {number} gameId - ID du jeu
 * @returns {Promise<Array>} - Tickets validés
 */
async function validateGameTickets(models, gameId) {
  try {
    console.log(`🎯 === VALIDATION GLOBALE POUR JEU ${gameId} ===`)

    // Récupérer le jeu et son résultat
    const game = await models.Game.findByPk(gameId, {
      include: [
        {
          model: models.Result,
          as: "result",
        },
      ],
    })

    if (!game || !game.result) {
      throw new Error(`Jeu ${gameId} ou résultat non trouvé`)
    }

    console.log(`🎮 Jeu: ${game.nom} (double chance: ${game.doubleChance})`)
    console.log(`🎲 Résultat: ${game.result.numbers}${game.result.numbers2 ? ` / ${game.result.numbers2}` : ""}`)

    // Récupérer tous les tickets en attente pour ce jeu
    const tickets = await models.Ticket.findAll({
      where: {
        nomJeu: game.nom,
        statut: "en attente",
      },
    })

    if (tickets.length === 0) {
      console.log(`ℹ️ Aucun ticket en attente pour le jeu ${game.nom}`)
      return []
    }

    console.log(`📊 ${tickets.length} ticket(s) en attente à valider`)

    // Valider les tickets
    const validatedTickets = validateTickets(tickets, game.result, game)

    // Mettre à jour le statut des tickets en base
    for (const ticket of validatedTickets) {
      await models.Ticket.update({ statut: ticket.statut }, { where: { id: ticket.id } })
    }

    const validesCount = validatedTickets.filter((t) => t.statut === "validé").length
    const invalidesCount = validatedTickets.filter((t) => t.statut === "invalidé").length

    console.log(`🏆 === VALIDATION TERMINÉE ===`)
    console.log(`✅ ${validesCount} tickets validés`)
    console.log(`❌ ${invalidesCount} tickets invalidés`)
    console.log(`📊 Total traité: ${validatedTickets.length}`)

    return validatedTickets
  } catch (error) {
    console.error("❌ Erreur lors de la validation des tickets:", error)
    throw error
  }
}

module.exports = {
  validateTickets,
  validateSingleTicket,
  validateGameTickets,
  validateByFormula,
  validateFirstBKDirecte,
  validateTwoSureDirecte,
  validatePosition,
  validateNAP,
  validateTurbo,
  validatePermutation,
  validateTurboPermutation,
  validateDoubleNumberFormula,
  validateAnagrammeFormula,
}
