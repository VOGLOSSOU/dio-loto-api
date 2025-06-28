// gameCalculations.ts
// Fichier dédié aux calculs de gains et à la logique métier

// Définitions des types
export type BetType = "FirstouonBK" | "NAP" | "Twosûrs" | "Permutations" | "DoubleNumber" | "Annagrammesimple";

export type FormulaOption = 
  | "Directe"
  | "Position1"
  | "Position2"
  | "Position3"
  | "Position4"
  | "Position5"
  | "NAP3"
  | "NAP4"
  | "NAP5"
  | "NAP3DoubleChance"
  | "NAP4DoubleChance"
  | "NAP5DoubleChance"
  | "Turbo2"
  | "Turbo3"
  | "Turbo4"
  // Double Chance specific formulas
  | "DirecteDoubleChance"
  | "Turbo2DoubleChance"
  | "Turbo3DoubleChance"
  | "Turbo4DoubleChance"
  | "AnnagrammesimpleDoubleChance";

export interface CouponDetails {
  ticketNumber: string;
  date: string;
  gameName: string;
  betType: BetType;
  numbers: number[];
  formula: FormulaOption;
  stake: string;
  gains: string;
  prise: number;
}

// Nouvelle configuration pour les permutations
const permutationConfig = {
  stakePerPrise: {
      3: 30, 4: 60, 5: 100, 6: 150, 7: 210, 8: 280, 9: 360, 10: 450, 11: 550, 12: 660, 13: 780, 14: 910, 15: 1050, 16: 1200, 17: 1360, 18: 1530, 19: 1710, 20: 1900
  },
  multipliers: {
      Directe: {
          3: [100, 300],
          4: [50, 150, 300],
          5: [30, 90, 180, 300],
          6: [20, 60, 120, 200],
          // 7 à 20 boules
          default: [3000, 9000, 18000, 30000]
      },
      Turbo2: 30000,
      Turbo3: 10000,
      Turbo4: 5000,
  }
};

// Configuration des multiplicateurs selon les spécifications
const gameMultipliers = {
  FirstouonBK: {
    Directe: 14,
    Position1: 60,
    Position2: 20,
    Position3: 18,
    Position4: 17,
    Position5: 16
  },
  NAP: {
    "NAP3": 3000,
    "NAP4": 8000,
    "NAP4(permde5boules)": 1600,
    "NAP5": 50000
  },
  Twosûrs: {
    Directe: 300,
    Turbo2: 3000,
    Turbo3: 800,
    Turbo4: 500
  },
  Permutations: {},
  DoubleNumber: {
    Directe: 3000,
    Turbo2: 30000,
    Turbo3: 10000,
    Turbo4: 5000
  },
  Annagrammesimple: {
    Directe: 3000
    },
  FixedPermutationMultipliers7to20: {
    "2boulestrouvées": 3000,
      "3boulestrouvées": 9000,
      "4boulestrouvées": 18000,
      "5boulestrouvées": 30000
  },
  DoubleChanceMultipliers: {
    NAP3DoubleChance: 3000,
    Turbo2DoubleChance: 3000,
    Turbo3DoubleChance: 800,
    Turbo4DoubleChance: 500,
    AnnagrammesimpleDoubleChance: 3000,
  }
};

// Liste des jeux qui supportent la double chance
export const doubleChanceGames: string[] = [
  // Côte d'Ivoire
  "coteivoire7",
  "coteivoire8",
  "coteivoire10",
  "coteivoire13",
  "coteivoire16",
  "coteivoire21",
  "coteivoire22",
  "coteivoire23",
  "coteivoire1",   // 1h du matin (weekend)
  "coteivoire3",   // 3h du matin (weekend)
  // Togo
  "togo8",
  // Ghana (ajoute ici tous les horaires concernés)
  "ghana20"
];

