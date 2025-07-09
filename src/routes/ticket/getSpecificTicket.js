const { Ticket, User } = require('../../db/sequelize');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/tickets/search', async (req, res) => {
    try {
      const { id, type, jeu, formule, exactMatch } = req.query;

      // Si aucun paramètre n'est fourni
      if (!id && !type && !jeu && !formule) {
        return res.status(400).json({
          message: "Au moins un critère de recherche est requis (id, type, jeu, ou formule)."
        });
      }

      // Construction dynamique des filtres
      const where = {
        [Op.and]: []
      };

      // Filtre par ID (recherche exacte uniquement)
      if (id) {
        // Si un ID est fourni, on peut ignorer les autres critères car l'ID est unique
        where[Op.and].push({ id: parseInt(id) });
      } else {
        // Filtres pour les autres critères seulement si pas d'ID

        // Filtre par type de jeu
        if (type) {
          if (exactMatch === 'true') {
            where[Op.and].push({ typeJeu: type });
          } else {
            where[Op.and].push({ typeJeu: { [Op.like]: `%${type}%` } });
          }
        }

        // Filtre par nom du jeu
        if (jeu) {
          if (exactMatch === 'true') {
            where[Op.and].push({ nomJeu: jeu });
          } else {
            where[Op.and].push({ nomJeu: { [Op.like]: `%${jeu}%` } });
          }
        }

        // Filtre par formule
        if (formule) {
          if (exactMatch === 'true') {
            where[Op.and].push({ formule: formule });
          } else {
            where[Op.and].push({ formule: { [Op.like]: `%${formule}%` } });
          }
        }
      }

      const tickets = await Ticket.findAll({
        where,
        order: [['created', 'DESC']],
        include: [
          {
            model: User,
            as: 'User',
            attributes: [
              'uniqueUserId',
              'firstName',
              'lastName',
              'email',
              'solde',
              'gain'
            ]
          }
        ]
      });

      // Message de réponse dynamique selon les critères utilisés
      let message = "Tickets trouvés selon les critères : ";
      const criteresUtilises = [];
      
      if (id) {
        criteresUtilises.push(`ID=${id}`);
      } else {
        if (type) criteresUtilises.push(`type=${type}`);
        if (jeu) criteresUtilises.push(`jeu=${jeu}`);
        if (formule) criteresUtilises.push(`formule=${formule}`);
      }
      
      message += criteresUtilises.join(', ');

      res.json({
        message: message,
        data: tickets,
        count: tickets.length,
        criteria: {
          id: id || null,
          type: type || null,
          jeu: jeu || null,
          formule: formule || null,
          exactMatch: exactMatch === 'true'
        }
      });

    } catch (error) {
      console.error('Erreur lors de la recherche de tickets:', error);
      res.status(500).json({
        message: "Erreur lors de la recherche des tickets.",
        error: error.message
      });
    }
  });

  // Route alternative pour récupérer un ticket par son ID spécifiquement
  app.get('/api/tickets/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const ticket = await Ticket.findByPk(id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: [
              'uniqueUserId',
              'firstName',
              'lastName',
              'email',
              'solde',
              'gain'
            ]
          }
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          message: `Aucun ticket trouvé avec l'ID ${id}.`
        });
      }

      res.json({
        message: `Ticket trouvé avec l'ID ${id}.`,
        data: ticket
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du ticket:', error);
      res.status(500).json({
        message: "Erreur lors de la récupération du ticket.",
        error: error.message
      });
    }
  });
};