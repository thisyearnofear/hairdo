/**
 * Style matcher — reasons over the tradeoff database to rank styles
 * based on user preferences and constraints.
 *
 * This is the core intelligence layer of the Style Intelligence ASP.
 * It takes user constraints (hair type, climate, budget, maintenance
 * tolerance, lifestyle) and returns ranked style recommendations with
 * match scores and reasoning.
 */

import stylesData from "../data/styles.json";

export interface StyleEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  replicatePrompt: string;
  hairTypes: string[];
  faceShapes: string[];
  maintenance: {
    barberFrequency: string;
    barberFrequencyDays: number;
    dailyMinutes?: number;
    description: string;
  };
  cost: {
    perVisit: number;
    currency: string;
    monthlyCost: number;
  };
  comfort: {
    itchiness: number;
    heatRetention: number;
    helmetCompatible: boolean;
    headphoneCompatible: boolean;
    description: string;
  };
  climate: {
    humid: number;
    dry: number;
    hot: number;
    cold: number;
    description: string;
  };
  skillRequired: string;
  skillDescription: string;
  culturalContext: string;
  popularity: number;
  versatility: number;
  tags: string[];
}

export interface UserPreferences {
  hairType?: string;       // e.g. "4C"
  faceShape?: string;      // e.g. "oval"
  climate?: string;        // "humid" | "dry" | "hot" | "cold" | "temperate"
  budgetPerVisit?: number; // max USD per barber visit
  monthlyBudget?: number;  // max USD per month
  maintenanceTolerance?: "low" | "medium" | "high";
  // max days between barber visits
  maxBarberFrequencyDays?: number;
  lifestyle?: "corporate" | "creative" | "athletic" | "casual";
  helmetFriendly?: boolean;
  headphoneFriendly?: boolean;
  preferredCategories?: string[];
  excludeCategories?: string[];
}

export interface StyleRecommendation {
  style: StyleEntry;
  score: number;            // 0-100
  matchReasons: string[];   // why this style matches
  mismatchReasons: string[]; // where it falls short
  tradeoffs: {
    maintenance: string;
    cost: string;
    comfort: string;
    climate: string;
  };
}

const styles = stylesData.styles as StyleEntry[];

/**
 * Score a single style against user preferences.
 * Returns a score from 0-100 plus reasons.
 */
