// =====================================================
// 1. ROUTE DE VALIDATION AMÉLIORÉE
// =====================================================

const { Ticket, Game, Result } = require('../../db/sequelize');
const { validateSingleTicket, getMatchingCount } = require('../../scripts/validation'); 

module.exports = (app) => {
  app.post('/api/results/:resultId/validate-tickets', async (req, res) => {
    try {
      const { resultId } = req.params;
      
      // 1. Récupérer le résultat et le jeu associé
      const result = await Result.findByPk(resultId, {
        include: [{
          model: Game,
          as: 'game'
        }]
      });
      
      if (!result) {
        return res.status(404).json({ message: "Résultat introuvable." });
      }
      
      if (!result.game) {
        return res.status(404).json({ message: "Jeu associé au résultat introuvable." });
      }
      
      // 2. Récupérer tous les tickets "en attente" pour ce jeu
      const tickets = await Ticket.findAll({
        where: { 
          nomJeu: result.game.nom, 
          statut: 'en attente', 
          isCart: false 
        }
      });
      
      if (tickets.length === 0) {
        return res.status(200).json({
          message: "Aucun ticket en attente à valider pour ce jeu.",
          total: 0,
          validés: 0,
          invalidés: 0,
          détails: []
        });
      }
      
      // 3. Préparer les numéros gagnants
      const winningNumbers = result.numbers.split(',').map(num => parseInt(num.trim()));
      const winningNumbers2 = result.numbers2 ? 
        result.numbers2.split(',').map(num => parseInt(num.trim())) : null;
      
      // 4. Valider chaque ticket et collecter les détails
      let validés = 0, invalidés = 0;
      const détailsValidation = [];
      
      for (const ticket of tickets) {
        try {
          // Utiliser ta fonction de validation
          const isValid = validateSingleTicket(ticket, winningNumbers, winningNumbers2, result.game);
          
          // Mettre à jour le statut
          const nouveauStatut = isValid ? 'validé' : 'invalidé';
          await ticket.update({ statut: nouveauStatut });
          
          // Compter
          isValid ? validés++ : invalidés++;
          
          // Collecter les détails pour la réponse
          const numerosJoues = Array.isArray(ticket.numerosJoues) ? 
            ticket.numerosJoues : JSON.parse(ticket.numerosJoues);
          
          const matchingCount = getMatchingCount(numerosJoues, winningNumbers);
          
          détailsValidation.push({
            ticketId: ticket.id,
            numeroTicket: ticket.numeroTicket,
            formule: ticket.formule,
            numerosJoues: numerosJoues,
            mise: ticket.mise,
            statut: nouveauStatut,
            isGagnant: isValid,
            nombreCorrespondances: matchingCount,
            raisonValidation: getRaisonValidation(ticket.formule, matchingCount, isValid)
          });
          
        } catch (ticketError) {
          console.error(`Erreur validation ticket ${ticket.id}:`, ticketError);
          // En cas d'erreur, marquer comme invalidé
          await ticket.update({ statut: 'invalidé' });
          invalidés++;
          
          détailsValidation.push({
            ticketId: ticket.id,
            numeroTicket: ticket.numeroTicket,
            statut: 'invalidé',
            erreur: 'Erreur lors de la validation'
          });
        }
      }
      
      // 5. Réponse détaillée
      res.status(200).json({
        message: `Validation terminée avec succès.`,
        jeu: {
          id: result.game.id,
          nom: result.game.nom,
          doubleChance: result.game.doubleChance
        },
        résultat: {
          numbers: result.numbers,
          numbers2: result.numbers2
        },
        statistiques: {
          total: tickets.length,
          validés,
          invalidés,
          tauxValidation: ((validés / tickets.length) * 100).toFixed(2) + '%'
        },
        détails: détailsValidation
      });
      
    } catch (error) {
      console.error('Erreur lors de la validation automatique des tickets :', error);
      res.status(500).json({ 
        message: "Erreur lors de la validation automatique des tickets.", 
        error: error.message 
      });
    }
  });
};

// Fonction utilitaire pour expliquer la raison de validation
function getRaisonValidation(formule, matchingCount, isValid) {
  if (!isValid) {
    return `Pas assez de correspondances (${matchingCount}) pour la formule ${formule}`;
  }
  
  switch (formule.toLowerCase()) {
    case 'directe':
      return 'Numéros sortis dans l\'ordre exact';
    case 'nap 3':
    case 'nap 4':
    case 'nap 5':
      return `Tous les numéros NAP trouvés`;
    case 'turbo 2':
    case 'turbo 3':
    case 'turbo 4':
      return `${matchingCount} correspondances trouvées (minimum requis atteint)`;
    default:
      return `${matchingCount} correspondances trouvées - ticket gagnant`;
  }
}