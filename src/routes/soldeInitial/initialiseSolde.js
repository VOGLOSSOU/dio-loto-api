const { SoldeInitial, Admin } = require('../../db/sequelize');
const auth = require('../../auth/auth');

module.exports = (app) => {
  app.post('/api/solde-initial', auth, async (req, res) => {
    try {
      const { montant, uniqueUserId } = req.body;

      // Vérification si le montant et le uniqueUserId sont fournis
      if (!montant || montant <= 0) {
        return res.status(400).json({ message: 'Un montant valide est requis.' });
      }
      if (!uniqueUserId) {
        return res.status(400).json({ message: 'Le uniqueUserId de l\'admin est requis.' });
      }

      // Vérification si l'admin existe dans la table Admin
      const admin = await Admin.findOne({ where: { uniqueUserId } });
      if (!admin) {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à effectuer cette opération." });
      }

      // Vérification s'il existe déjà une ligne dans la table SoldeInitial
      const existingSolde = await SoldeInitial.findOne();

      if (existingSolde) {
        // Mise à jour du solde existant
        existingSolde.montant = montant;
        existingSolde.auteur = `${admin.lastName} ${admin.firstName}`;
        await existingSolde.save();

        return res.status(200).json({
          message: 'Le solde initial a été mis à jour avec succès.',
          data: existingSolde
        });
      }

      // Création d'une nouvelle ligne dans la table SoldeInitial
      const newSolde = await SoldeInitial.create({
        montant,
        auteur: `${admin.lastName} ${admin.firstName}`
      });

      res.status(201).json({
        message: 'Le solde initial a été créé avec succès.',
        data: newSolde
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du solde :', error);
      res.status(500).json({ message: 'Une erreur est survenue.', error });
    }
  });
};