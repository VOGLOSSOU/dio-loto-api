const { Notification, User } = require('../../db/sequelize');
const { Op } = require('sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * DELETE /api/notifications/:id
   * Supprime une notification spécifique
   */
  app.delete('/api/notifications/:id', auth, async (req, res) => {
    try {
      const { id } = req.params;

      // Vérification que la notification existe
      const notification = await Notification.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['uniqueUserId', 'firstName', 'lastName', 'email'],
          required: false
        }]
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification introuvable." });
      }

      // Sauvegarder les informations avant suppression
      const deletedNotification = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        created: notification.created,
        user: notification.user
      };

      // Suppression de la notification
      await notification.destroy();

      res.status(200).json({
        message: 'Notification supprimée avec succès.',
        deletedNotification
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors de la suppression de la notification.',
        error: error.message
      });
    }
  });


};