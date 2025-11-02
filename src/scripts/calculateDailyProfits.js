const { ResellerToUserTransaction, Withdrawal, DailyProfit } = require("../db/sequelize")
const { Op } = require('sequelize')

/**
 * Script pour calculer et sauvegarder les bénéfices journaliers
 * À exécuter quotidiennement (cron job) pour calculer les bénéfices de la veille
 */
async function calculateDailyProfits(targetDate = null) {
  try {
    console.log('💰 Début du calcul des bénéfices journaliers...')

    // Date cible : la veille par défaut, ou date spécifiée
    const calculationDate = targetDate ? new Date(targetDate) : new Date()
    calculationDate.setDate(calculationDate.getDate() - 1) // Jour précédent

    const dateString = calculationDate.toISOString().split('T')[0] // Format YYYY-MM-DD
    console.log(`📅 Calcul pour la date: ${dateString}`)

    // Vérifier si les bénéfices de cette date existent déjà
    const existingRecord = await DailyProfit.findOne({
      where: { date: dateString }
    })

    if (existingRecord) {
      console.log(`⚠️ Les bénéfices du ${dateString} existent déjà, mise à jour...`)
    }

    // Bornes de la journée
    const startOfDay = new Date(calculationDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(calculationDate)
    endOfDay.setHours(23, 59, 59, 999)

    console.log(`⏰ Période: ${startOfDay.toISOString()} → ${endOfDay.toISOString()}`)

    // 1) Calculer les recharges du jour
    const totalRechargesResult = await ResellerToUserTransaction.findAll({
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('money')), 'totalRecharges']
      ],
      where: {
        status: 'validé',
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      raw: true
    })

    const totalRecharges = parseFloat(totalRechargesResult[0]?.totalRecharges || 0)
    console.log(`💸 Recharges du jour: ${totalRecharges} FCFA`)

    // 2) Calculer les retraits du jour
    const totalWithdrawalsResult = await Withdrawal.findAll({
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('montant')), 'totalWithdrawals']
      ],
      where: {
        statut: 'traité',
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      raw: true
    })

    const totalWithdrawals = parseFloat(totalWithdrawalsResult[0]?.totalWithdrawals || 0)
    console.log(`💸 Retraits du jour: ${totalWithdrawals} FCFA`)

    // 3) Calculer le bénéfice net
    const netProfit = totalRecharges - totalWithdrawals
    console.log(`💰 Bénéfice net du jour: ${netProfit} FCFA`)

    // 4) Sauvegarder ou mettre à jour
    const profitData = {
      date: dateString,
      totalRecharges,
      totalWithdrawals,
      netProfit
    }

    if (existingRecord) {
      // Mise à jour
      await existingRecord.update(profitData)
      console.log(`✅ Bénéfices du ${dateString} mis à jour`)
    } else {
      // Création
      await DailyProfit.create(profitData)
      console.log(`✅ Bénéfices du ${dateString} sauvegardés`)
    }

    return {
      date: dateString,
      totalRecharges,
      totalWithdrawals,
      netProfit,
      action: existingRecord ? 'updated' : 'created'
    }

  } catch (error) {
    console.error('❌ Erreur lors du calcul des bénéfices journaliers:', error)
    throw error
  }
}

/**
 * Fonction pour calculer les bénéfices de plusieurs jours
 * Utile pour rattraper un retard ou initialiser
 */
async function calculateMultipleDays(daysCount = 30) {
  const results = []

  for (let i = daysCount; i >= 1; i--) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - i)

    try {
      const result = await calculateDailyProfits(targetDate)
      results.push(result)
      console.log(`✅ Jour ${i}/${daysCount} traité: ${result.date}`)
    } catch (error) {
      console.error(`❌ Erreur pour le jour ${i}:`, error.message)
    }

    // Petite pause pour éviter de surcharger la DB
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

// Export pour utilisation en tant que script
module.exports = {
  calculateDailyProfits,
  calculateMultipleDays
}

// Si exécuté directement (node calculateDailyProfits.js)
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--multiple') || args.includes('-m')) {
    const days = parseInt(args.find(arg => !isNaN(arg)) || '30')
    console.log(`🚀 Calcul des ${days} derniers jours...`)

    calculateMultipleDays(days)
      .then(results => {
        console.log(`✅ Calcul terminé pour ${results.length} jours`)
        process.exit(0)
      })
      .catch(error => {
        console.error('❌ Erreur:', error)
        process.exit(1)
      })
  } else {
    // Calcul du jour précédent par défaut
    calculateDailyProfits()
      .then(result => {
        console.log('✅ Calcul terminé:', result)
        process.exit(0)
      })
      .catch(error => {
        console.error('❌ Erreur:', error)
        process.exit(1)
      })
  }
}