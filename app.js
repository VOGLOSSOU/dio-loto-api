require("dotenv").config()
const express = require("express")
const morgan = require("morgan")
const bodyParser = require("body-parser")
const cors = require("cors") // Ajout de cors
const { initDb } = require("./src/db/sequelize") 

const app = express()
const port = process.env.PORT || 3000

// Middleware
app
  .use(morgan("dev"))
  .use(bodyParser.json())
  .use(cors()) // Activation de CORS avec les paramètres par défaut

// Initialisation de la base de données
initDb()

// Routes (exemple basique)
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur notre API !" })
})

const updateGameStatus = require('./src/scripts/updateGamesStatus');

// Lancer la tâche planifiée
updateGameStatus();

// Ici nous afficherons nos routes

// : Users
require("./src/routes/user/findAllUsers")(app)
require("./src/routes/user/findUserByPk")(app)
require("./src/routes/user/createUser")(app)
require("./src/routes/user/updateUser")(app)
require("./src/routes/user/deleteUser")(app)
require("./src/routes/user/login")(app)
require("./src/routes/user/check-role")(app) // Vérification du rôle de l'utilisateur

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

// : SoldeInitial
require("./src/routes/soldeInitial/initialiseSolde")(app)

// : Transactions
require("./src/routes/transaction/recharge-admin-reseller")(app)
require("./src/routes/transaction/recharge-reseller-user")(app)
require("./src/routes/transaction/recharge-cancel")(app)
require("./src/routes/transaction/recharge-user-to-user")(app)

// : Games
require("./src/routes/games/updateGamesStatus")(app)
require("./src/routes/games/gamesAvailbleByCountries")(app)
require("./src/routes/games/getGamesByCountries")(app)

// : Tickets
require("./src/routes/ticket/createTicket")(app)
require("./src/routes/ticket/getTicketByUser")(app)

// : EasyCron
require("./src/routes/easycron/ping")(app)
require("./src/routes/easycron/updateStatus")(app)


app.listen(port, () => {
  console.log(`Notre app tourne sur le port ${port}`)
})