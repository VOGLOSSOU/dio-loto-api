const { Withdrawal, User, sequelize } = require('../../db/sequelize');

module.exports = (app) => {
  app.post('/api/withdrawals', async (req, res) => {
    const {
      userUniqueId,
      fullName,
      pays,
      reseauMobile,
      phoneNumber,
      montant: montantRaw
    } = req.body;

    // 1) Vérification rapide des champs
    if (
      !userUniqueId ||
      !fullName ||
      !pays ||
      !reseauMobile ||
      !phoneNumber ||
      montantRaw == null
    ) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const montant = Number(montantRaw);
    if (isNaN(montant) || montant < 2000 || montant > 200000) {
      return res
        .status(400)
        .json({ message: 'Le montant de retrait doit être un nombre entre 2 000 et 200 000.' });
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

      // 2b) Vérification du gain disponible
      if (montant > user.gain) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Le montant demandé dépasse le gain disponible." });
      }

      // 2c) On débite le gain de l'utilisateur
      user.gain -= montant;
      await user.save({ transaction: t });

      // 2d) On crée la demande de retrait
      const withdrawal = await Withdrawal.create(
        {
          userUniqueId,
          fullName,
          pays,
          reseauMobile,
          phoneNumber,
          montant,
          statut: 'en cours de traitement'
        },
        { transaction: t }
      );

      // 2e) Si tout s’est bien passé, on commit
      await t.commit();
      return res.status(201).json({
        message: "Demande de retrait enregistrée avec succès.",
        withdrawal: {
          id: withdrawal.id,
          uniqueId: withdrawal.uniqueId,
          fullName: withdrawal.fullName,
          pays: withdrawal.pays,
          reseauMobile: withdrawal.reseauMobile,
          phoneNumber: withdrawal.phoneNumber,
          montant: withdrawal.montant,
          created: withdrawal.created
        },
        newGain: user.gain
      });
    } catch (error) {
      // En cas d’erreur, on annule la transaction
      await t.rollback();
      console.error('Erreur lors de l\'enregistrement du retrait :', error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};