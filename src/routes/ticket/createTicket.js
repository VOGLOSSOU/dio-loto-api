const { Ticket, User } = require('../../db/sequelize');

module.exports = (app) => {
  app.post('/api/tickets', async (req, res) => {
    try {
      const {
        uniqueUserId,
        heureJeu,
        nomJeu,
        typeJeu,
        numerosJoues,
        formule,
        mise,
        gain
      } = req.body;

      // Vérification des champs obligatoires
      if (
        !uniqueUserId ||
        !heureJeu ||
        !nomJeu ||
        !typeJeu ||
        !numerosJoues ||
        !formule ||
        !mise ||
        gain === undefined
      ) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
      }

      // Vérification de la plage de mise
      if (mise < 10 || mise > 5000) {
        return res.status(400).json({ message: 'La mise doit être comprise entre 10 et 5000 FCFA.' });
      }

      // Vérification du solde utilisateur
      const user = await User.findOne({ where: { uniqueUserId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
      if (mise > user.solde) {
        return res.status(400).json({ message: "La mise dépasse le solde disponible." });
      }

      // Création du ticket
      const ticket = await Ticket.create({
        uniqueUserId,
        heureJeu,
        nomJeu,
        typeJeu,
        numerosJoues: Array.isArray(numerosJoues) ? JSON.stringify(numerosJoues) : numerosJoues,
        formule,
        mise,
        gain,
        statut: "en cours de traitement"
      });

      res.status(201).json({ message: "Ticket enregistré avec succès.", ticket });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du ticket :', error);
      res.status(500).json({ message: 'Erreur lors de l\'enregistrement du ticket.', error: error.message });
    }
  });
};