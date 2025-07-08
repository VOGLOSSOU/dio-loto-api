const { Game, Result, Ticket } = require("../../db/sequelize")
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.post("/api/games/:gameId/result", auth, async (req, res) => {
    try {
      const { gameId } = req.params
      const { numbers, numbers1, numbers2 } = req.body

      // 1) Vérifier que le jeu existe
      const game = await Game.findByPk(gameId, {
        include: [{ model: Result, as: "result" }],
      })

      if (!game) {
        return res.status(404).json({ message: "Jeu introuvable." })
      }

      // 2) Vérifier que le jeu est fermé
      if (game.statut !== "fermé") {
        return res.status(400).json({ message: "Le jeu n'est pas fermé." })
      }

      // 3) Vérifier qu'il n'y a pas déjà de résultat
      if (game.result) {
        return res.status(400).json({ message: "Le résultat a déjà été saisi pour ce jeu." })
      }

      // 4) Déterminer le champ principal à utiliser
      const mainNumbers = numbers || numbers1

      // 5) Valider la chaîne de numéros
      if (!mainNumbers || typeof mainNumbers !== "string" || mainNumbers.trim().length === 0) {
        return res.status(400).json({ message: "Les numéros gagnants sont requis." })
      }

      if (numbers2 && typeof numbers2 !== "string") {
        return res.status(400).json({ message: "Le second résultat doit être une chaîne." })
      }

      // 6) Créer l'enregistrement dans Result
      const newResult = await Result.create({
        gameId: game.id,
        numbers: mainNumbers.trim(),
        numbers2: numbers2 ? numbers2.trim() : null,
      })

      // 7) VALIDATION AUTOMATIQUE DES TICKETS
      const validationResult = {
        executed: false,
        total: 0,
        validés: 0,
        invalidés: 0,
        détails: [],
        error: null,
      }

      try {
        console.log(`🎯 === DÉBUT VALIDATION AUTOMATIQUE POUR JEU ${game.nom} ===`)

        // Récupérer tous les tickets "en attente" pour ce jeu
        const tickets = await Ticket.findAll({
          where: {
            nomJeu: game.nom,
            statut: "en attente",
            isCart: false,
          },
        })

        validationResult.total = tickets.length

        if (tickets.length === 0) {
          console.log(`ℹ️ Aucun ticket en attente à valider pour le jeu ${game.nom}`)
          validationResult.executed = true
        } else {
          console.log(`📊 ${tickets.length} ticket(s) trouvé(s) en attente pour validation`)

          // Préparer les numéros gagnants
          const winningNumbers = newResult.numbers.split(",").map((num) => Number.parseInt(num.trim()))
          const winningNumbers2 = newResult.numbers2
            ? newResult.numbers2.split(",").map((num) => Number.parseInt(num.trim()))
            : null

          console.log(`🎲 Numéros gagnants Win: [${winningNumbers.join(", ")}]`)
          if (winningNumbers2) {
            console.log(`🎲 Numéros gagnants Machine: [${winningNumbers2.join(", ")}]`)
          }

          // Valider chaque ticket
          const détailsValidation = []
          const validationErrors = []

          for (const ticket of tickets) {
            try {
              // ✅ VALIDATION CORRIGÉE
              const validationDetail = await validateAndProcessTicket(ticket, winningNumbers, winningNumbers2, game)

              détailsValidation.push(validationDetail)

              // Compter les résultats
              if (validationDetail.isGagnant) {
                validationResult.validés++
              } else {
                validationResult.invalidés++
              }

              console.log(
                `${validationDetail.isGagnant ? "✅" : "❌"} Ticket ${ticket.numeroTicket}: ${validationDetail.nouveauStatut}`,
              )
            } catch (ticketError) {
              console.error(`❌ Erreur validation ticket ${ticket.id}:`, ticketError)

              // En cas d'erreur, marquer comme invalidé
              await ticket.update({ statut: "invalidé" })
              validationResult.invalidés++

              const errorDetail = {
                ticketId: ticket.id,
                numeroTicket: ticket.numeroTicket,
                ancienStatut: "en attente",
                nouveauStatut: "invalidé",
                erreur: `Erreur lors de la validation: ${ticketError.message}`,
              }

              détailsValidation.push(errorDetail)
              validationErrors.push(errorDetail)
            }
          }

          validationResult.détails = détailsValidation
          validationResult.executed = true

          if (validationErrors.length > 0) {
            validationResult.partialError = `${validationErrors.length} ticket(s) ont eu des erreurs de validation`
          }

          console.log(
            `🎯 Validation terminée: ${validationResult.validés} validé(s), ${validationResult.invalidés} invalidé(s)`,
          )
        }
      } catch (validationError) {
        console.error("❌ Erreur lors de la validation automatique:", validationError)
        validationResult.error = validationError.message
        validationResult.executed = false
      }

      // 8) Construire la réponse finale
      const response = {
        message: "Résultat enregistré avec succès.",
        result: {
          id: newResult.id,
          gameId: newResult.gameId,
          numbers: newResult.numbers,
          numbers2: newResult.numbers2,
          createdAt: newResult.createdAt,
        },
        jeu: {
          id: game.id,
          nom: game.nom,
          pays: game.pays,
          doubleChance: game.doubleChance,
          statut: game.statut,
        },
      }

      // Ajouter les détails de validation selon le résultat
      if (validationResult.executed && !validationResult.error) {
        response.message = "Résultat enregistré avec succès et tickets validés automatiquement."
        response.validation = {
          success: true,
          statistiques: {
            total: validationResult.total,
            validés: validationResult.validés,
            invalidés: validationResult.invalidés,
            tauxValidation:
              validationResult.total > 0
                ? ((validationResult.validés / validationResult.total) * 100).toFixed(2) + "%"
                : "0%",
          },
          détails: validationResult.détails,
          message:
            validationResult.total === 0
              ? "Aucun ticket en attente à valider."
              : `${validationResult.validés} ticket(s) validé(s), ${validationResult.invalidés} invalidé(s).`,
        }

        if (validationResult.partialError) {
          response.validation.warning = validationResult.partialError
        }
      } else if (validationResult.error) {
        response.message = "Résultat enregistré avec succès, mais erreur lors de la validation automatique des tickets."
        response.validation = {
          success: false,
          error: validationResult.error,
          notice: `Vous pouvez relancer la validation manuellement via POST /api/results/${newResult.id}/validate-tickets`,
        }
      }

      return res.status(201).json(response)
    } catch (err) {
      console.error("❌ Erreur serveur lors de la création du résultat:", err)
      return res.status(500).json({
        message: "Erreur serveur lors de la création du résultat.",
        error: err.message,
      })
    }
  })
}

