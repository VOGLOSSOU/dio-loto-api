const { Withdrawal } = require('../../db/sequelize');

module.exports = (app) => {
  app.delete('/api/withdrawals/:id/delete-if-traite', async (req, res) => {
    const id = req.params.id;

    try {
      // On cherche le retrait par ID
      const retrait = await Withdrawal.findByPk(id);

      // Vérification : retrait existe ?
      if (!retrait) {
        return res.status(404).json({ message: 'Retrait introuvable.' });
      }

      // Vérification : le statut est-il "traité" ?
      if (retrait.statut !== 'traité') {
        return res.status(400).json({ message: 'Ce retrait ne peut être supprimé que s’il est traité.' });
      }

      // Suppression du retrait
      await retrait.destroy();

      res.status(200).json({
        message: 'Retrait traité supprimé avec succès.',
        id: retrait.id
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du retrait :', error);
      res.status(500).json({ message: 'Erreur serveur.', error });
    }
  });
};