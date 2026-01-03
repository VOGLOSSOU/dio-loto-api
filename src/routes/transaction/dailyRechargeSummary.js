const { ResellerToUserTransaction, Reseller, User } = require('../../db/sequelize');
const moment = require('moment-timezone');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/transactions/reseller-to-user/daily-summary-2-days', async (req, res) => {
    try {
      // Calculer la période : 2 derniers jours
      const endDate = moment().tz('Africa/Porto-Novo').endOf('day');
      const startDate = moment().tz('Africa/Porto-Novo').subtract(1, 'days').startOf('day');
      const totalDays = 2;

      // Récupérer tous les revendeurs actifs avec leurs infos utilisateur
      const activeResellers = await Reseller.findAll({
        where: { status: 'actif' },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }],
        raw: true,
        nest: true
      });

      const resellersData = [];

      // Pour chaque revendeur, calculer ses stats sur 7 jours
      for (const reseller of activeResellers) {
        // Récupérer les transactions de ce revendeur sur la période avec plus d'infos
        const transactions = await ResellerToUserTransaction.findAll({
          where: {
            sender: reseller.uniqueResellerId,
            created: {
              [Op.between]: [startDate.toDate(), endDate.toDate()]
            }
          },
          attributes: ['uniqueTransacId', 'created', 'money', 'status', 'receiver'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }],
          raw: true,
          nest: true
        });

        // Grouper par jour pour ce revendeur
        const dailyStats = {};
        let periodTotalTransactions = 0;
        let periodTotalAmount = 0;
        let periodTotalValidated = 0;
        let periodTotalInvalidated = 0;

        transactions.forEach(transaction => {
          const date = moment(transaction.created).tz('Africa/Porto-Novo').format('YYYY-MM-DD');

          if (!dailyStats[date]) {
            dailyStats[date] = {
              transactions: 0,
              amount: 0,
              validated: 0,
              invalidated: 0,
              validatedTransactions: [] // Liste des transactions validées détaillées
            };
          }

          dailyStats[date].transactions++;
          if (transaction.status === 'validé') {
            dailyStats[date].amount += transaction.money;
            dailyStats[date].validated++;

            // Ajouter la transaction détaillée à la liste
            dailyStats[date].validatedTransactions.push({
              uniqueTransacId: transaction.uniqueTransacId,
              date: transaction.created,
              amount: transaction.money,
              receiverUser: {
                uniqueUserId: transaction.receiver,
                firstName: transaction.user?.firstName || 'N/A',
                lastName: transaction.user?.lastName || 'N/A',
                email: transaction.user?.email || 'N/A'
              }
            });

            periodTotalAmount += transaction.money;
            periodTotalValidated++;
          } else if (transaction.status === 'invalidé') {
            dailyStats[date].invalidated++;
            periodTotalInvalidated++;
          }
          periodTotalTransactions++;
        });

        // Créer le breakdown quotidien (même jours sans transaction)
        const dailyBreakdown = [];
        for (let i = totalDays - 1; i >= 0; i--) {
          const currentDate = moment().tz('Africa/Porto-Novo').subtract(i, 'days');
          const dateKey = currentDate.format('YYYY-MM-DD');
          const stats = dailyStats[dateKey] || {
            transactions: 0,
            amount: 0,
            validated: 0,
            invalidated: 0
          };

          dailyBreakdown.push({
            date: dateKey,
            dateFormatted: currentDate.format('DD/MM/YYYY'),
            transactions: stats.transactions,
            amount: stats.amount,
            validated: stats.validated,
            invalidated: stats.invalidated,
            validatedTransactions: stats.validatedTransactions || []
          });
        }

        // Calculer les moyennes pour ce revendeur
        const averageDailyTransactions = periodTotalTransactions / totalDays;
        const averageDailyAmount = periodTotalAmount / totalDays;

        resellersData.push({
          resellerId: reseller.uniqueResellerId,
          resellerName: `${reseller.user.firstName} ${reseller.user.lastName}`,
          pseudo: reseller.pseudo,
          pays: reseller.pays,
          periodStats: {
            totalTransactions: periodTotalTransactions,
            totalAmount: periodTotalAmount,
            totalValidated: periodTotalValidated,
            totalInvalidated: periodTotalInvalidated,
            averageDailyTransactions: parseFloat(averageDailyTransactions.toFixed(1)),
            averageDailyAmount: parseFloat(averageDailyAmount.toFixed(2))
          },
          dailyBreakdown
        });
      }

      // Trier par montant total décroissant (revendeurs les plus actifs en premier)
      resellersData.sort((a, b) => b.periodStats.totalAmount - a.periodStats.totalAmount);

      res.json({
        message: "Résumé par revendeur des transactions reseller-to-user sur 2 jours",
        period: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          totalDays: totalDays
        },
        totalResellers: resellersData.length,
        resellers: resellersData
      });

    } catch (error) {
      console.error("Erreur lors de la récupération du résumé par revendeur :", error);
      res.status(500).json({ message: "Erreur lors de la récupération du résumé par revendeur.", error: error.message });
    }
  });
};