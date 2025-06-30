const { Ticket, User, sequelize } = require('../../db/sequelize');

module.exports = (app) => {
  app.post('/api/tickets', async (req, res) => {
    const {
      uniqueUserId,
      heureJeu,
      nomJeu,
      typeJeu,
      numerosJoues,
      formule,
      mise: miseRaw,
      gain: gainRaw,
      isCart 
    } = req.body;

    // 1) Vérification rapide des champs (à adapter ou extraire en middleware)
    if (!uniqueUserId || !heureJeu || !nomJeu || !typeJeu || !numerosJoues || !formule || miseRaw == null || gainRaw == null) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }
    const mise = Number(miseRaw);
    if (isNaN(mise) || mise < 10 || mise > 5000) {
      return res.status(400).json({ message: 'La mise doit être un nombre entre 10 et 5000.' });
    }

    // 2) Démarrage de la transaction
    const t = await sequelize.transaction();
    try {
      // 2a) On récupère l’utilisateur (dans la même transaction)
      const user = await User.findOne({ where: { uniqueUserId }, transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
      if (mise > user.solde) {
        await t.rollback();
        return res.status(400).json({ message: "La mise dépasse le solde disponible." });
      }

      // 2b) On débite le solde de l'utilisateur
      user.solde -= mise;
      await user.save({ transaction: t });

      // 2c) On crée le ticket
      const ticket = await Ticket.create({
        uniqueUserId,
        heureJeu: new Date(heureJeu),
        nomJeu,
        typeJeu,
        numerosJoues: Array.isArray(numerosJoues) ? JSON.stringify(numerosJoues) : numerosJoues,
        formule,
        mise,
        gain: Number(gainRaw),
        isCart: isCart === undefined ? false : isCart // par défaut false si non fourni
      }, { transaction: t });

      // 2d) Si tout s’est bien passé, on commit
      await t.commit();
      return res.status(201).json({
        message: "Ticket enregistré avec succès.",
        ticket: {
          id: ticket.id,
          heureJeu: ticket.heureJeu,
          nomJeu: ticket.nomJeu,
          mise: ticket.mise,
          gain: ticket.gain,
          statut: ticket.statut
        },
        newSolde: user.solde
      });
    } catch (error) {
      // En cas d’erreur, on annule la transaction
      await t.rollback();
      console.error('Erreur lors de l\'enregistrement du ticket :', error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};