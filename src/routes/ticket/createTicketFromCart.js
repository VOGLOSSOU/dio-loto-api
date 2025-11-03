const { Ticket, Game, User, sequelize } = require('../../db/sequelize');

module.exports = (app) => {

// PATCH /api/tickets/:id/validate
app.patch('/api/tickets/:id/validate', async (req, res) => {
  // Démarrage de la transaction pour cohérence
  const t = await sequelize.transaction();

  try {
    const ticket = await Ticket.findByPk(req.params.id, { transaction: t });
    if (!ticket) {
      await t.rollback();
      return res.status(404).json({ message: "Ticket introuvable." });
    }

    // Vérifier que le ticket est bien en panier
    if (!ticket.isCart) {
      await t.rollback();
      return res.status(400).json({ message: "Ce ticket n'est pas dans le panier." });
    }

    // Vérifier que le jeu est ouvert
    const game = await Game.findOne({ where: { nom: ticket.nomJeu }, transaction: t });
    if (!game || game.statut !== 'ouvert') {
      await ticket.destroy({ transaction: t });
      await t.commit();
      return res.status(400).json({ message: "Le jeu n'est plus disponible, ticket supprimé du panier." });
    }

    // Récupérer l'utilisateur pour vérifier le solde
    const user = await User.findOne({ where: { uniqueUserId: ticket.uniqueUserId }, transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Vérifier que l'utilisateur a suffisamment de solde
    if (ticket.mise > user.solde) {
      await ticket.destroy({ transaction: t });
      await t.commit();
      return res.status(400).json({
        message: "Solde insuffisant pour valider ce ticket. Ticket supprimé du panier."
      });
    }

    // Débiter le solde de l'utilisateur
    user.solde -= ticket.mise;
    await user.save({ transaction: t });

    // Valider le ticket (le sortir du panier)
    ticket.isCart = false;
    await ticket.save({ transaction: t });

    // Commit de la transaction
    await t.commit();

    return res.status(200).json({
      message: "Ticket validé avec succès.",
      ticket: {
        id: ticket.id,
        numeroTicket: ticket.numeroTicket,
        nomJeu: ticket.nomJeu,
        mise: ticket.mise,
        isCart: ticket.isCart,
        statut: ticket.statut
      },
      newSolde: user.solde
    });

  } catch (error) {
    await t.rollback();
    console.error('Erreur lors de la validation du ticket panier:', error);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: error.message
    });
  }
});

}