function scoreStyle(
  style: StyleEntry,
  prefs: UserPreferences
): { score: number; matchReasons: string[]; mismatchReasons: string[] } {
  let score = 0;
  let maxScore = 0;
  const matchReasons: string[] = [];
  const mismatchReasons: string[] = [];

  // 1. Hair type compatibility (weight: 25)
  maxScore += 25;
  if (prefs.hairType) {
    if (style.hairTypes.includes(prefs.hairType)) {
      score += 25;
      matchReasons.push(`Compatible with ${prefs.hairType} hair type`);
    } else {
      mismatchReasons.push(
        `Not ideal for ${prefs.hairType} hair type (best for ${style.hairTypes.slice(0, 3).join(", ")})`
      );
    }
  } else {
    score += 12; // partial credit if no preference specified
  }

  // 2. Face shape (weight: 10)
  maxScore += 10;
  if (prefs.faceShape) {
    if (style.faceShapes.includes(prefs.faceShape)) {
      score += 10;
      matchReasons.push(`Suits ${prefs.faceShape} face shape`);
    } else {
      mismatchReasons.push(
        `May not suit ${prefs.faceShape} face shape`
      );
    }
  } else {
    score += 5;
  }

  // 3. Climate (weight: 20)
  maxScore += 20;
  if (prefs.climate && prefs.climate !== "temperate") {
    const climateScore = style.climate[prefs.climate as keyof typeof style.climate];
    if (typeof climateScore === "number") {
      const normalized = (climateScore / 5) * 20;
      score += normalized;
      if (climateScore >= 4) {
        matchReasons.push(`Good fit for ${prefs.climate} climate`);
      } else if (climateScore <= 2) {
        mismatchReasons.push(`Challenging in ${prefs.climate} climate`);
      }
    }
  } else {
    score += 10; // temperate or unspecified — neutral
  }

  // 4. Budget per visit (weight: 15)
  maxScore += 15;
  if (prefs.budgetPerVisit) {
    if (style.cost.perVisit <= prefs.budgetPerVisit) {
      score += 15;
      matchReasons.push(
        `Within budget ($${style.cost.perVisit}/visit vs $${prefs.budgetPerVisit} max)`
      );
    } else {
      const overage = style.cost.perVisit - prefs.budgetPerVisit;
      const penalty = Math.min(15, (overage / prefs.budgetPerVisit) * 15);
      score += Math.max(0, 15 - penalty);
      mismatchReasons.push(
        `Over budget ($${style.cost.perVisit}/visit vs $${prefs.budgetPerVisit} max)`
      );
    }
  } else {
    score += 7;
  }

  // 5. Monthly budget (weight: 10)
  maxScore += 10;
  if (prefs.monthlyBudget) {
    if (style.cost.monthlyCost <= prefs.monthlyBudget) {
      score += 10;
      matchReasons.push(
        `Monthly cost within budget ($${style.cost.monthlyCost}/month)`
      );
    } else {
      const overage = style.cost.monthlyCost - prefs.monthlyBudget;
      const penalty = Math.min(10, (overage / prefs.monthlyBudget) * 10);
      score += Math.max(0, 10 - penalty);
      mismatchReasons.push(
        `Monthly cost over budget ($${style.cost.monthlyCost}/month vs $${prefs.monthlyBudget} max)`
      );
    }
  } else {
    score += 5;
  }

  // 6. Maintenance tolerance (weight: 15)
  maxScore += 15;
  if (prefs.maintenanceTolerance) {
    const freqDays = style.maintenance.barberFrequencyDays;
    const dailyMin = style.maintenance.dailyMinutes ?? 0;

    if (prefs.maintenanceTolerance === "low") {
      // low tolerance: wants infrequent barber visits, minimal daily work
      if (freqDays >= 30 && dailyMin <= 5) {
        score += 15;
        matchReasons.push("Low maintenance — fits your preference");
      } else if (freqDays >= 21 && dailyMin <= 10) {
        score += 10;
      } else if (freqDays <= 7 || dailyMin >= 20) {
        score += 0;
        mismatchReasons.push(
          `High maintenance (${style.maintenance.barberFrequency} barber visits, ${dailyMin} min/day)`
        );
      } else {
        score += 5;
        mismatchReasons.push("Moderate maintenance — more than your preference");
      }
    } else if (prefs.maintenanceTolerance === "medium") {
      if (freqDays >= 14 && dailyMin <= 15) {
        score += 15;
        matchReasons.push("Maintenance level fits your tolerance");
      } else if (freqDays <= 7 || dailyMin >= 25) {
        score += 5;
        mismatchReasons.push("Higher maintenance than your preference");
      } else {
        score += 10;
      }
    } else {
      // high tolerance — anything goes
      score += 15;
      if (freqDays <= 7 || dailyMin >= 20) {
        matchReasons.push("High-maintenance style — you can handle it");
      }
    }
  } else {
    score += 7;
  }

  // 7. Max barber frequency (weight: 5)
  maxScore += 5;
  if (prefs.maxBarberFrequencyDays) {
    if (style.maintenance.barberFrequencyDays <= prefs.maxBarberFrequencyDays) {
      score += 5;
    } else {
      mismatchReasons.push(
        `Requires ${style.maintenance.barberFrequency} barber visits (you wanted every ${prefs.maxBarberFrequencyDays}+ days)`
      );
    }
  } else {
    score += 3;
  }

  // 8. Helmet/headphone compatibility (weight: 5)
  maxScore += 5;
  if (prefs.helmetFriendly !== undefined || prefs.headphoneFriendly !== undefined) {
    let compatScore = 0;
    let compatMax = 0;
    if (prefs.helmetFriendly) {
      compatMax += 2;
      if (style.comfort.helmetCompatible) compatScore += 2;
      else mismatchReasons.push("Not helmet-friendly");
    }
    if (prefs.headphoneFriendly) {
      compatMax += 3;
      if (style.comfort.headphoneCompatible) compatScore += 3;
      else mismatchReasons.push("Not over-ear headphone-friendly");
    }
    score += compatMax > 0 ? (compatScore / compatMax) * 5 : 3;
  } else {
    score += 3;
  }

  // 9. Category preferences (weight: 5)
  maxScore += 5;
  if (prefs.preferredCategories && prefs.preferredCategories.length > 0) {
    if (prefs.preferredCategories.includes(style.category)) {
      score += 5;
      matchReasons.push(`In your preferred category (${style.category})`);
    } else {
      score += 0;
    }
  } else {
    score += 2;
  }

  // 10. Lifestyle bonus (weight: 5)
  maxScore += 5;
  if (prefs.lifestyle) {
    switch (prefs.lifestyle) {
      case "corporate":
        if (style.tags.includes("professional") || style.tags.includes("conservative")) {
          score += 5;
          matchReasons.push("Professional look for corporate environment");
        } else if (style.tags.includes("edgy") || style.tags.includes("bold")) {
          score += 1;
          mismatchReasons.push("May be too bold for corporate environment");
        } else {
          score += 3;
        }
        break;
      case "creative":
        if (style.tags.includes("trendy") || style.tags.includes("bold") || style.tags.includes("modern")) {
          score += 5;
          matchReasons.push("Expressive look for creative environment");
        } else {
          score += 3;
        }
        break;
      case "athletic":
        if (style.comfort.helmetCompatible && style.comfort.heatRetention <= 2) {
          score += 5;
          matchReasons.push("Practical for active lifestyle");
        } else {
          score += 2;
        }
        break;
      case "casual":
        if (style.tags.includes("low-maintenance") || style.tags.includes("zero-maintenance")) {
          score += 5;
          matchReasons.push("Easygoing style for casual lifestyle");
        } else {
          score += 3;
        }
        break;
    }
  } else {
    score += 2;
  }

  // Normalize to 0-100
  const normalizedScore = Math.round((score / maxScore) * 100);

  return { score: normalizedScore, matchReasons, mismatchReasons };
}