// Configuration des formules par type de pari
export const getBetTypeConfig = (betType: BetType, currentGameHasDoubleChance: boolean, numberOfBalls: number) => {
  let options: FormulaOption[] = [];
  let minNums = 1;
  let maxNums = 1;

  switch (betType) {
    case "FirstouonBK":
      options = ["Directe", "Position1", "Position2", "Position3", "Position4", "Position5"];
      minNums = maxNums = 1;
      break;
    case "NAP":
      options = ["NAP3", "NAP4", "NAP5"];
      minNums = maxNums = numberOfBalls;
      if (currentGameHasDoubleChance) {
        options.push("NAP3DoubleChance", "NAP4DoubleChance", "NAP5DoubleChance");
      }
      break;
    case "Twosûrs":
      options = ["Directe", "Turbo2", "Turbo3", "Turbo4"];
      minNums = maxNums = 2;
      if (currentGameHasDoubleChance) {
        options.push("Turbo2DoubleChance", "Turbo3DoubleChance", "Turbo4DoubleChance");
      }
      break;
    case "Permutations":
      options = ["Directe", "Turbo2", "Turbo3", "Turbo4"];
      minNums = maxNums = numberOfBalls;
      if (currentGameHasDoubleChance) {
         options.push("DirecteDoubleChance", "Turbo2DoubleChance", "Turbo3DoubleChance", "Turbo4DoubleChance");
      }
      break;
    case "DoubleNumber":
      options = ["Directe", "Turbo2", "Turbo3", "Turbo4"];
      minNums = maxNums = 8;
      if (currentGameHasDoubleChance) {
        options.push("Turbo2DoubleChance", "Turbo3DoubleChance", "Turbo4DoubleChance");
      }
      break;
    case "Annagrammesimple":
      options = ["Directe"];
      minNums = maxNums = 0;
      if (currentGameHasDoubleChance) {
        options.push("AnnagrammesimpleDoubleChance");
      }
      break;
  }
  return { options, minNums, maxNums };
};