// =====================================================
// ✅ FONCTION PRINCIPALE DE VALIDATION CORRIGÉE
// =====================================================

/**
 * Valide un ticket et met à jour son statut en base
 * @param {Object} ticket - Le ticket à valider
 * @param {Array} winningNumbers - Numéros gagnants principaux (Win)
 * @param {Array|null} winningNumbers2 - Numéros gagnants secondaires (Machine)
 * @param {Object} game - Informations du jeu
 * @returns {Object} - Détails de la validation
 */
async function validateAndProcessTicket(ticket, winningNumbers, winningNumbers2, game) {
  console.log(`\n🔍 === VALIDATION TICKET ${ticket.numeroTicket} ===`)

  // ✅ PARSING CORRIGÉ - ticket.numerosJoues est déjà un tableau grâce au getter Sequelize
  let numerosJoues = []
  try {
    if (Array.isArray(ticket.numerosJoues)) {
      numerosJoues = ticket.numerosJoues.map((num) => Number.parseInt(num))
    } else {
      console.warn(`⚠️ numerosJoues n'est pas un tableau:`, ticket.numerosJoues)
      numerosJoues = []
    }
  } catch (error) {
    console.error(`❌ Erreur parsing numerosJoues:`, error)
    numerosJoues = []
  }

  console.log(`📋 Type: "${ticket.typeJeu}", Formule: "${ticket.formule}"`)
  console.log(`🎯 Numéros joués: [${numerosJoues.join(", ")}]`)
  console.log(`🎲 Numéros Win: [${winningNumbers.join(", ")}]`)
  if (winningNumbers2) {
    console.log(`🎲 Numéros Machine: [${winningNumbers2.join(", ")}]`)
  }

  // ✅ VALIDATION SELON LE TYPE ET LA FORMULE
  const isGagnant = validateTicketByTypeAndFormula(
    ticket.typeJeu,
    ticket.formule,
    numerosJoues,
    winningNumbers,
    winningNumbers2,
    game.doubleChance,
  )

  // Mettre à jour le statut en base
  const nouveauStatut = isGagnant ? "validé" : "invalidé"
  await ticket.update({ statut: nouveauStatut })

  // Calculer les correspondances pour les détails
  const correspondances = calculateCorrespondances(
    ticket.typeJeu,
    ticket.formule,
    numerosJoues,
    winningNumbers,
    winningNumbers2,
  )

  // Générer la raison de validation
  const raisonValidation = generateValidationReason(
    ticket.typeJeu,
    ticket.formule,
    correspondances,
    isGagnant,
    game.doubleChance,
  )

  console.log(`🏆 RÉSULTAT: ${isGagnant ? "GAGNANT" : "PERDANT"} - ${raisonValidation}`)

  return {
    ticketId: ticket.id,
    numeroTicket: ticket.numeroTicket,
    userId: ticket.uniqueUserId,
    formule: ticket.formule,
    typeJeu: ticket.typeJeu,
    numerosJoues: numerosJoues,
    mise: ticket.mise,
    ancienStatut: "en attente",
    nouveauStatut: nouveauStatut,
    isGagnant: isGagnant,
    correspondances: correspondances,
    raisonValidation: raisonValidation,
  }
}

