const { Notification, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {

  /**
   * PATCH /api/notifications/user/:userId/mark-all-read
   * Marque toutes les notifications d'un utilisateur comme lues
   */
  app.patch('/api/notifications/user/:userId/mark-all-read', auth, async (req, res) => {
    try {
      const { userId } = req.params;

      // Vérification que l'utilisateur existe
      const user = await User.findOne({ where: { uniqueUserId: userId } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }

      // Marquer toutes les notifications non lues de cet utilisateur comme lues
      const [updatedCount] = await Notification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            userId: userId,
            isRead: false // Seulement les non lues
          }
        }
      );

      // Compter le total de notifications de cet utilisateur
      const totalNotifications = await Notification.count({
        where: { userId: userId }
      });

      res.status(200).json({
        message: `${updatedCount} notification(s) marquée(s) comme lue(s) avec succès.`,
        user: {
          uniqueUserId: user.uniqueUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        statistics: {
          markedAsRead: updatedCount,
          totalNotifications: totalNotifications
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors de la mise à jour des notifications.',
        error: error.message
      });
    }
  });

};