const express = require("express")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const { initDb } = require("./src/db/sequelize") 

const app = express()
const port = 3000

// Middleware
app
  .use(morgan("dev"))
  .use(bodyParser.json())

// Initialisation de la base de données
initDb()

// Routes (exemple basique)
app.get("/ressources/", (req, res) => {
  res.json({ message: "Bienvenue sur notre API !" })
})

// Ici nous afficherons nos routes

// : Users
require("./src/routes/user/findAllUsers")(app)
require("./src/routes/user/findUserByPk")(app)
require("./src/routes/user/createUser")(app)
require("./src/routes/user/updateUser")(app)
require("./src/routes/user/deleteUser")(app)
require("./src/routes/user/login")(app)

// : Admins
require("./src/routes/admin/findAllAdmins")(app)
require("./src/routes/admin/findAdminByPk")(app)
require("./src/routes/admin/createAdmin")(app)
require("./src/routes/admin/updateAdmin")(app)
require("./src/routes/admin/deleteAdmin")(app)
require("./src/routes/admin/login")(app)

// : Resellers
require("./src/routes/reseller/createReseller")(app)
require("./src/routes/reseller/updateReseller")(app)
require("./src/routes/reseller/deleteReseller")(app)
require("./src/routes/reseller/findAllReseller")(app)
require("./src/routes/reseller/findResellerByPk")(app)
require("./src/routes/reseller/login")(app)

app.use(({ res } ) => {
    const message = `Impossible de récupérer la ressource demandée`
    res.status(404).json({message})
})

// Démarrer le serveur
app.listen(port, () => console.log(`Notre app tourne sur http://localhost:${port}`))