const { WithdrawalHistory } = require('../../db/sequelize');
const { Op } = require('sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * GET /api/withdrawals/archived
   * Récupère tous les retraits traités supprimés (archivés)
   * Pour affichage dans l'administration
   */
  app.get('/api/withdrawals/archived', auth, async (req, res) => {
    try {
      console.log('📦 Récupération des retraits archivés...');

      // Récupérer tous les retraits archivés
      const archivedWithdrawals = await WithdrawalHistory.findAll({
        order: [['deletedAt', 'DESC']], // Du plus récent au plus ancien
        attributes: [
          'id',
          'originalId',
          'uniqueId',
          'uniqueUserId',
          'fullName',
          'pays',
          'reseauMobile',
          'phoneNumber',
          'montant',
          'statut',
          'originalCreatedAt',
          'deletedAt',
          'created'
        ]
      });

      // Formater les données pour le frontend
      const formattedData = archivedWithdrawals.map(withdrawal => ({
        id: withdrawal.id,
        originalId: withdrawal.originalId,
        uniqueId: withdrawal.uniqueId,
        uniqueUserId: withdrawal.uniqueUserId,
        fullName: withdrawal.fullName,
        pays: withdrawal.pays,
        reseauMobile: withdrawal.reseauMobile,
        phoneNumber: withdrawal.phoneNumber,
        montant: parseFloat(withdrawal.montant),
        statut: withdrawal.statut,
        originalCreatedAt: withdrawal.originalCreatedAt,
        deletedAt: withdrawal.deletedAt,
        created: withdrawal.created,
        // Champs calculés pour l'affichage
        formattedOriginalDate: withdrawal.originalCreatedAt ?
          new Date(withdrawal.originalCreatedAt).toLocaleDateString('fr-FR') : null,
        formattedDeletedDate: withdrawal.deletedAt ?
          new Date(withdrawal.deletedAt).toLocaleDateString('fr-FR') : null,
        formattedOriginalTime: withdrawal.originalCreatedAt ?
          new Date(withdrawal.originalCreatedAt).toLocaleTimeString('fr-FR') : null,
        formattedDeletedTime: withdrawal.deletedAt ?
          new Date(withdrawal.deletedAt).toLocaleTimeString('fr-FR') : null
      }));

      // Statistiques
      const totalAmount = formattedData.reduce((sum, w) => sum + w.montant, 0);
      const totalCount = formattedData.length;

      // Grouper par pays
      const byCountry = formattedData.reduce((acc, withdrawal) => {
        const country = withdrawal.pays;
        if (!acc[country]) {
          acc[country] = { count: 0, totalAmount: 0 };
        }
        acc[country].count++;
        acc[country].totalAmount += withdrawal.montant;
        return acc;
      }, {});

      res.json({
        message: 'Retraits archivés récupérés avec succès.',
        data: formattedData,
        summary: {
          totalCount,
          totalAmount,
          byCountry,
          lastArchived: formattedData.length > 0 ? formattedData[0].deletedAt : null
        },
        explanation: {
          purpose: 'Historique des retraits traités supprimés pour maintenir l\'intégrité des calculs financiers',
          fields: {
            originalId: 'ID original dans la table Withdrawals',
            uniqueId: 'Identifiant unique du retrait',
            originalCreatedAt: 'Date de création originale du retrait',
            deletedAt: 'Date de suppression/archivage'
          }
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des retraits archivés:', error);
      res.status(500).json({
        message: 'Erreur lors de la récupération des retraits archivés.',
        error: error.message
      });
    }
  });
};