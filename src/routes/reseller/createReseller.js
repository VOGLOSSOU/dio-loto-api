const { Reseller, User } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const auth = require("../../auth/auth");

module.exports = (app) => {
  app.post('/api/resellers', auth, async (req, res) => {
    try {
      const { email, whatsapp, pays, pseudo } = req.body;

      // Vérification des champs obligatoires
      if (!email || !whatsapp || !pays || !pseudo) {
        return res.status(400).json({ message: "L'email, le numéro WhatsApp, le pays et le pseudo sont requis." });
      }

      // Vérifier que pseudo n'est pas vide ou que ce n'est pas uniquement des espaces
      if (typeof pseudo !== 'string' || !pseudo.trim()) {
        return res.status(400).json({ message: "Le pseudo ne peut pas être vide." });
      }

      // Vérification de l'utilisateur correspondant à l'email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });
      }

      // Vérification si l'utilisateur est déjà revendeur
      const existingReseller = await Reseller.findOne({ where: { uniqueUserId: user.uniqueUserId } });
      if (existingReseller) {
        return res.status(400).json({ message: "Un revendeur existe déjà pour cet utilisateur." });
      }

      // (Optionnel) Vérifier unicité du pseudo au niveau application
      // Si vous avez défini unique: true sur le champ pseudo au niveau modèle/migration,
      // cette vérification préventive évite une exception plus tard.
      const existingPseudo = await Reseller.findOne({ where: { pseudo } });
      if (existingPseudo) {
        return res.status(400).json({ message: "Ce pseudo est déjà utilisé par un autre revendeur." });
      }

      // Vérification du pays
      const validCountries = ['Benin', 'Côte d\'Ivoire', 'Ghana', 'Niger', 'Togo'];
      if (!validCountries.includes(pays)) {
        return res.status(400).json({ message: `Le pays doit être l’un des suivants : ${validCountries.join(', ')}.` });
      }

      // Création du revendeur
      const reseller = await Reseller.create({
        uniqueUserId: user.uniqueUserId,
        soldeRevendeur: 0, // Initialisé à 0
        whatsapp,
        pays,
        status: 'actif',
        pseudo: pseudo.trim()
      });

      res.status(201).json({
        message: `Le revendeur (${pseudo.trim()}) lié à ${user.lastName} ${user.firstName} a bien été créé.`,
        data: reseller
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        // Sequelize renvoie error.errors avec plus de détails si besoin
        return res.status(400).json({ message: error.message, errors: error.errors });
      }
      console.error("Erreur lors de la création du revendeur :", error);
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};