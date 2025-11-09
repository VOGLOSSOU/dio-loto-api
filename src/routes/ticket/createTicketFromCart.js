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

    // ENREGISTRER LE SOLDE AVANT DÉBIT
    const userBalanceAtCreation = user.solde;

    // Vérifier que l'utilisateur a suffisamment de solde (bonus + solde normal)
    const totalAvailable = user.bonus + user.solde;
    if (ticket.mise > totalAvailable) {
      await t.rollback();
      return res.status(400).json({
        message: "Solde insuffisant pour valider ce ticket.",
        ticketId: ticket.id,
        requiredAmount: ticket.mise,
        bonusDisponible: user.bonus,
        soldeDisponible: user.solde,
        totalDisponible: totalAvailable,
        missingAmount: ticket.mise - totalAvailable,
        suggestion: "Rechargez votre compte pour valider ce ticket."
      });
    }

    // Logique de débit : bonus d'abord, puis solde normal
    let remainingAmount = ticket.mise;
    let bonusUsed = 0;
    let soldeUsed = 0;

    // 1. Utiliser le bonus en priorité
    if (user.bonus > 0) {
      if (user.bonus >= remainingAmount) {
        // Bonus suffit
        bonusUsed = remainingAmount;
        user.bonus -= remainingAmount;
        remainingAmount = 0;
      } else {
        // Utiliser tout le bonus et compléter avec solde
        bonusUsed = user.bonus;
        remainingAmount -= user.bonus;
        user.bonus = 0;
      }
    }

    // 2. Compléter avec le solde normal si nécessaire
    if (remainingAmount > 0) {
      soldeUsed = remainingAmount;
      user.solde -= remainingAmount;
    }

    await user.save({ transaction: t });

    console.log(`💰 Validation panier - Bonus utilisé: ${bonusUsed} FCFA, Solde utilisé: ${soldeUsed} FCFA`);

    // Valider le ticket (le sortir du panier)
    ticket.isCart = false;
    ticket.userBalanceAtCreation = userBalanceAtCreation; // ← SOLDE AVANT DÉBIT
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
      newSolde: user.solde,
      newBonus: user.bonus,
      bonusUsed: bonusUsed || 0,
      soldeUsed: soldeUsed || 0
    });

  } catch (error) {
    // Vérifier si la transaction est déjà committée
    if (t.finished === 'commit') {
      console.error('Transaction déjà committée - pas de rollback nécessaire');
      return res.status(500).json({
        message: 'Erreur interne du serveur.',
        error: error.message,
        details: 'Transaction déjà finalisée'
      });
    }

    // Rollback seulement si la transaction n'est pas encore finalisée
    try {
      await t.rollback();
    } catch (rollbackError) {
      console.error('Erreur lors du rollback:', rollbackError.message);
    }

    console.error('Erreur lors de la validation du ticket panier:', error);
    return res.status(500).json({
      message: 'Erreur interne du serveur.',
      error: error.message
    });
  }
});

}