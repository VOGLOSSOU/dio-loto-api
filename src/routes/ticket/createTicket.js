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
      gains: gainRaw,
      isCart
    } = req.body;

    // 1) Vérification rapide des champs
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
      // 2a) On récupère l'utilisateur
      const user = await User.findOne({ where: { uniqueUserId }, transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // 2b) Vérification du solde SEULEMENT pour création directe
      if (!isCart) {
        // Mode création directe : solde obligatoire
        if (mise > user.solde) {
          await t.rollback();
          return res.status(400).json({ 
            message: "Solde insuffisant pour créer le ticket directement." 
          });
        }
        
        // Débiter le solde pour création directe
        user.solde -= mise;
        await user.save({ transaction: t });
      }
      // Si isCart = true : pas de vérification ni de débit du solde

      // 2c) On crée le ticket
      const ticket = await Ticket.create({
        uniqueUserId,
        heureJeu: new Date(heureJeu),
        nomJeu,
        typeJeu,
        numerosJoues: Array.isArray(numerosJoues) ? JSON.stringify(numerosJoues) : numerosJoues,
        formule,
        mise,
        gains: Number(gainRaw),
        isCart: isCart === undefined ? false : isCart
      }, { transaction: t });

      // 2d) Commit de la transaction
      await t.commit();
      
      const response = {
        message: isCart ? "Ticket ajouté au panier avec succès." : "Ticket enregistré et validé avec succès.",
        ticket: {
          id: ticket.id,
          heureJeu: ticket.heureJeu,
          nomJeu: ticket.nomJeu,
          mise: ticket.mise,
          gains: ticket.gains,
          statut: ticket.statut,
          isCart: ticket.isCart
        }
      };

      // Ajouter le nouveau solde seulement si on a débité
      if (!isCart) {
        response.newSolde = user.solde;
      }

      return res.status(201).json(response);

    } catch (error) {
      await t.rollback();
      console.error('Erreur lors de l\'enregistrement du ticket :', error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};