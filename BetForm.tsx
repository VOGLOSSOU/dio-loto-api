import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/BetForm.css";
import BetCouponDisplay from '../components/BetCouponDisplay';
import { useAuth } from "../AuthContext";
import ticketService from "../services/ticketService";

// Import des fonctions et types depuis le fichier de calculs
import {
  BetType,
  FormulaOption,
  CouponDetails,
  doubleChanceGames,
  getBetTypeConfig,
  calculateGains,
  generateAutoNumbers,
  validateCoupon,
  shouldShowPrisesField
} from "../utils/gameCalculations";

// Mapping des codes pays vers les noms complets
const countryNames: { [key: string]: string } = {
  benin: "Bénin",
  togo: "Togo",
  coteIvoire: "Côte d'Ivoire",
  ghana: "Ghana",
  niger: "Niger"
};

const BetForm = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // Récupération des paramètres d'URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const country = queryParams.get("country") || "benin";
  const gameTime = queryParams.get("time") || "";
  const gameName = queryParams.get("gameName") || "";

  // Vérifier si le jeu actuel supporte la double chance
  const currentGameHasDoubleChance = doubleChanceGames.includes(gameName);

  // États du formulaire
  const [betType, setBetType] = useState<BetType>("FirstouonBK");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [formula, setFormula] = useState<FormulaOption>("Directe");
  const [stake, setStake] = useState<string>("");
  const [gains, setGains] = useState<string>("");
  const [formulaOptions, setFormulaOptions] = useState<FormulaOption[]>([]);
  const [minNumbersRequired, setMinNumbersRequired] = useState<number>(1);
  const [maxNumbersAllowed, setMaxNumbersAllowed] = useState<number>(1);
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [numberOfBalls, setNumberOfBalls] = useState<number>(3);
  const [numberOfPrises, setNumberOfPrises] = useState<number | "">("");
  const [countryName, setCountryName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCouponDisplay, setShowCouponDisplay] = useState(false);
  const [couponDetails, setCouponDetails] = useState<CouponDetails | null>(null);

  // Initialisation du nom du pays
  useEffect(() => {
        setCountryName(countryNames[country] || country);
  }, [country]);

  // Mise à jour des options de formule en fonction du type de pari
  useEffect(() => {
    const config = getBetTypeConfig(betType, currentGameHasDoubleChance, numberOfBalls);
    
    setFormulaOptions(config.options);
    setMinNumbersRequired(config.minNums);
    setMaxNumbersAllowed(config.maxNums);

    // Set initial formula based on bet type, or default to first available
    let defaultFormula: FormulaOption = config.options.length > 0 ? config.options[0] : "Directe";

    if (betType === "Annagrammesimple") {
      defaultFormula = "Directe"; // Annagrammesimple always has Directe formula
    } else if (betType === "DoubleNumber") {
      defaultFormula = "Directe"; // DoubleNumber defaults to Directe
    }
    setFormula(defaultFormula);
    
    // Reset numbers if too numerous or if type changes dramatically
    if (numbers.length > config.maxNums || (betType !== "NAP" && betType !== "Permutations" && numbers.length > 0)) {
    setNumbers([]);
    }
    
    // Reset prise and stake if changing bet types that don't use prise
    if (!((betType === "NAP" && (formula === "NAP3" || formula === "NAP4")) ||
          betType === "Annagrammesimple" ||
          betType === "DoubleNumber" ||
          betType === "Permutations")) {
      setNumberOfPrises("");
      setStake("");
    }

    // Mettre à jour les gains si possible
    updateGains();
  }, [betType, currentGameHasDoubleChance, numberOfBalls]);

  // Fonction pour mettre à jour les gains
  const updateGains = () => {
    if (stake !== "" && (numbers.length >= minNumbersRequired || betType === "DoubleNumber" || betType === "Annagrammesimple" || betType === "Permutations")) {
      const calculatedGains = calculateGains(betType, formula, stake, numbers, minNumbersRequired, numberOfBalls, numberOfPrises.toString());
      setGains(calculatedGains);
    } else {
      setGains("");
    }
  };

  // Effet pour recalculer les gains quand nécessaire
  useEffect(() => {
    updateGains();
  }, [betType, formula, stake, numbers, minNumbersRequired, numberOfBalls, numberOfPrises]); // Add numberOfPrises to dependencies

  // Gestion du changement de mise
  const handleStakeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
      setStake(value);
  };

  // Gestion du changement de formule
  const handleFormulaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormula(event.target.value as FormulaOption);
    setNumberOfPrises(""); // Reset prises when formula changes
    setStake(""); // Reset stake when formula changes
  };

  // New: Handle change in number of balls for NAP
  const handleNumberOfBallsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const num = parseInt(event.target.value);
    setNumberOfBalls(num);
    setNumbers([]); // Reset numbers when number of balls changes
    setStake(""); // Reset stake
    setNumberOfPrises(""); // Reset prises
  };

  // New: Handle change in number of prises for NAP3/NAP4, Annagrammesimple, Double Number, and Permutations
  const handleNumberOfPrisesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const prises = parseInt(event.target.value);
    if (isNaN(prises) || prises < 1) {
      setNumberOfPrises("");
      setStake("");
      return;
    }

    setNumberOfPrises(prises);
    // Auto-fill stake based on prises and bet type/formula
    let calculatedStake = 0;
    if (betType === "NAP") {
      if (formula === "NAP3" && numberOfBalls === 5) {
        calculatedStake = prises * 100;
      } else if (formula === "NAP4" && numberOfBalls === 5) {
        calculatedStake = prises * 50;
      } else if (formula === "NAP3" || formula === "NAP4") {
        calculatedStake = prises * 40;
      }
    } else if (betType === "Annagrammesimple") {
      calculatedStake = prises * 370;
    } else if (betType === "DoubleNumber") {
      // Pour DoubleNumber, toutes les formules ont le même coût par prise
      calculatedStake = prises * 280;
    } else if (betType === "Permutations") {
       const permPriseValues: { [key: number]: number } = {
        3: 30, 4: 60, 5: 100, 6: 150, 7: 210, 8: 280, 9: 360, 10: 450, 11: 550, 12: 660, 13: 780, 14: 910, 15: 1050, 16: 1200, 17: 1360, 18: 1530, 19: 1710, 20: 1900
      };
      calculatedStake = prises * (permPriseValues[numberOfBalls] || 0);
    }
    setStake(calculatedStake.toString());
  };

  // Ajout d'un numéro à la sélection
  const addNumber = () => {
    const num = parseInt(currentNumber);
    if (isNaN(num)) {
      return;
    }
    
    // Adjusted maxNumbersAllowed for NAP and Permutations (based on numberOfBalls)
    let currentMaxAllowed: number;
    if (betType === "NAP" || betType === "Permutations") {
      currentMaxAllowed = numberOfBalls;
    } else {
      currentMaxAllowed = maxNumbersAllowed;
    }

    if (currentMaxAllowed > 0 && numbers.length >= currentMaxAllowed) {
      alert(`Vous ne pouvez pas sélectionner plus de ${currentMaxAllowed} numéros pour cette formule.`);
      return;
    }
    
    const newNumbers = [...numbers, num];
    setNumbers(newNumbers);
    setCurrentNumber("");
  };

  // Suppression d'un numéro de la sélection
  const removeNumber = (index: number) => {
    const newNumbers = numbers.filter((_, i) => i !== index);
    setNumbers(newNumbers);
  };

  // Génération automatique de numéros
  const handleGenerateAutoNumbers = () => {
    const autoNumbers = generateAutoNumbers(betType, minNumbersRequired, numberOfBalls);
    setNumbers(autoNumbers);
    
    if (betType === "Annagrammesimple") {
      alert("Les 37 anagrammes seront automatiquement joués.");
    } else if (betType === "DoubleNumber") {
      alert("Les 8 doubles numbers (11, 22...88) seront automatiquement joués.");
    } else if (betType === "Permutations") {
      alert(`Les ${numberOfBalls} numéros pour la permutation seront générés aléatoirement.`);
    }
  };

  // Gérer l'ajout du coupon
  const handleAddCoupon = () => {
    // Vérifier si tous les numéros sont entre 00 et 90
    const invalidNumbers = numbers.filter(num => num < 0 || num > 90);
    if (invalidNumbers.length > 0) {
      alert("Tous les numéros doivent être compris entre 00 et 90.");
      return;
    }
    
    // Vérifier les doublons
    const hasDuplicates = numbers.some((num, index) => numbers.indexOf(num) !== index);
    if (hasDuplicates) {
      alert("Vous ne pouvez pas sélectionner le même numéro plusieurs fois.");
      return;
    }

    if (isCouponValid()) {
      setCouponDetails({
        ticketNumber: "En attente...",
        date: new Date().toLocaleDateString(),
        gameName: gameName,
        betType: betType,
        numbers: numbers,
        formula: formula,
        stake: stake,
        gains: gains,
        prise: (betType === "NAP" || betType === "Annagrammesimple" || betType === "DoubleNumber" || betType === "Permutations") && numberOfPrises !== ""
               ? (numberOfPrises as number)
               : parseFloat(stake)
      });
      setShowCouponDisplay(true);
    }
  };

  // Validation du coupon
  const isCouponValid = () => {
    if (betType === "Annagrammesimple") {
      return stake !== "" && parseFloat(stake) > 0 && numberOfPrises !== "" && numbers.length > 0;
    }
    if (betType === "DoubleNumber" || betType === "Permutations") {
      return (stake !== "" && parseFloat(stake) > 0 && numberOfPrises !== "" && numbers.length === numberOfBalls);
    }
    return validateCoupon(betType, numbers, stake, minNumbersRequired, numberOfBalls);
  };

  // Gérer la validation du coupon
  const handleValidateCoupon = async () => {
    if (!user?.uniqueUserId || !token) {
      setError("Vous devez être connecté pour valider le coupon");
      return;
    }
    
    try {
      setLoading(true);
      const ticketData = {
        uniqueUserId: user.uniqueUserId,
        heureJeu: gameTime,
        nomJeu: gameName,
        typeJeu: betType,
        numerosJoues: numbers,
        formule: formula,
        mise: parseFloat(stake),
        gain: parseFloat(gains.split(' ')[0]) // Prendre le premier nombre en cas de double chance
      };

      const response = await ticketService.createTicket(ticketData, token);
      
      // Mettre à jour le numéro de ticket
      setCouponDetails((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ticketNumber: response.ticket.numeroTicket
        };
      });

      // Attendre 2 secondes avant de rediriger
      setTimeout(() => {
        resetForm();
        navigate('/tickets');
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de la création du ticket");
      setShowCouponDisplay(false);
      setCouponDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setBetType("FirstouonBK");
    setNumbers([]);
    setFormula("Directe");
    setStake("");
    setGains("");
    setCurrentNumber("");
    setNumberOfBalls(3);
    setNumberOfPrises(""); // Reset to empty string
    setShowCouponDisplay(false);
    setCouponDetails(null);
    setError(null);
  };

  // Gérer la suppression du coupon
  const handleDeleteCoupon = () => {
    setShowCouponDisplay(false);
    setCouponDetails(null);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Traitement en cours...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link to="/choicePlay" className="back-button">Retour aux jeux</Link>
      </div>
    );
  }

  return (
    <div className="bet-form-container">
      <Link to={`/choicePlay?country=${country}`} className="back-link">
        &lt; Retour aux jeux
      </Link>
      
      <div className="bet-form-header">
        <h2>{gameName}</h2>
        <p>Heure du jeu: {gameTime}</p>
        <p>Pays: {countryName}</p>
      </div>

      <form className="bet-form-content">
        <div className="form-group">
          <label htmlFor="betType">Type de Pari:</label>
      <select 
            id="betType"
        value={betType} 
        onChange={(e) => setBetType(e.target.value as BetType)}
      >
            <option value="FirstouonBK">FirstouonBK</option>
        <option value="NAP">NAP</option>
            <option value="Twosûrs">Twosûrs</option>
            <option value="Permutations">Permutations</option>
        <option value="DoubleNumber">Double Number</option>
        <option value="Annagrammesimple">Annagramme simple</option>
      </select>
        </div>

        {/* New: Select for number of balls for NAP, and Permutations */}
        {(betType === "NAP" || betType === "Permutations") && (
          <div className="form-group">
            <label htmlFor="numberOfBalls">Nombre de Boules:</label>
            <select
              id="numberOfBalls"
              value={numberOfBalls}
              onChange={handleNumberOfBallsChange}
            >
              {betType === "NAP" ? (
                <>
                  <option value={3}>3 Boules</option>
                  <option value={4}>4 Boules</option>
                  <option value={5}>5 Boules</option>
                </>
              ) : ( // Permutations (3 to 20 balls)
                <>
                  {Array.from({ length: 18 }, (_, i) => i + 3).map((num) => (
                    <option key={num} value={num}>
                      {num} Boules
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}

        {/* Dynamic number input fields */}
        <div className="form-group">
          <label>Numéros:</label>
          <div className="numbers-input-container">
            {Array.from({ length: (betType === "NAP" || betType === "Permutations") ? numberOfBalls : maxNumbersAllowed }).map((_, index) => (
              <input
                key={index}
                type="number"
                value={numbers[index] || ""}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (isNaN(value)) {
                    return;
                  }
                  const newNumbers = [...numbers];
                  newNumbers[index] = value;
                  setNumbers(newNumbers);
                }}
                className="number-input"
                placeholder={`Numéro ${index + 1}`}
                disabled={betType === "DoubleNumber" || betType === "Annagrammesimple"} 
              />
            ))}
            {(betType !== "DoubleNumber" && betType !== "Annagrammesimple") && numbers.length < maxNumbersAllowed && (
              <input
                type="number"
                value={currentNumber}
                onChange={(e) => {
                  setCurrentNumber(e.target.value);
                }}
                className="number-input"
                placeholder="Ajouter un numéro"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNumber();
                  }
                }}
              />
            )}
            {(betType !== "DoubleNumber" && betType !== "Annagrammesimple") && (
              <button type="button" onClick={addNumber} className="add-number-button">
                Ajouter
              </button>
            )}
            </div>
          <div className="selected-numbers-container">
            {numbers.map((num, index) => (
              <span key={index} className="selected-number-tag">
                {num.toString().padStart(2, '0')}
                <button type="button" onClick={() => removeNumber(index)}>&times;</button>
                    </span>
                  ))}
                </div>
        {(betType === "DoubleNumber" || betType === "Annagrammesimple") && (
            <button type="button" onClick={handleGenerateAutoNumbers} className="auto-numbers-button">
              Générer les numéros automatiques
          </button>
        )}
        
        {/* Affichage spécial pour les anagrammes */}
        {betType === "Annagrammesimple" && numbers.length > 0 && (
          <div className="anagrammes-display">
            <h4>Anagrammes générés (37 paires):</h4>
            <div className="anagrammes-grid">
              {Array.from({ length: Math.ceil(numbers.length / 2) }, (_, index) => {
                const firstNum = numbers[index * 2];
                const secondNum = numbers[index * 2 + 1];
                return (
                  <span key={index} className="anagramme-pair">
                    <span className="anagramme-number">{firstNum.toString().padStart(2, '0')}</span>
                    <span className="anagramme-separator">-</span>
                    <span className="anagramme-number">{secondNum.toString().padStart(2, '0')}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        </div>
        
        <div className="form-group">
          <label htmlFor="formula">Formule:</label>
        <select 
            id="formula"
          value={formula} 
            onChange={handleFormulaChange}
            disabled={betType === "Annagrammesimple" && !currentGameHasDoubleChance} // Ne désactiver que si pas de double chance
          >
            {formulaOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* New: Number of Prises for NAP3/NAP4, Annagrammesimple, Double Number, Permutations */}
        {shouldShowPrisesField(betType, formula, numberOfBalls) && (
          <div className="form-group">
            <label htmlFor="numberOfPrises">Nombre de prises</label>
            <select
              id="numberOfPrises"
              value={numberOfPrises}
              onChange={handleNumberOfPrisesChange}
              className="form-control"
            >
              <option value="">Sélectionnez</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
          ))}
        </select>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="stake">Mise:</label>
        <input
          type="number"
            id="stake"
          value={stake}
          onChange={handleStakeChange}
            placeholder="Entrez votre mise"
            disabled={( (betType === "NAP" && (formula === "NAP3" || formula === "NAP4")) ||
                       betType === "Annagrammesimple" ||
                       betType === "DoubleNumber" ||
                       betType === "Permutations" ) && numberOfPrises !== ""}
          />
        </div>

        <div className="form-group">
          <label htmlFor="gains">Gains Estimés:</label>
          <input
            type="text"
            id="gains"
            value={gains}
            readOnly
          />
        </div>

          <button 
          type="button"
          onClick={handleAddCoupon}
          className="submit-button"
            disabled={!isCouponValid()}
          >
            AJOUTER LE COUPON AU PARI
          </button>
      </form>

      {showCouponDisplay && couponDetails && (
        <BetCouponDisplay
          ticketNumber={couponDetails.ticketNumber}
          date={couponDetails.date}
          gameName={couponDetails.gameName}
          betType={couponDetails.betType}
          numbers={couponDetails.numbers}
          formula={couponDetails.formula}
          stake={couponDetails.stake}
          gains={couponDetails.gains}
          prise={couponDetails.prise}
          onDelete={handleDeleteCoupon}
          onValidate={handleValidateCoupon}
          onAddToCart={() => alert('Ajouté au panier (statique)')}
        />
      )}
    </div>
  );
};

export default BetForm;