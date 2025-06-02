const { Reseller } = require('../../db/sequelize');
const { Op } = require('sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.get('/api/resellers', auth, async (req, res) => {
    try {
      // 1. Récupérer les query params `status` et `search`
      const { status = 'all', search = '' } = req.query;

      // 2. Construire l’objet `where` dynamiquement
      const where = {};

      // Filtrer par statut si ce n’est pas “all”
      if (status && status !== 'all') {
        where.status = status;
      }

      // Filtrer par recherche si `search` n’est pas vide
      if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        where[Op.or] = [
          // Remplace `nom` par `name` si ton modèle utilise `name` à la place de `nom`
          { nom:   { [Op.like]: term } },
          { email: { [Op.like]: term } }
        ];
      }

      // 3. Exécuter la requête avec le `where` construit et un tri par email
      const resellers = await Reseller.findAll({
        where,
        order: [['email', 'ASC']]
      });

      // 4. Retourner le résultat
      const message = 'La liste des Revendeurs a bien été récupérée.';
      res.json({ message, data: resellers });
    } catch (error) {
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};