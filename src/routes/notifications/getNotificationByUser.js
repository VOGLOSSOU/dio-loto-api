const { Notification, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * GET /api/notifications/user/:userId
   * Récupère toutes les notifications d'un utilisateur spécifique
   * Paramètres optionnels via query:
   * - type: filtrer par type de notification
   * - limit: nombre maximum de notifications à retourner (défaut: 50)
   * - offset: décalage pour la pagination (défaut: 0)
   */
  app.get('/api/notifications/user/:userId', auth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { type, limit = 50, offset = 0 } = req.query;

      // Vérification que l'utilisateur existe
      const user = await User.findOne({ where: { uniqueUserId: userId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Construction des conditions de recherche
      const whereConditions = { userId };
      if (type) {
        whereConditions.type = type;
      }

      // Récupération des notifications avec pagination
      const notifications = await Notification.findAndCountAll({
        where: whereConditions,
        order: [['created', 'DESC']], // Plus récentes en premier
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Statistiques des notifications
      const stats = await Notification.findAll({
        where: { userId },
        attributes: [
          'type',
          [Notification.sequelize.fn('COUNT', Notification.sequelize.col('type')), 'count']
        ],
        group: ['type']
      });

      res.status(200).json({
        message: `Notifications de l'utilisateur récupérées avec succès.`,
        user: {
          uniqueUserId: user.uniqueUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        pagination: {
          total: notifications.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < notifications.count
        },
        statistics: stats.reduce((acc, stat) => {
          acc[stat.type] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        notifications: notifications.rows
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors de la récupération des notifications.',
        error: error.message
      });
    }
  });
};