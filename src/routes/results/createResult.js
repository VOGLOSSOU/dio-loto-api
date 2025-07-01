const { Game, Result, Ticket } = require('../../db/sequelize');
const auth = require('../../auth/auth');
const { validateSingleTicket, getMatchingCount } = require('../../scripts/validation'); 

module.exports = (app) => {
  app.post('/api/games/:gameId/result', auth, async (req, res) => {
    try {
      const { gameId } = req.params;
      const { numbers, numbers1, numbers2 } = req.body;

      // 1) Vérifier que le jeu existe
      const game = await Game.findByPk(gameId, {
        include: [{ model: Result, as: 'result' }]
      });
      if (!game) {
        return res.status(404).json({ message: 'Jeu introuvable.' });
      }

      // 2) Vérifier que le jeu est fermé
      if (game.statut !== 'fermé') {
        return res.status(400).json({ message: 'Le jeu n\'est pas fermé.' });
      }

      // 3) Vérifier qu'il n'y a pas déjà de résultat
      if (game.result) {
        return res.status(400).json({ message: 'Le résultat a déjà été saisi pour ce jeu.' });
      }

      // 4) Déterminer le champ principal à utiliser
      const mainNumbers = numbers || numbers1;

      // 5) Valider la chaîne de numéros
      if (!mainNumbers || typeof mainNumbers !== 'string' || mainNumbers.trim().length === 0) {
        return res.status(400).json({ message: 'Les numéros gagnants sont requis.' });
      }
      if (numbers2 && typeof numbers2 !== 'string') {
        return res.status(400).json({ message: 'Le second résultat doit être une chaîne.' });
      }

      // 6) Créer l'enregistrement dans Result
      const newResult = await Result.create({
        gameId: game.id,
        numbers: mainNumbers.trim(),
        numbers2: numbers2 ? numbers2.trim() : null
      });

      // 7) VALIDATION AUTOMATIQUE DES TICKETS
      let validationResult = {
        executed: false,
        total: 0,
        validés: 0,
        invalidés: 0,
        détails: [],
        error: null
      };

      try {
        console.log(`🎯 Début de la validation automatique pour le jeu ${game.nom}...`);
        
        // Récupérer tous les tickets "en attente" pour ce jeu
        const tickets = await Ticket.findAll({
          where: { 
            nomJeu: game.nom, 
            statut: 'en attente', 
            isCart: false 
          }
        });

        validationResult.total = tickets.length;

        if (tickets.length === 0) {
          console.log(`ℹ️ Aucun ticket en attente à valider pour le jeu ${game.nom}`);
          validationResult.executed = true;
        } else {
          console.log(`📊 ${tickets.length} ticket(s) trouvé(s) en attente pour validation`);
          
          // Préparer les numéros gagnants
          const winningNumbers = newResult.numbers.split(',').map(num => parseInt(num.trim()));
          const winningNumbers2 = newResult.numbers2 ? 
            newResult.numbers2.split(',').map(num => parseInt(num.trim())) : null;

          console.log(`🎲 Numéros gagnants: ${winningNumbers.join(', ')}`);
          if (winningNumbers2) {
            console.log(`🎲 Numéros gagnants 2 (double chance): ${winningNumbers2.join(', ')}`);
          }

          // Valider chaque ticket et collecter les détails
          const détailsValidation = [];
          let validationErrors = [];

          for (const ticket of tickets) {
            try {
              // Utiliser la fonction de validation
              const isValid = validateSingleTicket(ticket, winningNumbers, winningNumbers2, game);
              
              // Mettre à jour le statut
              const nouveauStatut = isValid ? 'validé' : 'invalidé';
              await ticket.update({ statut: nouveauStatut });
              
              // Compter
              isValid ? validationResult.validés++ : validationResult.invalidés++;
              
              // Collecter les détails pour la réponse
              const numerosJoues = Array.isArray(ticket.numerosJoues) ? 
                ticket.numerosJoues : JSON.parse(ticket.numerosJoues);
              
              const matchingCount = getMatchingCount(numerosJoues, winningNumbers);
              const matchingCount2 = winningNumbers2 ? getMatchingCount(numerosJoues, winningNumbers2) : 0;
              
              const détail = {
                ticketId: ticket.id,
                numeroTicket: ticket.numeroTicket,
                userId: ticket.uniqueUserId,
                formule: ticket.formule,
                typeJeu: ticket.typeJeu,
                numerosJoues: numerosJoues,
                mise: ticket.mise,
                ancienStatut: 'en attente',
                nouveauStatut: nouveauStatut,
                isGagnant: isValid,
                correspondances: {
                  principal: matchingCount,
                  secondaire: matchingCount2
                },
                raisonValidation: getRaisonValidation(ticket.formule, matchingCount, matchingCount2, isValid, game.doubleChance)
              };
              
              détailsValidation.push(détail);
              
              // Log pour suivi
              console.log(`${isValid ? '✅' : '❌'} Ticket ${ticket.numeroTicket}: ${nouveauStatut} (${matchingCount} correspondances)`);
              
            } catch (ticketError) {
              console.error(`❌ Erreur validation ticket ${ticket.id}:`, ticketError);
              
              // En cas d'erreur, marquer comme invalidé
              await ticket.update({ statut: 'invalidé' });
              validationResult.invalidés++;
              
              const errorDetail = {
                ticketId: ticket.id,
                numeroTicket: ticket.numeroTicket,
                ancienStatut: 'en attente',
                nouveauStatut: 'invalidé',
                erreur: `Erreur lors de la validation: ${ticketError.message}`
              };
              
              détailsValidation.push(errorDetail);
              validationErrors.push(errorDetail);
            }
          }
          
          validationResult.détails = détailsValidation;
          validationResult.executed = true;
          
          if (validationErrors.length > 0) {
            validationResult.partialError = `${validationErrors.length} ticket(s) ont eu des erreurs de validation`;
          }
          
          console.log(`🎯 Validation terminée: ${validationResult.validés} validé(s), ${validationResult.invalidés} invalidé(s)`);
        }
        
      } catch (validationError) {
        console.error('❌ Erreur lors de la validation automatique:', validationError);
        validationResult.error = validationError.message;
        validationResult.executed = false;
      }

      // 8) Construire la réponse finale
      const response = {
        message: 'Résultat enregistré avec succès.',
        result: {
          id: newResult.id,
          gameId: newResult.gameId,
          numbers: newResult.numbers,
          numbers2: newResult.numbers2,
          createdAt: newResult.createdAt
        },
        jeu: {
          id: game.id,
          nom: game.nom,
          pays: game.pays,
          doubleChance: game.doubleChance,
          statut: game.statut
        }
      };

      // Ajouter les détails de validation selon le résultat
      if (validationResult.executed && !validationResult.error) {
        response.message = 'Résultat enregistré avec succès et tickets validés automatiquement.';
        response.validation = {
          success: true,
          statistiques: {
            total: validationResult.total,
            validés: validationResult.validés,
            invalidés: validationResult.invalidés,
            tauxValidation: validationResult.total > 0 ? 
              ((validationResult.validés / validationResult.total) * 100).toFixed(2) + '%' : '0%'
          },
          détails: validationResult.détails,
          message: validationResult.total === 0 ? 
            'Aucun ticket en attente à valider.' : 
            `${validationResult.validés} ticket(s) validé(s), ${validationResult.invalidés} invalidé(s).`
        };
        
        if (validationResult.partialError) {
          response.validation.warning = validationResult.partialError;
        }
        
      } else if (validationResult.error) {
        response.message = 'Résultat enregistré avec succès, mais erreur lors de la validation automatique des tickets.';
        response.validation = {
          success: false,
          error: validationResult.error,
          notice: `Vous pouvez relancer la validation manuellement via POST /api/results/${newResult.id}/validate-tickets`
        };
      }

      return res.status(201).json(response);

    } catch (err) {
      console.error('❌ Erreur serveur lors de la création du résultat:', err);
      return res.status(500).json({ 
        message: 'Erreur serveur lors de la création du résultat.', 
        error: err.message 
      });
    }
  });
};

