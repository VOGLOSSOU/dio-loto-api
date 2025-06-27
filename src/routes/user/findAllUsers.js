const { User } = require('../../db/sequelize')
const { Op } = require("sequelize")
const auth = require("../../auth/auth")

const capitalize = (str) => str.charAt(0).toUpperCase() + str.substring(1)

module.exports = (app) => {
  app.get('/api/users', auth, (req, res) => {
    if (req.query.name) {
      const name = req.query.name.trim()
      const limit = parseInt(req.query.limit) || 5

      if (name.length < 2) {
        const message = `Le terme de recherche doit contenir au minimum 2 caractères.`
        return res.status(400).json({ message })        
      }

      return User.findAndCountAll({ 
        where: { 
          [Op.or]: [
            { firstName: { [Op.like]: `%${name}%` } },
            { lastName: { [Op.like]: `%${name}%` } },
            { firstName: { [Op.startsWith]: capitalize(name) } },
            { lastName: { [Op.startsWith]: capitalize(name) } }
          ]
        },
        order: [['firstName', 'ASC'], ['lastName', 'ASC']],
        limit: limit
      })
      .then(({ count, rows }) => {
        const message = `Il y a ${count} utilisateurs correspondant au terme de recherche "${name}".`
        return res.json({ message, data: rows })
      })
      .catch(error => {
        const message = `Une erreur s'est produite lors de la récupération des utilisateurs. Veuillez réessayer plus tard.`
        res.status(500).json({ message, error })
      })
    } 
    else {
      User.findAll({ order: [['firstName', 'ASC'], ['lastName', 'ASC']] })
      .then(users => {
        const message = 'La liste des utilisateurs a bien été récupérée.'
        res.json({ message, data: users })
      })
      .catch(error => {
        const message = `Une erreur s'est produite lors de la récupération des utilisateurs. Veuillez réessayer plus tard.`
        res.status(500).json({ message, error })
      })
    }
  })
}