/**
 * Build human-readable tradeoff summaries for a style.
 */
function buildTradeoffs(style: StyleEntry): StyleRecommendation["tradeoffs"] {
  return {
    maintenance: style.maintenance.description,
    cost: `$${style.cost.perVisit}/visit, ~$${style.cost.monthlyCost}/month (${style.maintenance.barberFrequency} barber visits)`,
    comfort: style.comfort.description,
    climate: style.climate.description,
  };
}

/**
 * Rank styles against user preferences.
 * Returns sorted recommendations with scores and reasoning.
 */
export function recommendStyles(
  prefs: UserPreferences,
  limit = 10
): StyleRecommendation[] {
  let filtered = styles;

  // Hard exclusions
  if (prefs.excludeCategories && prefs.excludeCategories.length > 0) {
    filtered = filtered.filter(
      (s) => !prefs.excludeCategories!.includes(s.category)
    );
  }

  // Score and rank
  const scored = filtered.map((style) => {
    const { score, matchReasons, mismatchReasons } = scoreStyle(style, prefs);
    return {
      style,
      score,
      matchReasons,
      mismatchReasons,
      tradeoffs: buildTradeoffs(style),
    };
  });

  // Sort by score descending, then by popularity as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.style.popularity - a.style.popularity;
  });

  return scored.slice(0, limit);
}

/**
 * Get a single style by ID.
 */
export function getStyleById(id: string): StyleEntry | undefined {
  return styles.find((s) => s.id === id);
}

/**
 * Get all styles (for catalog browsing).
 */
export function getAllStyles(): StyleEntry[] {
  return styles;
}

/**
 * Get all categories.
 */
export function getCategories(): string[] {
  return [...new Set(styles.map((s) => s.category))];
}

/**
 * Get all hair types from the database.
 */
export function getHairTypes(): Record<string, string> {
  return stylesData.hairTypes;
}