// =====================================================
// FONCTION UTILITAIRE POUR EXPLIQUER LA VALIDATION
// =====================================================

function getRaisonValidation(formule, matchingCount, matchingCount2, isValid, doubleChance) {
  if (!isValid) {
    if (doubleChance && matchingCount2 > 0) {
      return `Pas assez de correspondances: ${matchingCount} en principal, ${matchingCount2} en secondaire pour la formule ${formule}`;
    }
    return `Pas assez de correspondances (${matchingCount}) pour la formule ${formule}`;
  }
  
  // Si gagnant avec double chance
  if (doubleChance && (matchingCount > 0 || matchingCount2 > 0)) {
    if (matchingCount > 0 && matchingCount2 > 0) {
      return `Gagnant sur les deux tirages: ${matchingCount} correspondances (principal) + ${matchingCount2} correspondances (secondaire)`;
    } else if (matchingCount > 0) {
      return `Gagnant sur le tirage principal: ${matchingCount} correspondances`;
    } else {
      return `Gagnant sur le tirage secondaire: ${matchingCount2} correspondances`;
    }
  }
  
  // Cas normal (sans double chance)
  switch (formule.toLowerCase()) {
    case 'directe':
      return 'Numéros sortis dans l\'ordre exact';
    case 'nap 3':
    case 'nap 4':
    case 'nap 5':
      return `Tous les numéros NAP trouvés (${matchingCount} correspondances)`;
    case 'turbo 2':
    case 'turbo 3':
    case 'turbo 4':
      return `${matchingCount} correspondances trouvées (minimum requis atteint)`;
    case 'two sûr directe':
      return 'Paire de numéros trouvée dans l\'ordre';
    case 'anagramme simple':
      return 'Au moins un anagramme gagnant trouvé';
    case 'double number':
      return `${matchingCount} doubles trouvés parmi les numéros gagnants`;
    default:
      if (formule.includes('perm')) {
        return `${matchingCount} correspondances trouvées pour la permutation`;
      } else if (formule.includes('position')) {
        return `Numéro trouvé à la position demandée`;
      }
      return `${matchingCount} correspondances trouvées - ticket gagnant`;
  }
}