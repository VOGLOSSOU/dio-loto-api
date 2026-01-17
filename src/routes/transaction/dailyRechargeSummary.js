const { ResellerToUserTransaction, Reseller, User } = require('../../db/sequelize');
const moment = require('moment-timezone');
const { Op } = require('sequelize');

module.exports = (app) => {
  app.get('/api/transactions/reseller-to-user/daily-summary-2-days', async (req, res) => {
    try {
      const { startDate: startDateParam, endDate: endDateParam, days, date } = req.query;

      let startDate, endDate, totalDays;

      // Si dates spécifiques fournies
      if (startDateParam && endDateParam) {
        startDate = moment.tz(startDateParam, 'YYYY-MM-DD', 'Africa/Porto-Novo').startOf('day');
        endDate = moment.tz(endDateParam, 'YYYY-MM-DD', 'Africa/Porto-Novo').endOf('day');

        if (!startDate.isValid() || !endDate.isValid()) {
          return res.status(400).json({ message: 'Format de date invalide. Utilisez YYYY-MM-DD.' });
        }

        if (startDate.isAfter(endDate)) {
          return res.status(400).json({ message: 'La date de début doit être avant la date de fin.' });
        }

        totalDays = endDate.diff(startDate, 'days') + 1;
      }
      // Si nombre de jours fourni
      else if (days) {
        const numDays = parseInt(days);
        if (isNaN(numDays) || numDays < 1 || numDays > 365) {
          return res.status(400).json({ message: 'Le paramètre days doit être un nombre entre 1 et 365.' });
        }

        endDate = moment().tz('Africa/Porto-Novo').endOf('day');
        startDate = moment().tz('Africa/Porto-Novo').subtract(numDays - 1, 'days').startOf('day');
        totalDays = numDays;
      }
      // Si une date unique fournie
      else if (date) {
        const singleDate = moment.tz(date, 'YYYY-MM-DD', 'Africa/Porto-Novo');
        if (!singleDate.isValid()) {
          return res.status(400).json({ message: 'Format de date invalide. Utilisez YYYY-MM-DD.' });
        }

        startDate = singleDate.clone().startOf('day');
        endDate = singleDate.clone().endOf('day');
        totalDays = 1;
      }
      // Par défaut : 2 derniers jours
      else {
        endDate = moment().tz('Africa/Porto-Novo').endOf('day');
        startDate = moment().tz('Africa/Porto-Novo').subtract(1, 'days').startOf('day');
        totalDays = 2;
      }

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

      // Pour chaque revendeur, calculer ses stats sur la période
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
          const currentDate = startDate.clone().add(i, 'days');
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
        message: `Résumé par revendeur des transactions reseller-to-user sur ${totalDays} jour${totalDays > 1 ? 's' : ''}`,
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