// Fonction principale de calcul des gains
export const calculateGains = (
  betType: BetType,
  formula: FormulaOption,
  stake: string,
  numbers: number[],
  minNumbersRequired: number,
  numberOfBalls: number,
  numberOfPrises?: string
): string => {
  const amount = parseFloat(stake);
  const prises = numberOfPrises ? parseFloat(numberOfPrises) : 0;
  
  // Validation des entrées - only check for non-prise based bets here
  if (isNaN(amount) || amount <= 0) {
    if (!(betType === "NAP" || betType === "Annagrammesimple" || betType === "DoubleNumber" || betType === "Permutations")) {
    return "";
    }
  }

  // Vérification du nombre de numéros requis (sauf pour types spéciaux)
  if (betType !== "DoubleNumber" && betType !== "Annagrammesimple" && betType !== "Permutations" && numbers.length < minNumbersRequired) {
    return "";
  }

  let calculatedGain: number = 0; // This will store the base gain for numerical calculations

  // Helper function to apply 60/40 split
  const applyDoubleChanceSplit = (baseGain: number): string => {
    const winGain = (baseGain * 0.6).toFixed(2);
    const machineGain = (baseGain * 0.4).toFixed(2);
    return `${winGain} (Win) / ${machineGain} (Machine)`;
  };

  switch (betType) {
    case "FirstouonBK":
      calculatedGain = amount * gameMultipliers.FirstouonBK[formula as keyof typeof gameMultipliers.FirstouonBK];
      return calculatedGain > 0 ? calculatedGain.toFixed(2) : "";

    case "NAP":
      if (formula === "NAP3") {
        if (numberOfBalls === 3) {
          // Cas simple : 3 boules, NAP3, pas de prises
          if (amount < 10) return "";
          calculatedGain = amount * 3000;
        } else if (numberOfBalls === 4) {
          // Cas avec prises : 4 boules, NAP3
          calculatedGain = prises * 30000;
        } else if (numberOfBalls === 5) {
          // Cas avec prises : 5 boules, NAP3
          calculatedGain = prises * 30000;
        }
      } else if (formula === "NAP4") {
        if (numberOfBalls === 4) {
          // Cas simple : 4 boules, NAP4, pas de prises
          if (amount < 10) return "";
          calculatedGain = amount * 8000;
        } else if (numberOfBalls === 5) {
          // Cas avec prises : 5 boules, NAP4
          calculatedGain = prises * 80000;
        }
      } else if (formula === "NAP5") {
        // Cas simple : 5 boules, NAP5, pas de prises
        if (amount < 10) return "";
        calculatedGain = amount * 50000;
      } else if (formula === "NAP3DoubleChance") {
        if (numberOfBalls === 3) {
          // Cas simple : 3 boules, NAP3DoubleChance, pas de prises
          if (amount < 10) return "";
          calculatedGain = amount * 3000;
          return applyDoubleChanceSplit(calculatedGain);
        } else if (numberOfBalls === 4) {
          // Cas avec prises : 4 boules, NAP3DoubleChance
          calculatedGain = prises * 30000;
          return applyDoubleChanceSplit(calculatedGain);
        } else if (numberOfBalls === 5) {
          // Cas avec prises : 5 boules, NAP3DoubleChance
          calculatedGain = prises * 30000;
          return applyDoubleChanceSplit(calculatedGain);
        }
      } else if (formula === "NAP4DoubleChance") {
        if (numberOfBalls === 4) {
          // Cas simple : 4 boules, NAP4DoubleChance, pas de prises
          if (amount < 10) return "";
          calculatedGain = amount * 8000;
          return applyDoubleChanceSplit(calculatedGain);
        } else if (numberOfBalls === 5) {
          // Cas avec prises : 5 boules, NAP4DoubleChance
          calculatedGain = prises * 80000;
          return applyDoubleChanceSplit(calculatedGain);
        }
      } else if (formula === "NAP5DoubleChance") {
        // Cas simple : 5 boules, NAP5DoubleChance, pas de prises
        if (amount < 10) return "";
        calculatedGain = amount * 50000;
        return applyDoubleChanceSplit(calculatedGain);
      } else {
        return ""; // Invalid combination
      }
      return calculatedGain > 0 ? calculatedGain.toFixed(2) : "";

    case "Twosûrs":
      if (formula === "Directe") {
        calculatedGain = amount * gameMultipliers.Twosûrs.Directe;
      } else if (formula === "Turbo2") {
        calculatedGain = amount * gameMultipliers.Twosûrs.Turbo2;
      } else if (formula === "Turbo3") {
        calculatedGain = amount * gameMultipliers.Twosûrs.Turbo3;
      } else if (formula === "Turbo4") {
        calculatedGain = amount * gameMultipliers.Twosûrs.Turbo4;
      } else if (formula === "Turbo2DoubleChance") {
        calculatedGain = amount * gameMultipliers.DoubleChanceMultipliers.Turbo2DoubleChance;
        return applyDoubleChanceSplit(calculatedGain);
      } else if (formula === "Turbo3DoubleChance") {
        calculatedGain = amount * gameMultipliers.DoubleChanceMultipliers.Turbo3DoubleChance;
        return applyDoubleChanceSplit(calculatedGain);
      } else if (formula === "Turbo4DoubleChance") {
        calculatedGain = amount * gameMultipliers.DoubleChanceMultipliers.Turbo4DoubleChance;
        return applyDoubleChanceSplit(calculatedGain);
      } else {
        return "";
      }
      return calculatedGain > 0 ? calculatedGain.toFixed(2) : "";

    case "Permutations":
      {
        const isDoubleChance = formula.includes("DoubleChance");
        const baseFormula = formula.replace("DoubleChance", "") as "Directe" | "Turbo2" | "Turbo3" | "Turbo4";
        const safePrises = prises || 0;

        if (baseFormula === "Directe") {
          const directMultipliers = 
            (permutationConfig.multipliers.Directe as any)[numberOfBalls] || 
            permutationConfig.multipliers.Directe.default;

          const gainStrings = directMultipliers.map((mult: number, index: number) => {
            const gain = safePrises * mult;
            const label = `${index + 2} boules trouvées`;
            const formattedGain = isDoubleChance ? applyDoubleChanceSplit(gain) : gain.toFixed(2);
            return `${label}: ${formattedGain}`;
          });
          return gainStrings.join(" / ");
        }

        if (baseFormula === "Turbo2" || baseFormula === "Turbo3" || baseFormula === "Turbo4") {
          const multiplier = permutationConfig.multipliers[baseFormula];
          const calculatedGain = safePrises * multiplier;
          return isDoubleChance 
            ? applyDoubleChanceSplit(calculatedGain) 
            : (calculatedGain > 0 ? calculatedGain.toFixed(2) : "");
        }
        
        return "";
      }

    case "DoubleNumber":
      if (formula === "Directe") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Directe;
      } else if (formula === "Turbo2") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Turbo2;
      } else if (formula === "Turbo3") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Turbo3;
      } else if (formula === "Turbo4") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Turbo4;
      } else if (formula === "Turbo2DoubleChance") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Turbo2;
        return applyDoubleChanceSplit(calculatedGain);
      } else if (formula === "Turbo3DoubleChance") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Turbo3;
        return applyDoubleChanceSplit(calculatedGain);
      } else if (formula === "Turbo4DoubleChance") {
        calculatedGain = prises * gameMultipliers.DoubleNumber.Turbo4;
        return applyDoubleChanceSplit(calculatedGain);
      } else {
        return "";
      }
      return calculatedGain > 0 ? calculatedGain.toFixed(2) : "";

    case "Annagrammesimple":
      if (formula === "Directe") {
        calculatedGain = prises * gameMultipliers.Annagrammesimple.Directe;
      } else if (formula === "AnnagrammesimpleDoubleChance") {
        calculatedGain = prises * gameMultipliers.Annagrammesimple.Directe;
        return applyDoubleChanceSplit(calculatedGain);
      } else {
        return "";
      }
      return calculatedGain > 0 ? calculatedGain.toFixed(2) : "";

    default:
      return "";
  }
};

