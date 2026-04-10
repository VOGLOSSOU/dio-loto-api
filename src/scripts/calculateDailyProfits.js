const { ResellerToUserTransaction, Withdrawal, WithdrawalHistory, DailyProfit } = require("../db/sequelize")
const { Op } = require('sequelize')

/**
 * Script pour calculer et sauvegarder les bénéfices journaliers
 * À exécuter quotidiennement (cron job) pour calculer les bénéfices de la veille
 */
async function calculateDailyProfits(targetDate = null) {
  try {
    console.log('💰 Début du calcul des bénéfices journaliers...')

    // Date cible : la veille par défaut, ou exactement la date spécifiée
    const calculationDate = targetDate ? new Date(targetDate) : new Date()
    if (!targetDate) {
      calculationDate.setDate(calculationDate.getDate() - 1) // Seulement si pas de date explicite
    }

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
        created: {  // Correction: 'created' au lieu de 'createdAt'
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      raw: true
    })

    const totalRecharges = parseFloat(totalRechargesResult[0]?.totalRecharges || 0)
    console.log(`💸 Recharges du jour: ${totalRecharges} FCFA`)

    // 2) Calculer les retraits du jour (actifs + archivés)
    // 2a) Retraits encore actifs dans la table principale
    const activeWithdrawalsResult = await Withdrawal.findAll({
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('montant')), 'totalActive']
      ],
      where: {
        statut: 'traité',
        created: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      raw: true
    })

    // 2b) Retraits archivés qui ont été créés pendant cette période
    const archivedWithdrawalsResult = await WithdrawalHistory.findAll({
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('montant')), 'totalArchived']
      ],
      where: {
        originalCreatedAt: { // Date de création originale du retrait
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      raw: true
    })

    const activeWithdrawals = parseFloat(activeWithdrawalsResult[0]?.totalActive || 0)
    const archivedWithdrawals = parseFloat(archivedWithdrawalsResult[0]?.totalArchived || 0)
    const totalWithdrawals = activeWithdrawals + archivedWithdrawals

    console.log(`💸 Retraits actifs du jour: ${activeWithdrawals} FCFA`)
    console.log(`📦 Retraits archivés du jour: ${archivedWithdrawals} FCFA`)
    console.log(`💸 Total retraits du jour: ${totalWithdrawals} FCFA`)

    // 3) Calculer les salaires des revendeurs (10% des recharges)
    const totalSalaries = totalRecharges * 0.10
    console.log(`👥 Salaires revendeurs (10%): ${totalSalaries} FCFA`)

    // 4) Calculer le bénéfice net réel (après déduction des salaires)
    const netProfit = totalRecharges - totalWithdrawals - totalSalaries
    console.log(`💰 Bénéfice net réel du jour: ${netProfit} FCFA`)

    // 4) Sauvegarder ou mettre à jour
    const profitData = {
      date: dateString,
      totalRecharges,
      totalWithdrawals,
      totalSalaries,
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
      totalSalaries,
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