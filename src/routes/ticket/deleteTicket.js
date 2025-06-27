const { Ticket } = require('../../db/sequelize');

module.exports = (app) => {
  app.delete('/api/tickets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findByPk(id);

      if (!ticket) {
        return res.status(404).json({ message: "Ticket introuvable." });
      }

      await ticket.destroy();

      res.json({ message: "Ticket supprimé définitivement." });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du ticket.", error });
    }
  });
};