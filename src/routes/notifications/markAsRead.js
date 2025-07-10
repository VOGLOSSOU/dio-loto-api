const { Notification, User } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * PATCH /api/notifications/:id/read
   * Marque une notification comme lue ou non lue
   * Body: { isRead: boolean } (optionnel, défaut: true)
   */
  app.patch('/api/notifications/:id/read', auth, async (req, res) => {
    try {
      const { id } = req.params;
      const { isRead = true } = req.body;

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

      // Mise à jour du statut de lecture
      // Note: Le champ 'isRead' doit être ajouté au modèle Notification
      await notification.update({
        isRead: Boolean(isRead),
        readAt: isRead ? new Date() : null // Timestamp de lecture
      });

      res.status(200).json({
        message: `Notification marquée comme ${isRead ? 'lue' : 'non lue'} avec succès.`,
        notification: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          readAt: notification.readAt,
          created: notification.created,
          user: notification.user
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors de la mise à jour de la notification.',
        error: error.message
      });
    }
  });


};