// =====================================================
// ✅ FONCTION DE VALIDATION PAR TYPE ET FORMULE
// =====================================================

/**
 * Valide un ticket selon son type et sa formule
 * @param {string} typeJeu - Type de jeu (FirstouonBK, NAP, etc.)
 * @param {string} formule - Formule (Directe, Turbo2, etc.)
 * @param {Array} numerosJoues - Numéros joués par l'utilisateur
 * @param {Array} winningNumbers - Numéros gagnants Win
 * @param {Array|null} winningNumbers2 - Numéros gagnants Machine
 * @param {boolean} doubleChance - Si le jeu a la double chance
 * @returns {boolean} - true si gagnant, false sinon
 */
function validateTicketByTypeAndFormula(typeJeu, formule, numerosJoues, winningNumbers, winningNumbers2, doubleChance) {
  console.log(`  🎯 Validation: ${typeJeu} + ${formule} ${doubleChance ? "(Double Chance)" : ""}`)

  // Gestion de la double chance
  if (doubleChance && winningNumbers2) {
    console.log(`  🔄 Mode double chance - Test sur Win ET Machine`)

    const winOnWin = validateSingleCombination(typeJeu, formule, numerosJoues, winningNumbers)
    const winOnMachine = validateSingleCombination(typeJeu, formule, numerosJoues, winningNumbers2)

    console.log(`  📊 Résultat Win: ${winOnWin ? "GAGNANT" : "PERDANT"}`)
    console.log(`  📊 Résultat Machine: ${winOnMachine ? "GAGNANT" : "PERDANT"}`)

    const finalResult = winOnWin || winOnMachine
    console.log(`  🏆 RÉSULTAT FINAL DOUBLE CHANCE: ${finalResult ? "GAGNANT" : "PERDANT"}`)

    return finalResult
  }

  // Validation simple (sans double chance)
  return validateSingleCombination(typeJeu, formule, numerosJoues, winningNumbers)
}

/**
 * Valide une combinaison unique (type + formule + numéros)
 * @param {string} typeJeu - Type de jeu
 * @param {string} formule - Formule
 * @param {Array} numerosJoues - Numéros joués
 * @param {Array} winningNumbers - Numéros gagnants à tester
 * @returns {boolean} - true si gagnant
 */
