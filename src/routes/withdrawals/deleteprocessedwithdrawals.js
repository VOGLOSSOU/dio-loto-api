const { Withdrawal, WithdrawalHistory, sequelize } = require('../../db/sequelize');

module.exports = (app) => {
  app.delete('/api/withdrawals/:id/delete-if-traite', async (req, res) => {
    const id = req.params.id;

    const t = await sequelize.transaction();
    try {
      // On cherche le retrait par ID
      const retrait = await Withdrawal.findByPk(id, { transaction: t });

      // Vérification : retrait existe ?
      if (!retrait) {
        await t.rollback();
        return res.status(404).json({ message: 'Retrait introuvable.' });
      }

      // Vérification : le statut est-il "traité" ?
      if (retrait.statut !== 'traité') {
        await t.rollback();
        return res.status(400).json({ message: 'Ce retrait ne peut être supprimé que s\'il est traité.' });
      }

      // Archiver le retrait dans l'historique AVANT suppression
      await WithdrawalHistory.create({
        originalId: retrait.id,
        uniqueId: retrait.uniqueId,
        uniqueUserId: retrait.uniqueUserId,
        fullName: retrait.fullName,
        pays: retrait.pays,
        reseauMobile: retrait.reseauMobile,
        phoneNumber: retrait.phoneNumber,
        montant: retrait.montant,
        statut: retrait.statut
      }, { transaction: t });

      // Suppression du retrait
      await retrait.destroy({ transaction: t });

      await t.commit();
      res.status(200).json({
        message: 'Retrait traité archivé et supprimé avec succès.',
        archivedAmount: retrait.montant,
        id: retrait.id
      });
    } catch (error) {
      await t.rollback();
      console.error('Erreur lors de la suppression du retrait :', error);
      res.status(500).json({ message: 'Erreur serveur.', error });
    }
  });
};