const bcrypt = require("bcrypt");
const { Admin } = require("../../db/sequelize");
const { ValidationError, UniqueConstraintError } = require("sequelize");

module.exports = (app) => {
  app.post("/api/admins", async (req, res) => {
    try {
      const { firstName, lastName, email, password, solde } = req.body;

      // Vérification des champs obligatoires
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
      }

      // Normalisation de l'email
      const normalizedEmail = email.toLowerCase().trim();

      // Hachage du mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Création de l'administrateur
      const admin = await Admin.create({
        firstName,
        lastName,
        email: normalizedEmail, // Stocké en minuscule
        password: hashedPassword, // Haché
        solde: solde >= 0 ? solde : 0 // Valeur par défaut si non fournie
      });

      res.status(201).json({
        message: `L'administrateur ${admin.firstName} ${admin.lastName} a bien été créé.`,
        data: admin
      });

    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ message: "Validation échouée.", errors: error.errors });
      }

      if (error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: "Cet email est déjà utilisé.", errors: error.errors });
      }

      console.error("Erreur lors de la création de l'administrateur :", error);
      res.status(500).json({
        message: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
        error: error.message
      });
    }
  });
};