function validateSingleCombination(typeJeu, formule, numerosJoues, winningNumbers) {
  // Construire la clé de combinaison exacte comme le frontend
  const combinaison = `${typeJeu}:${formule}`
  console.log(`    🔍 Test combinaison: "${combinaison}"`)

  switch (combinaison) {
    // ==========================================
    // === FIRSTOUONBK
    // ==========================================
    case "FirstouonBK:Directe":
      return validateFirstBKDirecte(numerosJoues, winningNumbers)

    case "FirstouonBK:Position1":
      return validatePosition(numerosJoues, winningNumbers, 1)

    case "FirstouonBK:Position2":
      return validatePosition(numerosJoues, winningNumbers, 2)

    case "FirstouonBK:Position3":
      return validatePosition(numerosJoues, winningNumbers, 3)

    case "FirstouonBK:Position4":
      return validatePosition(numerosJoues, winningNumbers, 4)

    case "FirstouonBK:Position5":
      return validatePosition(numerosJoues, winningNumbers, 5)

    // ==========================================
    // === TWOSÛRS
    // ==========================================
    case "Twosûrs:Directe":
      return validateTwoSureDirecte(numerosJoues, winningNumbers)

    case "Twosûrs:Turbo2":
      return validateTurbo(numerosJoues, winningNumbers, 2)

    case "Twosûrs:Turbo3":
      return validateTurbo(numerosJoues, winningNumbers, 3)

    case "Twosûrs:Turbo4":
      return validateTurbo(numerosJoues, winningNumbers, 4)

    // Variantes Double Chance pour Twosûrs
    case "Twosûrs:Turbo2DoubleChance":
      return validateTurbo(numerosJoues, winningNumbers, 2)

    case "Twosûrs:Turbo3DoubleChance":
      return validateTurbo(numerosJoues, winningNumbers, 3)

    case "Twosûrs:Turbo4DoubleChance":
      return validateTurbo(numerosJoues, winningNumbers, 4)

    // ==========================================
    // === PERMUTATIONS
    // ==========================================
    case "Permutations:Directe":
      return validatePermutation(numerosJoues, winningNumbers)

    case "Permutations:Turbo2":
      return validateTurboPermutation(numerosJoues, winningNumbers, 2)

    case "Permutations:Turbo3":
      return validateTurboPermutation(numerosJoues, winningNumbers, 3)

    case "Permutations:Turbo4":
      return validateTurboPermutation(numerosJoues, winningNumbers, 4)

    // Variantes Double Chance pour Permutations
    case "Permutations:DirecteDoubleChance":
      return validatePermutation(numerosJoues, winningNumbers)

    case "Permutations:Turbo2DoubleChance":
      return validateTurboPermutation(numerosJoues, winningNumbers, 2)

    case "Permutations:Turbo3DoubleChance":
      return validateTurboPermutation(numerosJoues, winningNumbers, 3)

    case "Permutations:Turbo4DoubleChance":
      return validateTurboPermutation(numerosJoues, winningNumbers, 4)

    // ==========================================
    // === NAP
    // ==========================================
    case "NAP:NAP3":
      return validateNAP(numerosJoues, winningNumbers, 3)

    case "NAP:NAP4":
      return validateNAP(numerosJoues, winningNumbers, 4)

    case "NAP:NAP5":
      return validateNAP(numerosJoues, winningNumbers, 5)

    // Variantes Double Chance pour NAP
    case "NAP:NAP3DoubleChance":
      return validateNAP(numerosJoues, winningNumbers, 3)

    case "NAP:NAP4DoubleChance":
      return validateNAP(numerosJoues, winningNumbers, 4)

    case "NAP:NAP5DoubleChance":
      return validateNAP(numerosJoues, winningNumbers, 5)

    // ==========================================
    // === DOUBLENUMBER (numéros automatiques)
    // ==========================================
    case "DoubleNumber:Directe":
      return validateDoubleNumber(winningNumbers, "Directe")

    case "DoubleNumber:Turbo2":
      return validateDoubleNumber(winningNumbers, "Turbo2")

    case "DoubleNumber:Turbo3":
      return validateDoubleNumber(winningNumbers, "Turbo3")

    case "DoubleNumber:Turbo4":
      return validateDoubleNumber(winningNumbers, "Turbo4")

    // Variantes Double Chance pour DoubleNumber
    case "DoubleNumber:Turbo2DoubleChance":
      return validateDoubleNumber(winningNumbers, "Turbo2")

    case "DoubleNumber:Turbo3DoubleChance":
      return validateDoubleNumber(winningNumbers, "Turbo3")

    case "DoubleNumber:Turbo4DoubleChance":
      return validateDoubleNumber(winningNumbers, "Turbo4")

    // ==========================================
    // === ANNAGRAMMESIMPLE (binômes automatiques)
    // ==========================================
    case "Annagrammesimple:Directe":
      return validateAnagramme(winningNumbers, "Directe")

    case "Annagrammesimple:Turbo2":
      return validateAnagramme(winningNumbers, "Turbo2")

    case "Annagrammesimple:Turbo3":
      return validateAnagramme(winningNumbers, "Turbo3")

    case "Annagrammesimple:Turbo4":
      return validateAnagramme(winningNumbers, "Turbo4")

    // Variantes Double Chance pour Anagramme
    case "Annagrammesimple:DirecteDoubleChance":
      return validateAnagramme(winningNumbers, "Directe")

    case "Annagrammesimple:Turbo2DoubleChance":
      return validateAnagramme(winningNumbers, "Turbo2")

    case "Annagrammesimple:Turbo3DoubleChance":
      return validateAnagramme(winningNumbers, "Turbo3")

    case "Annagrammesimple:Turbo4DoubleChance":
      return validateAnagramme(winningNumbers, "Turbo4")

    case "Annagrammesimple:AnnagrammesimpleDoubleChance":
      return validateAnagramme(winningNumbers, "Directe")

    // ==========================================
    // === FALLBACK POUR COMPATIBILITÉ
    // ==========================================
    default:
      console.log(`    ❌ COMBINAISON NON RECONNUE: "${combinaison}"`)
      console.log(`    📝 Types supportés: FirstouonBK, NAP, Twosûrs, Permutations, DoubleNumber, Annagrammesimple`)
      console.log(`    📝 Formules supportées: Directe, Position1-5, NAP3-5, Turbo2-4, *DoubleChance`)
      return false
  }
}

