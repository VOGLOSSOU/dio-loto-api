const { User, Admin, ResellerToUserTransaction, AdminToUserTransaction, UserToUserTransaction, Ticket, Withdrawal } = require('../../db/sequelize');
const { authenticateToken } = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/users/audit', authenticateToken, async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ message: 'Le paramètre email est requis.' });
      }

      // 1. Trouver l'utilisateur par email
      const user = await User.findOne({
        where: { email },
        attributes: ['uniqueUserId', 'firstName', 'lastName', 'email', 'solde', 'gain', 'created']
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
      }

      const userId = user.uniqueUserId;
      const auditPeriod = {
        from: user.created, // Date d'inscription
        to: new Date() // Maintenant
      };

      // 2. Récupérer toutes les transactions reçues (Reseller → User)
      const receivedFromResellers = await ResellerToUserTransaction.findAll({
        where: { receiver: userId },
        include: [
          {
            model: User,
            as: 'senderUser',
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['created', 'DESC']]
      });

      // 3. Récupérer toutes les transactions reçues (Admin → User)
      const receivedFromAdmins = await AdminToUserTransaction.findAll({
        where: { userReceiver: userId },
        include: [
          {
            model: Admin,
            as: 'admin',
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['created', 'DESC']]
      });

      // 4. Récupérer toutes les transactions envoyées (User → User)
      const sentToUsers = await UserToUserTransaction.findAll({
        where: { sender: userId },
        include: [
          {
            model: User,
            as: 'receiverUser',
            attributes: ['firstName', 'lastName', 'email']
          }
        ],
        order: [['created', 'DESC']]
      });

      // 5. Récupérer tous les tickets
      const tickets = await Ticket.findAll({
        where: { uniqueUserId: userId },
        order: [['created', 'DESC']]
      });

      // 6. Récupérer tous les retraits
      const withdrawals = await Withdrawal.findAll({
        where: { userId },
        order: [['created', 'DESC']]
      });

      // 7. Calculs des totaux
      const totalReceivedFromResellers = receivedFromResellers
        .filter(t => t.status === 'validé')
        .reduce((sum, t) => sum + t.money, 0);

      const totalReceivedFromAdmins = receivedFromAdmins
        .filter(t => t.status === 'validé')
        .reduce((sum, t) => sum + t.money, 0);

      const totalSentToUsers = sentToUsers
        .filter(t => t.status === 'validé')
        .reduce((sum, t) => sum + t.money, 0);

      const totalWithdrawn = withdrawals
        .filter(w => w.status === 'processed')
        .reduce((sum, w) => sum + w.amount, 0);

      const totalBet = tickets.reduce((sum, t) => sum + t.mise, 0);
      const totalWon = tickets
        .filter(t => t.statut === 'attribué')
        .reduce((sum, t) => {
          const gains = t.gains;
          if (typeof gains === 'string') {
            try {
              const parsed = JSON.parse(gains);
              return sum + (parsed.attribue || 0);
            } catch {
              return sum;
            }
          }
          return sum + (gains?.attribue || 0);
        }, 0);

      // 8. Structure de réponse
      const response = {
        user: {
          uniqueUserId: user.uniqueUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          currentSolde: user.solde,
          totalGain: user.gain || 0,
          registrationDate: user.created
        },
        auditPeriod,
        financialSummary: {
          totalReceived: totalReceivedFromResellers + totalReceivedFromAdmins,
          totalSent: totalSentToUsers,
          totalWithdrawn,
          netFinancial: (totalReceivedFromResellers + totalReceivedFromAdmins) - (totalSentToUsers + totalWithdrawn)
        },
        gamingSummary: {
          totalTickets: tickets.length,
          totalBet,
          totalWon,
          winningTickets: tickets.filter(t => t.statut === 'attribué').length,
          netGaming: totalWon - totalBet
        },
        detailedData: {
          receivedTransactions: {
            fromResellers: receivedFromResellers.map(t => ({
              uniqueTransacId: t.uniqueTransacId,
              amount: t.money,
              status: t.status,
              date: t.created,
              sender: {
                uniqueUserId: t.sender,
                firstName: t.senderUser?.firstName || 'N/A',
                lastName: t.senderUser?.lastName || 'N/A',
                email: t.senderUser?.email || 'N/A'
              }
            })),
            fromAdmins: receivedFromAdmins.map(t => ({
              uniqueTransacId: t.uniqueTransacId,
              amount: t.money,
              status: t.status,
              date: t.created,
              sender: {
                uniqueUserId: t.adminSender,
                firstName: t.admin?.firstName || 'N/A',
                lastName: t.admin?.lastName || 'N/A',
                email: t.admin?.email || 'N/A'
              }
            }))
          },
          sentTransactions: sentToUsers.map(t => ({
            uniqueTransacId: t.uniqueTransacId,
            amount: t.money,
            status: t.status,
            date: t.created,
            receiver: {
              uniqueUserId: t.receiver,
              firstName: t.receiverUser?.firstName || 'N/A',
              lastName: t.receiverUser?.lastName || 'N/A',
              email: t.receiverUser?.email || 'N/A'
            }
          })),
          tickets: tickets.map(t => ({
            numeroTicket: t.numeroTicket,
            nomJeu: t.nomJeu,
            typeJeu: t.typeJeu,
            formule: t.formule,
            mise: t.mise,
            gains: t.gains,
            statut: t.statut,
            isCart: t.isCart,
            date: t.created,
            userBalanceAtCreation: t.userBalanceAtCreation
          })),
          withdrawals: withdrawals.map(w => ({
            id: w.id,
            amount: w.amount,
            status: w.status,
            method: w.method,
            date: w.created
          }))
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Erreur lors de l\'audit utilisateur:', error);
      res.status(500).json({
        message: "Erreur lors de l'audit utilisateur.",
        error: error.message
      });
    }
  });
};