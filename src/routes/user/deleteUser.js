const { User } = require('../../db/sequelize')
const auth = require("../../auth/auth")

module.exports = (app) => {
  app.delete('/api/users/:id',auth, (req, res) => {
    User.findByPk(req.params.id).then(user => {
      if (user === null) {
        const message = `L' user demandé n'a pu être récupéré`
        res.status(404).json({message})
      }
      const userDeleted = user;
      return User.destroy({
        where: { id: user.id }
      })
      .then(_ => {
        const message = `L' user avec l'identifiant n°${userDeleted.id} a bien été supprimé.`
        res.json({message, data: userDeleted })
      })
      .catch(error => {
        const message = `L' user n' a pas pû supprimé. Veuillez réessayer plus tard.`
        res.status(500).json({message})
      })
    })
  })
}