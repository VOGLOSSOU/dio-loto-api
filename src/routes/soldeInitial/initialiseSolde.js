const { SoldeInitial, Admin } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/solde-initial', auth, async (req, res) => {
    try {
      const { montant, adminId } = req.body;

      if (!montant || montant <= 0) {
        return res.status(400).json({ message: 'Un montant valide est requis.' });
      }
      if (!adminId) {
        return res.status(400).json({ message: "L'identifiant admin est requis." });
      }

      // Vérification si l'admin existe
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à effectuer cette opération." });
      }

      // Création d'une NOUVELLE ligne à chaque injection
      const newSolde = await SoldeInitial.create({
        montant,
        auteur: `${admin.lastName} ${admin.firstName}`
      });

      res.status(201).json({
        message: 'Le solde initial a été enregistré avec succès.',
        data: newSolde
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du solde :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};