// =====================================================
// ✅ FONCTIONS DE VALIDATION SPÉCIFIQUES
// =====================================================

/**
 * Validation First BK Directe
 * RÈGLE: Le numéro joué doit être présent parmi tous les numéros tirés
 */
function validateFirstBKDirecte(numerosJoues, winningNumbers) {
  console.log(`    🔍 First BK Directe: [${numerosJoues.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  if (numerosJoues.length !== 1) {
    console.log(`    ❌ First BK exige exactement 1 numéro (reçu: ${numerosJoues.length})`)
    return false
  }

  const numeroJoue = numerosJoues[0]
  const isFound = winningNumbers.includes(numeroJoue)

  console.log(`    ${isFound ? "✅" : "❌"} Numéro ${numeroJoue} ${isFound ? "trouvé" : "NON trouvé"}`)

  return isFound
}

/**
 * Validation Position
 * RÈGLE: Le numéro joué doit être exactement à la position demandée
 */
function validatePosition(numerosJoues, winningNumbers, position) {
  console.log(`    🔍 Position ${position}: [${numerosJoues.join(", ")}] vs position ${position}`)

  const index = position - 1
  if (index >= winningNumbers.length) {
    console.log(`    ❌ Position ${position} n'existe pas (seulement ${winningNumbers.length} résultats)`)
    return false
  }

  const numeroAtPosition = winningNumbers[index]
  const isValid = numerosJoues.includes(numeroAtPosition)

  console.log(
    `    ${isValid ? "✅" : "❌"} Numéro à position ${position}: ${numeroAtPosition} ${isValid ? "trouvé" : "NON trouvé"} dans joués`,
  )

  return isValid
}

