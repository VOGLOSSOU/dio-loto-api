const { Withdrawal, User, sequelize } = require('../../db/sequelize');

module.exports = (app) => {
  app.post('/api/withdrawals', async (req, res) => {
    const {
      uniqueUserId,
      fullName,
      pays,
      reseauMobile,
      phoneNumber,
      montant: montantRaw
    } = req.body;

    // 1) Vérification rapide des champs
    if (
      !uniqueUserId ||
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
      // 2a) On récupère l’utilisateur, verrouillé pour toute la durée de la transaction
      // (sérialise les demandes concurrentes du même utilisateur)
      const user = await User.findOne({
        where: { uniqueUserId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // 2b) Bloquer une nouvelle demande tant qu'une précédente n'est pas traitée
      // (lecture verrouillée : voit l'état réellement commité, pas un instantané périmé)
      const retraitEnCours = await Withdrawal.findOne({
        where: { uniqueUserId, statut: 'en cours de traitement' },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      if (retraitEnCours) {
        await t.rollback();
        return res.status(400).json({
          message: "Vous avez déjà une demande de retrait en cours de traitement. Veuillez attendre qu'elle soit traitée avant d'en soumettre une nouvelle.",
          retraitEnCours: {
            uniqueId: retraitEnCours.uniqueId,
            montant: retraitEnCours.montant,
            created: retraitEnCours.created
          }
        });
      }

      // 2c) Vérification du gain disponible
      if (montant > user.gain) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Le montant demandé dépasse le gain disponible." });
      }

      // 2d) On débite le gain de l'utilisateur
      user.gain -= montant;
      await user.save({ transaction: t });

      // 2e) On crée la demande de retrait
      const withdrawal = await Withdrawal.create(
        {
          uniqueUserId,
          fullName,
          pays,
          reseauMobile,
          phoneNumber,
          montant,
          statut: 'en cours de traitement'
        },
        { transaction: t }
      );

      // 2f) Si tout s’est bien passé, on commit
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