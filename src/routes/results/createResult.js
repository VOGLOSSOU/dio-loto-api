const { Game, Result, Ticket } = require("../../db/sequelize")
const auth = require("../../auth/auth")
const { validateSingleTicket } = require("../../scripts/validation") // ✅ Import corrigé

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
        console.log(`🎯 Début de la validation automatique pour le jeu ${game.nom}...`)

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

          // ✅ Préparer les numéros gagnants - Gérer les espaces ET les virgules
          const winningNumbers = newResult.numbers.includes(',') ?
            newResult.numbers.split(',').map((num) => Number.parseInt(num.trim())) :
            newResult.numbers.split(' ').filter(n => n.trim()).map((num) => Number.parseInt(num.trim()))

          const winningNumbers2 = newResult.numbers2 ?
            (newResult.numbers2.includes(',') ?
              newResult.numbers2.split(',').map((num) => Number.parseInt(num.trim())) :
              newResult.numbers2.split(' ').filter(n => n.trim()).map((num) => Number.parseInt(num.trim()))
            ) : null

          console.log(`🎲 Numéros gagnants: ${winningNumbers.join(", ")}`)
          if (winningNumbers2) {
            console.log(`🎲 Numéros gagnants 2 (double chance): ${winningNumbers2.join(", ")}`)
          }

          // Valider chaque ticket et collecter les détails
          const détailsValidation = []
          const validationErrors = []

          for (const ticket of tickets) {
            try {
              // ✅ Utiliser notre fonction de validation corrigée
              const isValid = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game)

              // Mettre à jour le statut
              const nouveauStatut = isValid ? "validé" : "invalidé"
              await ticket.update({ statut: nouveauStatut })

              // Compter
              isValid ? validationResult.validés++ : validationResult.invalidés++

              // ✅ Collecter les détails avec logique corrigée
              const détail = await getTicketValidationDetail(ticket, winningNumbers, winningNumbers2, game, isValid)
              détailsValidation.push(détail)

              // Log pour suivi
              console.log(`${isValid ? "✅" : "❌"} Ticket ${ticket.numeroTicket}: ${nouveauStatut}`)
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
// ✅ FONCTION POUR DÉTAILS DE VALIDATION CORRIGÉE
// =====================================================

async function getTicketValidationDetail(ticket, winningNumbers, winningNumbers2, game, isValid) {
  // ✅ Parse des numéros corrigé - Gérer les cas où numerosJoues est une chaîne JSON ou un tableau
  let numerosJoues = []
  try {
    if (Array.isArray(ticket.numerosJoues)) {
      // Cas où c'est déjà un tableau (getter Sequelize)
      numerosJoues = ticket.numerosJoues.map((num) => Number.parseInt(num))
    } else if (typeof ticket.numerosJoues === 'string') {
      // Cas où c'est une chaîne JSON (stockage brut en base)
      const parsed = JSON.parse(ticket.numerosJoues)
      if (Array.isArray(parsed)) {
        numerosJoues = parsed.map((num) => Number.parseInt(num))
      } else {
        console.warn(`⚠️ numerosJoues parsé n'est pas un tableau pour ticket ${ticket.id}:`, parsed)
        numerosJoues = [] // Fallback sécurisé pour les détails seulement
      }
    } else {
      console.warn(`⚠️ numerosJoues format inconnu pour ticket ${ticket.id}:`, ticket.numerosJoues)
      numerosJoues = [] // Fallback sécurisé pour les détails seulement
    }
  } catch (error) {
    console.error(`❌ Erreur parsing numerosJoues pour ticket ${ticket.id}:`, error)
    numerosJoues = [] // Fallback sécurisé pour les détails seulement
  }

  // ✅ Calculer les correspondances selon le type de jeu
  const correspondances = getCorrespondancesParType(
    ticket.typeJeu,
    ticket.formule,
    numerosJoues,
    winningNumbers,
    winningNumbers2,
  )

  // ✅ Raison de validation améliorée
  const raisonValidation = getRaisonValidationCorrigee(
    ticket.typeJeu,
    ticket.formule,
    correspondances,
    isValid,
    game.doubleChance,
  )

  return {
    ticketId: ticket.id,
    numeroTicket: ticket.numeroTicket,
    userId: ticket.uniqueUserId,
    formule: ticket.formule,
    typeJeu: ticket.typeJeu,
    numerosJoues: numerosJoues,
    mise: ticket.mise,
    ancienStatut: "en attente",
    nouveauStatut: isValid ? "validé" : "invalidé",
    isGagnant: isValid,
    correspondances: correspondances,
    raisonValidation: raisonValidation,
  }
}

// =====================================================
// ✅ FONCTION POUR CALCULER CORRESPONDANCES PAR TYPE - CORRIGÉE
// =====================================================
function getCorrespondancesParType(typeJeu, formule, numerosJoues, winningNumbers, winningNumbers2) {
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
      // Pour DoubleNumber, on compte les doubles automatiques trouvés
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
      // Pour Anagramme, on compte les binômes gagnants
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

// =====================================================
// ✅ RAISON DE VALIDATION CORRIGÉE
// =====================================================
function getRaisonValidationCorrigee(typeJeu, formule, correspondances, isValid, doubleChance) {
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