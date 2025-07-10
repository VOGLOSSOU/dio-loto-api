const { Notification, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
    
  /**
   * GET /api/notifications/user/:userId/unread-count
   * Récupère le nombre de notifications non lues d'un utilisateur
   */
  app.get('/api/notifications/user/:userId/unread-count', auth, async (req, res) => {
    try {
      const { userId } = req.params;

      // Vérification que l'utilisateur existe
      const user = await User.findOne({ where: { uniqueUserId: userId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Compter les notifications non lues
      const unreadCount = await Notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });

      // Compter par type de notification non lue
      const unreadByType = await Notification.findAll({
        where: {
          userId: userId,
          isRead: false
        },
        attributes: [
          'type',
          [Notification.sequelize.fn('COUNT', Notification.sequelize.col('type')), 'count']
        ],
        group: ['type']
      });

      res.status(200).json({
        message: 'Nombre de notifications non lues récupéré avec succès.',
        user: {
          uniqueUserId: user.uniqueUserId,
          firstName: user.firstName,
          lastName: user.lastName
        },
        unreadCount: unreadCount,
        unreadByType: unreadByType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors du comptage des notifications.',
        error: error.message
      });
    }
  });
};