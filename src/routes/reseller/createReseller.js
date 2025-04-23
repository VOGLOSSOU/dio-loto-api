const { Reseller } = require('../../db/sequelize');
const { ValidationError, UniqueConstraintError } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (app) => {
  app.post('/api/resellers', async (req, res) => {
    try {
      const { lastName, firstName, email, password } = req.body;

      // 🚀 **Validation des champs**
      if (!lastName || lastName.length < 2 || lastName.length > 50 || !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u.test(lastName)) {
        return res.status(400).json({ message: "Le nom de famille est invalide (2-50 caractères, lettres uniquement)." });
      }

      if (!firstName || firstName.length < 2 || firstName.length > 50 || !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u.test(firstName)) {
        return res.status(400).json({ message: "Le prénom est invalide (2-50 caractères, lettres uniquement)." });
      }

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: "L'adresse email est invalide." });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
      }

      // 🔐 **Hachage du mot de passe**
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ **Création du revendeur après validation**
      const reseller = await Reseller.create({
        lastName,
        firstName,
        email,
        password: hashedPassword
      });

      res.status(201).json({
        message: `Le revendeur ${reseller.email} a bien été créé.`,
        data: reseller
      });

    } catch (error) {
      if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
        return res.status(400).json({ message: error.message, data: error });
      }
      res.status(500).json({ message: "Une erreur est survenue.", error });
    }
  });
};