const { Reseller, User } = require('../../db/sequelize');
const { Op } = require('sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/resellers', auth, async (req, res) => {
    try {
      const { status = 'all', search = '' } = req.query;
      const where = {};

      // Filtrer par statut si ce n’est pas “all”
      if (status && status !== 'all') {
        where.status = status;
      }

      // Préparer la clause de recherche pour User
      const userWhere = {};
      if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        userWhere[Op.or] = [
          { firstName: { [Op.like]: term } },
          { lastName:  { [Op.like]: term } },
          { email:     { [Op.like]: term } }
        ];
      }

      // Jointure avec User pour recherche et affichage
      const resellers = await Reseller.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'solde', 'gain'],
          where: Object.keys(userWhere).length ? userWhere : undefined
        }],
        order: [[{ model: User, as: 'user' }, 'email', 'ASC']]
      });

      res.json({
        message: 'La liste des revendeurs a bien été récupérée.',
        data: resellers
      });
    } catch (error) {
      res.status(500).json({ message: 'Une erreur est survenue.', error: error.message });
    }
  });
};