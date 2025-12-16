// routes/getAllWithdrawals.js

const { Withdrawal, User } = require('../../db/sequelize');

module.exports = (app) => {
  /**
   * GET /api/withdrawals
   * Récupère toutes les demandes de retrait, avec filtres optionnels :
   *   - pays (exemple : ?pays=Benin)
   *   - reseauMobile (exemple : ?reseauMobile=MTN)
   *   - statut (exemple : ?statut=en%20cours%20de%20traitement ou ?statut=traité)
   *
   * Exemples d’URL valides :
   *   /api/withdrawals
   *   /api/withdrawals?pays=Benin
   *   /api/withdrawals?reseauMobile=Orange&statut=traité
   *   /api/withdrawals?pays=Togo&reseauMobile=Moov&statut=en%20cours%20de%20traitement
   */
  app.get('/api/withdrawals', async (req, res) => {
    try {
      // 1) Extraction des filtres depuis les query params
      const { pays, reseauMobile, statut } = req.query;
      const where = {};

      if (pays) {
        where.pays = pays;
      }
      if (reseauMobile) {
        where.reseauMobile = reseauMobile;
      }
      if (statut) {
        // On s'assure que la valeur passée est bien l’une des valeurs attendues
        if (['en cours de traitement', 'traité'].includes(statut)) {
          where.statut = statut;
        } else {
          return res
            .status(400)
            .json({ message: 'Le paramètre "statut" doit être "en cours de traitement" ou "traité".' });
        }
      }

      // 2) Requête Sequelize avec conditions dynamiques et inclusion de l'utilisateur
      const withdrawals = await Withdrawal.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['email'],
          required: false // LEFT JOIN
        }]
      });

      // 3) On mappe le résultat pour ne renvoyer que les champs utiles
      const result = withdrawals.map(w => ({
        id: w.id,
        uniqueId: w.uniqueId,
        uniqueUserId: w.uniqueUserId,
        fullName: w.fullName,
        email: w.user?.email || null, // Email de l'utilisateur
        pays: w.pays,
        reseauMobile: w.reseauMobile,
        phoneNumber: w.phoneNumber,
        montant: w.montant,
        statut: w.statut,
        created: w.created
      }));

      return res.status(200).json({
        message: 'Liste des retraits récupérée avec succès.',
        withdrawals: result
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des retraits :", error);
      return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  });
};