/**
 * Validation Two Sure Directe
 * RÈGLE: LES DEUX numéros joués doivent être présents parmi tous les numéros tirés
 */
function validateTwoSureDirecte(numerosJoues, winningNumbers) {
  console.log(`    🔍 Two Sure Directe: [${numerosJoues.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  if (numerosJoues.length !== 2) {
    console.log(`    ❌ Two Sure exige exactement 2 numéros (reçu: ${numerosJoues.length})`)
    return false
  }

  const foundNumbers = numerosJoues.filter((num) => winningNumbers.includes(num))
  const allFound = foundNumbers.length === numerosJoues.length

  console.log(`    ${allFound ? "✅" : "❌"} ${foundNumbers.length}/${numerosJoues.length} numéros trouvés`)
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  return allFound
}

/**
 * Validation Turbo
 * RÈGLE: LES numéros joués doivent être présents dans les X premiers tirés
 */
function validateTurbo(numerosJoues, winningNumbers, topCount) {
  console.log(`    🔍 Turbo ${topCount}: [${numerosJoues.join(", ")}] dans les ${topCount} premiers`)

  const topNumbers = winningNumbers.slice(0, topCount)
  console.log(`    📊 ${topCount} premiers tirés: [${topNumbers.join(", ")}]`)

  const foundNumbers = numerosJoues.filter((num) => topNumbers.includes(num))
  const allFound = foundNumbers.length === numerosJoues.length

  console.log(
    `    ${allFound ? "✅" : "❌"} ${foundNumbers.length}/${numerosJoues.length} numéros trouvés dans les ${topCount} premiers`,
  )

  return allFound
}

/**
 * Validation Permutation
 * RÈGLE: Au moins 2 numéros joués doivent être présents parmi tous les tirés
 */
function validatePermutation(numerosJoues, winningNumbers) {
  console.log(`    🔍 Permutation: [${numerosJoues.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  const foundNumbers = numerosJoues.filter((num) => winningNumbers.includes(num))
  const isValid = foundNumbers.length >= 2

  console.log(`    ${isValid ? "✅" : "❌"} ${foundNumbers.length} correspondances (min requis: 2)`)
  console.log(`    📊 Numéros trouvés: [${foundNumbers.join(", ")}]`)

  return isValid
}

/**
 * Validation Turbo Permutation
 * RÈGLE: Au moins 2 numéros joués doivent être présents dans les X premiers tirés
 */
function validateTurboPermutation(numerosJoues, winningNumbers, topCount) {
  console.log(`    🔍 Turbo Permutation ${topCount}: [${numerosJoues.join(", ")}] dans les ${topCount} premiers`)

  const topNumbers = winningNumbers.slice(0, topCount)
  console.log(`    📊 ${topCount} premiers tirés: [${topNumbers.join(", ")}]`)

  const foundNumbers = numerosJoues.filter((num) => topNumbers.includes(num))
  const isValid = foundNumbers.length >= 2

  console.log(
    `    ${isValid ? "✅" : "❌"} ${foundNumbers.length} correspondances dans les ${topCount} premiers (min requis: 2)`,
  )

  return isValid
}

/**
 * Validation NAP
 * RÈGLE: TOUS les numéros NAP doivent être présents parmi les tirés
 */
function validateNAP(numerosJoues, winningNumbers, requiredCount) {
  console.log(`    🔍 NAP ${requiredCount}: [${numerosJoues.join(", ")}] dans [${winningNumbers.join(", ")}]`)

  if (numerosJoues.length !== requiredCount) {
    console.log(`    ❌ NAP ${requiredCount} exige exactement ${requiredCount} numéros (reçu: ${numerosJoues.length})`)
    return false
  }

  const foundNumbers = numerosJoues.filter((num) => winningNumbers.includes(num))
  const allFound = foundNumbers.length === numerosJoues.length

  console.log(`    ${allFound ? "✅" : "❌"} ${foundNumbers.length}/${numerosJoues.length} numéros NAP trouvés`)

  return allFound
}

/**
 * Validation Double Number
 * RÈGLE: Au moins 2 des 8 doubles automatiques doivent respecter la formule
 */
function validateDoubleNumber(winningNumbers, formule) {
  console.log(`    🔍 Double Number + ${formule}: 8 doubles automatiques`)

  // Les 8 doubles automatiques (toujours les mêmes)
  const autoDoubles = [11, 22, 33, 44, 55, 66, 77, 88]
  console.log(`    📊 Doubles automatiques: [${autoDoubles.join(", ")}]`)

  let numbersToCheck = winningNumbers

  // Appliquer la logique de la formule
  if (formule.startsWith("Turbo")) {
    const turboCount = Number.parseInt(formule.replace(/[^0-9]/g, ""))
    numbersToCheck = winningNumbers.slice(0, turboCount)
    console.log(`    📊 ${turboCount} premiers tirés: [${numbersToCheck.join(", ")}]`)
  }

  const foundDoubles = autoDoubles.filter((num) => numbersToCheck.includes(num))
  const isValid = foundDoubles.length >= 2

  console.log(`    ${isValid ? "✅" : "❌"} ${foundDoubles.length}/8 doubles trouvés (min requis: 2)`)
  console.log(`    📊 Doubles gagnants: [${foundDoubles.join(", ")}]`)

  return isValid
}

/**
 * Validation Anagramme
 * RÈGLE: Au moins 1 binôme complet doit respecter la formule
 */
function validateAnagramme(winningNumbers, formule) {
  console.log(`    🔍 Anagramme + ${formule}: 37 binômes automatiques`)

  // Les 37 binômes automatiques selon votre liste
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

  let numbersToCheck = winningNumbers

  // Appliquer la logique de la formule
  if (formule.startsWith("Turbo")) {
    const turboCount = Number.parseInt(formule.replace(/[^0-9]/g, ""))
    numbersToCheck = winningNumbers.slice(0, turboCount)
    console.log(`    📊 ${turboCount} premiers tirés: [${numbersToCheck.join(", ")}]`)
  }

  const binomesGagnants = anagrammes.filter(
    ([num1, num2]) => numbersToCheck.includes(num1) && numbersToCheck.includes(num2),
  )

  const isValid = binomesGagnants.length > 0

  if (isValid) {
    console.log(`    ✅ ${binomesGagnants.length}/37 binôme(s) gagnant(s):`)
    binomesGagnants.slice(0, 3).forEach(([num1, num2]) => {
      console.log(`      - [${num1}, ${num2}]`)
    })
    if (binomesGagnants.length > 3) {
      console.log(`      ... et ${binomesGagnants.length - 3} autres`)
    }
  } else {
    console.log(`    ❌ Aucun binôme gagnant trouvé parmi les 37 possibles`)
  }

  return isValid
}

// =====================================================
// ✅ FONCTIONS AUXILIAIRES POUR LES DÉTAILS
// =====================================================

/**
 * Calcule les correspondances pour les détails de validation
 */
function calculateCorrespondances(typeJeu, formule, numerosJoues, winningNumbers, winningNumbers2) {
  let principal = 0
  let secondaire = 0
  let details = {}

  // Déterminer les numéros à utiliser selon la formule
  let numbersToCheck = winningNumbers
  let numbersToCheck2 = winningNumbers2

  if (formule.includes("Turbo")) {
    const turboCount = Number.parseInt(formule.replace(/[^0-9]/g, ""))
    numbersToCheck = winningNumbers.slice(0, turboCount)
    numbersToCheck2 = winningNumbers2 ? winningNumbers2.slice(0, turboCount) : null
  }

  switch (typeJeu) {
    case "DoubleNumber":
      const autoDoubles = [11, 22, 33, 44, 55, 66, 77, 88]
      principal = autoDoubles.filter((num) => numbersToCheck.includes(num)).length
      if (numbersToCheck2) {
        secondaire = autoDoubles.filter((num) => numbersToCheck2.includes(num)).length
      }
      details = {
        doublesJoues: autoDoubles,
        doublesToruvesWin: autoDoubles.filter((num) => numbersToCheck.includes(num)),
        doublesToruvesMachine: numbersToCheck2 ? autoDoubles.filter((num) => numbersToCheck2.includes(num)) : [],
      }
      break

    case "Annagrammesimple":
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

      const binomesGagnantsWin = anagrammes.filter(
        ([num1, num2]) => numbersToCheck.includes(num1) && numbersToCheck.includes(num2),
      )
      principal = binomesGagnantsWin.length

      if (numbersToCheck2) {
        const binomesGagnantsMachine = anagrammes.filter(
          ([num1, num2]) => numbersToCheck2.includes(num1) && numbersToCheck2.includes(num2),
        )
        secondaire = binomesGagnantsMachine.length
      }

      details = {
        binomesGagnantsWin: binomesGagnantsWin,
        binomesGagnantsMachine: numbersToCheck2
          ? anagrammes.filter(([num1, num2]) => numbersToCheck2.includes(num1) && numbersToCheck2.includes(num2))
          : [],
      }
      break

    default:
      // Pour les autres types, comptage classique
      principal = numerosJoues.filter((num) => numbersToCheck.includes(num)).length
      if (numbersToCheck2) {
        secondaire = numerosJoues.filter((num) => numbersToCheck2.includes(num)).length
      }
      details = {
        numerosJoues: numerosJoues,
        numerosTrouvesWin: numerosJoues.filter((num) => numbersToCheck.includes(num)),
        numerosTrouvesMachine: numbersToCheck2 ? numerosJoues.filter((num) => numbersToCheck2.includes(num)) : [],
      }
      break
  }

  return {
    principal: principal,
    secondaire: secondaire,
    details: details,
  }
}

/**
 * Génère la raison de validation pour les détails
 */
function generateValidationReason(typeJeu, formule, correspondances, isValid, doubleChance) {
  const { principal, secondaire } = correspondances

  if (!isValid) {
    if (doubleChance && secondaire > 0) {
      return `Échec: ${principal} en Win, ${secondaire} en Machine pour ${typeJeu}:${formule}`
    }
    return `Échec: ${principal} correspondance(s) pour ${typeJeu}:${formule}`
  }

  // Messages de succès par type de jeu
  switch (typeJeu) {
    case "DoubleNumber":
      if (doubleChance) {
        if (principal >= 2 && secondaire >= 2) {
          return `Gagnant sur Win (${principal} doubles) et Machine (${secondaire} doubles)`
        } else if (principal >= 2) {
          return `Gagnant sur Win: ${principal} doubles trouvés`
        } else {
          return `Gagnant sur Machine: ${secondaire} doubles trouvés`
        }
      }
      return `${principal} doubles trouvés pour ${formule}`

    case "Annagrammesimple":
      if (doubleChance) {
        if (principal > 0 && secondaire > 0) {
          return `Gagnant sur Win (${principal} binômes) et Machine (${secondaire} binômes)`
        } else if (principal > 0) {
          return `Gagnant sur Win: ${principal} binôme(s) gagnant(s)`
        } else {
          return `Gagnant sur Machine: ${secondaire} binôme(s) gagnant(s)`
        }
      }
      return `${principal} binôme(s) gagnant(s) pour ${formule}`

    case "FirstouonBK":
      if (formule.startsWith("Position")) {
        return `Numéro trouvé à la ${formule}`
      }
      return `Numéro trouvé parmi les tirés (Directe)`

    case "NAP":
      return `Tous les numéros NAP trouvés (${principal} correspondances)`

    case "Twosûrs":
      if (formule.includes("Turbo")) {
        return `Paire trouvée dans les premiers tirés (${formule})`
      }
      return `Paire de numéros trouvée (Directe)`

    case "Permutations":
      return `${principal} correspondances trouvées pour permutation (${formule})`

    default:
      return `${principal} correspondance(s) - ticket gagnant`
  }
}