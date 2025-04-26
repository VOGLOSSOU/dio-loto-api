const { Reseller, User } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.post('/api/resellers',auth , async (req, res) => {
    try {
      const { email, whatsapp, pays } = req.body;

      // Vérification des champs obligatoires
      if (!email || !whatsapp || !pays) {
        return res.status(400).json({ message: "L'email, le numéro WhatsApp et le pays sont requis." });
      }

      // Vérification si l'email existe déjà dans la table resellers
      const existingReseller = await Reseller.findOne({ where: { email } });
      if (existingReseller) {
        return res.status(400).json({ message: "Un revendeur avec cet email existe déjà." });
      }

      // Vérification si l'email existe dans la table users
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });
      }

      // Vérification du pays
      const validCountries = ['Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo'];
      if (!validCountries.includes(pays)) {
        return res.status(400).json({ message: `Le pays doit être l’un des suivants : ${validCountries.join(', ')}.` });
      }

      // Création du revendeur
      const reseller = await Reseller.create({
        lastName: user.lastName,
        firstName: user.firstName,
        email: user.email,
        password: user.password, // Le mot de passe est déjà haché dans la table users
        solde: user.solde,
        gain: user.gain,
        soldeRevendeur: 0, // Initialisé à 0
        whatsapp,
        pays,
        status: 'actif' // Statut par défaut
      });

      res.status(201).json({
        message: `Le revendeur ${reseller.lastName} ${reseller.firstName} a bien été créé.`,
        data: reseller
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: error.message, data: error });
      }
      console.error("Erreur lors de la création du revendeur :", error);
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};