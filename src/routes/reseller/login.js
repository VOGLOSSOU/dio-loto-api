const { User } = require('../../db/sequelize')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const privateKey = require('../../auth/private_key')

module.exports = (app) => {
  app.post('/api/resellers/login', (req, res) => {

    User.findOne({ where: { email: req.body.email } }).then(user => {

      if(!user) {
        const message = `Le revendeur demandé n'existe pas.`
        return res.status(404).json({ message })
      }

      return bcrypt.compare(req.body.password, user.password).then(isPasswordValid => {
        if(!isPasswordValid) {
          const message = `Le mot de passe est incorrect.`
          return res.status(401).json({message})
        }

        // Générer un jeton JWT valide pendant 24 heures.
        const token = jwt.sign(
          { userId: user.id },
          privateKey,
          { expiresIn: '24h' }
        );

        const message = `Le revendeur a été connecté avec succès`;
        return res.json({ message, data: user, token })
      })
    })
    .catch(error => {
      const message = `Le revendeur n'a pas pu être connecté. Réessayez dans quelques instants.`
      res.status(500).json({ message, data: error })
    })
  })
}