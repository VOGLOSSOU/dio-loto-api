const { Withdrawal, sequelize } = require('../../db/sequelize');

module.exports = (app) => {
  /**
   * PUT /api/withdrawals/:uniqueId/mark-as-processed
   * Passe le retrait de "en cours de traitement" → "traité"
   */
  app.put('/api/withdrawals/:uniqueId/mark-as-processed', async (req, res) => {
    const { uniqueId } = req.params;

    try {
      // 1) On récupère la demande de retrait
      const withdrawal = await Withdrawal.findOne({ where: { uniqueId } });
      if (!withdrawal) {
        return res.status(404).json({ message: "Demande de retrait non trouvée." });
      }

      // 2) Vérifier qu’elle est encore en cours (optionnel)
      if (withdrawal.statut !== 'en cours de traitement') {
        return res.status(400).json({ message: "Ce retrait est déjà traité ou dans un état invalide." });
      }

      // 3) Mettre à jour le statut
      withdrawal.statut = 'traité';
      await withdrawal.save();

      return res.status(200).json({
        message: "Le statut du retrait a été mis à jour en \"traité\".",
        withdrawal: {
          id: withdrawal.id,
          uniqueId: withdrawal.uniqueId,
          statut: withdrawal.statut
        }
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut du retrait :", error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};