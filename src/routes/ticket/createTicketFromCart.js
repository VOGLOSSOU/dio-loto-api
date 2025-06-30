const { Ticket, Game, sequelize } = require('../../db/sequelize');

module.exports = (app) => {

// PATCH /api/tickets/:id/validate
app.patch('/api/tickets/:id/validate', async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket introuvable." });

  // Vérifier que le ticket est bien en panier
  if (!ticket.isCart) return res.status(400).json({ message: "Ce ticket n'est pas dans le panier." });

  // Vérifier que le jeu est ouvert
  const game = await Game.findOne({ where: { nom: ticket.nomJeu } });
  if (!game || game.statut !== 'ouvert') {
    await ticket.destroy();
    return res.status(400).json({ message: "Le jeu n'est plus disponible, ticket supprimé du panier." });
  }

  // Valider le ticket
  ticket.isCart = false;
  await ticket.save();
  return res.status(200).json({ message: "Ticket validé avec succès.", ticket });
});

}