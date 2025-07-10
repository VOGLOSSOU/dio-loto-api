const { Notification, User } = require('../../db/sequelize');
const { Op } = require('sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  /**
   * GET /api/notifications
   * Récupère toutes les notifications du système (pour les administrateurs)
   * Paramètres optionnels via query:
   * - type: filtrer par type de notification
   * - userId: filtrer par utilisateur spécifique
   * - dateFrom: notifications à partir de cette date (YYYY-MM-DD)
   * - dateTo: notifications jusqu'à cette date (YYYY-MM-DD)
   * - limit: nombre maximum de notifications à retourner (défaut: 100)
   * - offset: décalage pour la pagination (défaut: 0)
   * - search: recherche dans le titre ou message
   */
  app.get('/api/notifications', auth, async (req, res) => {
    try {
      const {
        type,
        userId,
        dateFrom,
        dateTo,
        limit = 100,
        offset = 0,
        search
      } = req.query;

      // Construction des conditions de recherche
      const whereConditions = {};

      if (type) {
        whereConditions.type = type;
      }

      if (userId) {
        whereConditions.userId = userId;
      }

      if (dateFrom || dateTo) {
        whereConditions.created = {};
        if (dateFrom) {
          whereConditions.created[Op.gte] = new Date(dateFrom + 'T00:00:00');
        }
        if (dateTo) {
          whereConditions.created[Op.lte] = new Date(dateTo + 'T23:59:59');
        }
      }

      if (search) {
        whereConditions[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { message: { [Op.like]: `%${search}%` } }
        ];
      }

      // Récupération des notifications avec informations utilisateur
      const notifications = await Notification.findAndCountAll({
        where: whereConditions,
        include: [{
          model: User,
          as: 'user',
          attributes: ['uniqueUserId', 'firstName', 'lastName', 'email'],
          required: false // LEFT JOIN pour éviter d'exclure les notifications d'utilisateurs supprimés
        }],
        order: [['created', 'DESC']], // Plus récentes en premier
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Statistiques globales des notifications
      const globalStats = await Notification.findAll({
        attributes: [
          'type',
          [Notification.sequelize.fn('COUNT', Notification.sequelize.col('type')), 'count']
        ],
        group: ['type']
      });

      // Statistiques par période (dernières 24h, 7 jours, 30 jours)
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [count24h, count7days, count30days] = await Promise.all([
        Notification.count({ where: { created: { [Op.gte]: last24h } } }),
        Notification.count({ where: { created: { [Op.gte]: last7days } } }),
        Notification.count({ where: { created: { [Op.gte]: last30days } } })
      ]);

      res.status(200).json({
        message: 'Toutes les notifications récupérées avec succès.',
        pagination: {
          total: notifications.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < notifications.count
        },
        statistics: {
          byType: globalStats.reduce((acc, stat) => {
            acc[stat.type] = parseInt(stat.dataValues.count);
            return acc;
          }, {}),
          byPeriod: {
            last24hours: count24h,
            last7days: count7days,
            last30days: count30days
          }
        },
        filters: {
          type,
          userId,
          dateFrom,
          dateTo,
          search
        },
        notifications: notifications.rows
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les notifications :', error);
      res.status(500).json({
        message: 'Une erreur est survenue lors de la récupération des notifications.',
        error: error.message
      });
    }
  });
};