// Génération automatique de numéros
export const generateAutoNumbers = (betType: BetType, minNumbersRequired: number, numberOfBalls?: number): number[] => {
  if (betType === "DoubleNumber") {
    return [11, 22, 33, 44, 55, 66, 77, 88];
  } else if (betType === "Annagrammesimple") {
    // Les vrais anagrammes selon la liste fournie
    return [1, 10, 2, 20, 3, 30, 4, 40, 5, 50, 6, 60, 7, 70, 8, 80, 9, 90, 12, 21, 13, 31, 14, 41, 15, 51, 16, 61, 17, 71, 18, 81, 23, 32, 24, 42, 25, 52, 26, 62, 27, 72, 28, 82, 34, 43, 35, 53, 36, 63, 37, 73, 38, 83, 45, 54, 46, 64, 47, 74, 48, 84, 56, 65, 57, 75, 58, 85, 67, 76, 68, 86, 78, 87];
  } else if (betType === "NAP" && numberOfBalls) {
    const generated: number[] = [];
    while (generated.length < numberOfBalls) {
      const randomNumber = Math.floor(Math.random() * 90) + 1;
      if (!generated.includes(randomNumber)) {
        generated.push(randomNumber);
  }
    }
    return generated;
  } else if (betType === "Permutations" && numberOfBalls) { 
    const generated: number[] = [];
    while (generated.length < numberOfBalls) {
      const randomNumber = Math.floor(Math.random() * 90) + 1;
      if (!generated.includes(randomNumber)) {
        generated.push(randomNumber);
      }
    }
    return generated;
  }

  const generated: number[] = [];
  while (generated.length < minNumbersRequired) {
    const randomNumber = Math.floor(Math.random() * 90) + 1;
    if (!generated.includes(randomNumber)) {
      generated.push(randomNumber);
    }
  }
  return generated;
};

// Validation du coupon
export const validateCoupon = (
  betType: BetType,
  numbers: number[],
  stake: string,
  minNumbersRequired: number,
  numberOfBalls?: number,
  formula?: FormulaOption,
  numberOfPrises?: string
): boolean => {
  const amount = parseFloat(stake);
  const prises = numberOfPrises ? parseFloat(numberOfPrises) : 0;

  // For prise-based bets, amount can be 0 or empty initially, validation is on numberOfPrises
  const isPriseBasedBet = (betType === "NAP" ||
                          betType === "Annagrammesimple" ||
                          betType === "DoubleNumber" ||
                          betType === "Permutations");

  if (isNaN(amount) || amount <= 0) {
    if (!isPriseBasedBet) {
      return false;
    }
  }

  // Validation spécifique pour NAP
  if (betType === "NAP") {
    // Cas où on a besoin d'une mise minimale de 10f
    const needsMinStake = (formula === "NAP3" && numberOfBalls === 3) ||
                         (formula === "NAP4" && numberOfBalls === 4) ||
                         (formula === "NAP5" && numberOfBalls === 5) ||
                         (formula === "NAP3DoubleChance" && numberOfBalls === 3) ||
                         (formula === "NAP4DoubleChance" && numberOfBalls === 4) ||
                         (formula === "NAP5DoubleChance" && numberOfBalls === 5);

    if (needsMinStake && amount < 10) {
      return false;
    }

    // Cas où on a besoin de prises
    const needsPrises = (formula === "NAP3" && (numberOfBalls === 4 || numberOfBalls === 5)) ||
                       (formula === "NAP4" && numberOfBalls === 5) ||
                       (formula === "NAP3DoubleChance" && (numberOfBalls === 4 || numberOfBalls === 5)) ||
                       (formula === "NAP4DoubleChance" && numberOfBalls === 5);

    if (needsPrises && prises <= 0) {
      return false;
    }
  }
  
  if (betType === "DoubleNumber" || betType === "Annagrammesimple" || betType === "Permutations") {
    return prises > 0;
  }

  if (betType === "NAP") {
    return numbers.length === numberOfBalls;
  }
  
  return numbers.length >= minNumbersRequired && numbers.length <= 5;
};

// Fonction pour déterminer si le champ nombre de prises doit être affiché
export const shouldShowPrisesField = (
  betType: BetType,
  formula: FormulaOption,
  numberOfBalls: number
): boolean => {
  // Toujours afficher le champ nombre de prises pour Annagrammesimple et DoubleNumber
  if (betType === "Annagrammesimple" || betType === "DoubleNumber" || betType === "Permutations") return true;
  
  if (betType !== "NAP") return false;

  // Cas où le champ nombre de prises ne doit PAS être affiché
  const noPrisesCases = [
    { balls: 3, formula: "NAP3" },
    { balls: 4, formula: "NAP4" },
    { balls: 5, formula: "NAP5" },
    { balls: 3, formula: "NAP3DoubleChance" },
    { balls: 4, formula: "NAP4DoubleChance" },
    { balls: 5, formula: "NAP5DoubleChance" }
  ];

  return !noPrisesCases.some(
    case_ => case_.balls === numberOfBalls && case_.formula === formula
  );
};