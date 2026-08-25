const { Ticket, User, Game, sequelize } = require('../../db/sequelize');

module.exports = (app) => {
  app.post('/api/tickets', async (req, res) => {
    console.log('🎫 Création de ticket - Données reçues:', req.body);

    const {
      uniqueUserId,
      heureJeu, // Optionnel maintenant
      nomJeu,
      typeJeu,
      numerosJoues,
      formule,
      mise: miseRaw,
      gains: gainRaw,
      isCart
    } = req.body;

    // 1) Vérification rapide des champs (heureJeu n'est plus requis)
    if (!uniqueUserId || !nomJeu || !typeJeu || !numerosJoues || !formule || miseRaw == null || gainRaw == null) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // 1b) Formules désactivées sur la plateforme (comparaison insensible à la casse,
    // rejette toute demande directe à l'API même si retirée du frontend)
    const FORMULES_DESACTIVEES = ['turbo2'];
    if (FORMULES_DESACTIVEES.includes(String(formule).trim().toLowerCase())) {
      return res.status(403).json({
        message: `La formule "${formule}" est actuellement désactivée sur la plateforme.`
      });
    }

    // 2) Vérifier que le jeu existe et est ouvert
    const game = await Game.findOne({ where: { nom: nomJeu } });
    if (!game) {
      return res.status(404).json({ message: "Jeu non trouvé." });
    }
    if (game.statut !== 'ouvert') {
      return res.status(400).json({
        message: "Le jeu n'est pas disponible pour le moment.",
        gameStatus: game.statut,
        gameName: game.nom
      });
    }

    const mise = Number(miseRaw);
    if (isNaN(mise) || mise < 10 || mise > 5000) {
      return res.status(400).json({ message: 'La mise doit être un nombre entre 10 et 5000.' });
    }

    // Gestion de heureJeu : heure actuelle par défaut
    let dateJeu;
    if (heureJeu) {
      // Si heureJeu est fourni, on l'utilise
      try {
        if (heureJeu.includes('T') || heureJeu.includes('-')) {
          // Format date complète
          dateJeu = new Date(heureJeu);
        } else {
          // Format heure seule "11:20"
          const today = new Date();
          const [hours, minutes] = heureJeu.split(':');
          dateJeu = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
        }
        
        if (isNaN(dateJeu.getTime())) {
          return res.status(400).json({ message: 'Format de date invalide pour heureJeu.' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Format de date invalide pour heureJeu.' });
      }
    } else {
      // Heure actuelle par défaut
      dateJeu = new Date();
    }

    // Validation et parsing de gains
    let gainsData;
    try {
      if (typeof gainRaw === 'string') {
        // Si c'est une string comme "20 (Win) / 60 (Machine)", on la structure
        if (gainRaw.includes('(') && gainRaw.includes(')')) {
          // Parse le format "20 (Win) / 60 (Machine)"
          const parts = gainRaw.split(' / ');
          const winPart = parts[0].match(/(\d+)\s*\(([^)]+)\)/);
          const machinePart = parts[1] ? parts[1].match(/(\d+)\s*\(([^)]+)\)/) : null;
          
          gainsData = {
            win: winPart ? parseInt(winPart[1]) : 0,
            machine: machinePart ? parseInt(machinePart[1]) : 0,
            original: gainRaw
          };
        } else {
          // Si c'est juste un nombre en string
          const numGain = Number(gainRaw);
          gainsData = isNaN(numGain) ? { value: gainRaw } : { value: numGain };
        }
      } else if (typeof gainRaw === 'number') {
        gainsData = { value: gainRaw };
      } else {
        // Si c'est déjà un objet, on le garde tel quel
        gainsData = gainRaw;
      }
    } catch (error) {
      return res.status(400).json({ message: 'Format de gains invalide.' });
    }

    // Normalisation de isCart
    let isCartValue = false;
    if (isCart !== undefined) {
      // Gérer les différents formats possibles
      if (typeof isCart === 'string') {
        isCartValue = isCart.toLowerCase() === 'true';
      } else {
        isCartValue = Boolean(isCart);
      }
    }

    // 2) Démarrage de la transaction
    const t = await sequelize.transaction();
    try {
      // 2a) On récupère l'utilisateur
      const user = await User.findOne({ where: { uniqueUserId }, transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      // 2b) ENREGISTRER LE SOLDE AVANT TOUT DÉBIT
      const userBalanceAtCreation = user.solde;

      // 2c) Vérification du solde SEULEMENT pour création directe
      if (!isCartValue) {
        // Mode création directe : solde obligatoire
        // Logique de débit : bonus d'abord, puis solde normal
        let remainingAmount = mise;
        let bonusUsed = 0;
        let soldeUsed = 0;

        // 1. Utiliser le bonus en priorité
        if (user.bonus > 0) {
          if (user.bonus >= remainingAmount) {
            // Bonus suffit
            bonusUsed = remainingAmount;
            user.bonus -= remainingAmount;
            remainingAmount = 0;
          } else {
            // Utiliser tout le bonus et compléter avec solde
            bonusUsed = user.bonus;
            remainingAmount -= user.bonus;
            user.bonus = 0;
          }
        }

        // 2. Compléter avec le solde normal si nécessaire
        if (remainingAmount > 0) {
          if (remainingAmount > user.solde) {
            await t.rollback();
            return res.status(400).json({
              message: "Solde insuffisant pour créer le ticket directement.",
              bonusDisponible: user.bonus,
              soldeDisponible: user.solde,
              montantRequis: remainingAmount,
              totalDisponible: user.bonus + user.solde
            });
          }
          soldeUsed = remainingAmount;
          user.solde -= remainingAmount;
        }

        await user.save({ transaction: t });

        console.log(`💰 Débit effectué - Bonus utilisé: ${bonusUsed} FCFA, Solde utilisé: ${soldeUsed} FCFA`);
      }

      // 2d) On crée le ticket
      const ticket = await Ticket.create({
        uniqueUserId,
        heureJeu: dateJeu,
        nomJeu,
        typeJeu,
        numerosJoues: Array.isArray(numerosJoues) ? JSON.stringify(numerosJoues) : numerosJoues,
        formule,
        mise,
        gains: gainsData,
        userBalanceAtCreation: userBalanceAtCreation, // ← SOLDE AVANT DÉBIT
        isCart: isCartValue
      }, { transaction: t });

      // 2d) Commit de la transaction
      await t.commit();
      
      const response = {
        message: isCartValue ? "Ticket ajouté au panier avec succès." : "Ticket enregistré et validé avec succès.",
        ticket: {
          id: ticket.id,
          heureJeu: ticket.heureJeu,
          nomJeu: ticket.nomJeu,
          mise: ticket.mise,
          gains: ticket.gains, // Le getter du modèle s'occupe du JSON.parse
          statut: ticket.statut,
          isCart: ticket.isCart
        }
      };

      // Ajouter les nouveaux soldes seulement si on a débité
      if (!isCartValue) {
        response.newSolde = user.solde;
        response.newBonus = user.bonus;
        response.bonusUsed = bonusUsed || 0;
        response.soldeUsed = soldeUsed || 0;
      }

      return res.status(201).json(response);

    } catch (error) {
      // SI LA TRANSACTION EST DÉJÀ COMMITTÉE = SUCCÈS MALGRÉ L'ERREUR
      if (t.finished === 'commit') {
        console.warn('⚠️ Erreur après commit réussi - ticket créé malgré l\'erreur');
        console.error('Erreur post-commit:', error.message);
        // NE PAS RETOURNER D'ERREUR 500 !
        return res.status(201).json({
          message: 'Ticket créé avec succès.',
          warning: 'Une erreur mineure est survenue après la création.',
          ticketCreated: true
        });
      }

      // Rollback seulement si la transaction n'est pas encore finalisée
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError.message);
      }

      console.error('Erreur lors de l\'enregistrement du ticket :', error);
      console.error('Stack trace:', error.stack);
      console.error('Données reçues:', req.body);
      return res.status(500).json({
        message: 'Erreur interne du serveur.',
        error: error.message,
        details: error.stack
      });
    }
  });
};