const { sequelize, Result, Ticket } = require('../db/sequelize');
const { Op } = require('sequelize');

/**
 * Correctif incident : Result id=4708 (benin11, gameId=19) inséré avec de mauvais
 * numéros, ce qui a invalidé à tort des tickets. On supprime le résultat fautif
 * et on remet à "en attente" les tickets touchés par SA validation automatique
 * (repérés par updatedAt >= createdAt du résultat, pas une fenêtre de temps fixe).
 *
 * Les tickets déjà passés à "attribué" (gain déjà crédité en base) sont
 * volontairement exclus et laissés intacts — à traiter séparément par les admins.
 */
async function fixWrongResultBenin11() {
  const t = await sequelize.transaction();
  try {
    const result = await Result.findByPk(4708, { transaction: t });
    if (!result) {
      throw new Error('Result 4708 introuvable (déjà supprimé ?)');
    }
    if (result.gameId !== 19) {
      throw new Error(`Result 4708 ne correspond pas au gameId 19 (trouvé: ${result.gameId})`);
    }

    const resultCreatedAt = result.createdAt;
    console.log(`🔎 Result 4708 (benin11) créé le ${resultCreatedAt.toISOString()}`);

    // Tickets déjà attribués (argent déjà crédité) : on les liste mais on n'y touche pas
    const ticketsAttribues = await Ticket.findAll({
      where: {
        nomJeu: 'benin11',
        statut: 'attribué',
        updatedAt: { [Op.gte]: resultCreatedAt }
      },
      transaction: t
    });

    // Tickets à remettre en attente : validé/invalidé, touchés par CE résultat précisément
    const [nbTicketsCorriges] = await Ticket.update(
      { statut: 'en attente' },
      {
        where: {
          nomJeu: 'benin11',
          statut: { [Op.in]: ['validé', 'invalidé'] },
          updatedAt: { [Op.gte]: resultCreatedAt }
        },
        transaction: t
      }
    );

    // Suppression du résultat fautif
    await result.destroy({ transaction: t });

    await t.commit();

    console.log(`✅ Result 4708 supprimé`);
    console.log(`✅ ${nbTicketsCorriges} ticket(s) remis à "en attente"`);
    console.log(`⚠️ ${ticketsAttribues.length} ticket(s) déjà "attribué" laissé(s) intact(s) — à traiter manuellement :`);
    ticketsAttribues.forEach(ti => {
      console.log(`   - Ticket ${ti.numeroTicket} (id=${ti.id}, user=${ti.uniqueUserId}, gains=${JSON.stringify(ti.gains)})`);
    });

    return {
      ticketsCorrigés: nbTicketsCorriges,
      ticketsAttribuésNonTouchés: ticketsAttribues.map(ti => ({
        id: ti.id,
        numeroTicket: ti.numeroTicket,
        uniqueUserId: ti.uniqueUserId,
        gains: ti.gains
      }))
    };
  } catch (error) {
    await t.rollback();
    console.error('❌ Erreur, transaction annulée :', error);
    throw error;
  }
}

if (require.main === module) {
  fixWrongResultBenin11()
    .then((r) => {
      console.log('🎉 Correctif terminé.', JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec du correctif :', error);
      process.exit(1);
    });
}

module.exports = { fixWrongResultBenin11 };
