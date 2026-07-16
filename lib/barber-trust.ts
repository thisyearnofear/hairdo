/**
 * Barber trust-score engine — computes trust scores for barbers
 * based on their verified onchain attestation history.
 *
 * Trust is computed from four factors:
 * 1. Verified cuts — number of onchain attestations (weight: 35)
 * 2. Specialty coverage — how many style categories they can execute (weight: 25)
 * 3. Consistency — regular attestation issuance vs sporadic (weight: 20)
 * 4. Recency — recent activity weighted higher (weight: 20)
 *
 * The system is designed to work with our existing contract's verification
 * mechanism (isTokenUsed) while using an EAS-compatible schema format.
 * When EAS is deployed on Lisk, the attestation data can be read directly
 * from onchain attestations instead of the local database.
 */

import barbersData from "../data/barbers.json";

export interface BarberAttestation {
  tokenId: string;
  styleId: string;
  styleName: string;
  clientAddress: string;
  timestamp: number;
  rating: number;
  txVerified: boolean;
}

export interface Barber {
  id: string;
  name: string;
  address: string;
  shop: string;
  city: string;
  state: string;
  yearsExperience: number;
  licenseVerified: boolean;
  specialties: string[];
  specialtyStyles: string[];
  allStylesExecuted: string[];
  attestationHistory: BarberAttestation[];
  basePrice: number;
  priceRange: [number, number];
  bookingUrl: string;
  socialProof: string[];
}

export interface TrustScoreBreakdown {
  verifiedCuts: number;
  verifiedCutsScore: number;
  specialtyCoverage: number;
  specialtyCoverageScore: number;
  consistency: number;
  consistencyScore: number;
  recency: number;
  recencyScore: number;
  averageRating: number;
}

export interface BarberTrustProfile {
  barber: Barber;
  trustScore: number;
  breakdown: TrustScoreBreakdown;
  verifiedCuts: number;
  uniqueStyles: number;
  uniqueClients: number;
  lastActiveTimestamp: number | null;
  daysSinceLastCut: number | null;
  recommendedFor: string[]; // style IDs this barber excels at
}

const barbers = barbersData.barbers as Barber[];

/**
 * Compute the trust score for a barber.
 * Returns a score from 0-100 plus a breakdown.
 */
export function computeTrustScore(barber: Barber): {
  score: number;
  breakdown: TrustScoreBreakdown;
} {
  const now = Date.now();
  const attestations = barber.attestationHistory.filter((a) => a.txVerified);

  // 1. Verified cuts (weight: 35)
  // Scale: 0 cuts = 0, 5 cuts = 15, 10 cuts = 25, 20+ cuts = 35
  const verifiedCuts = attestations.length;
  const verifiedCutsScore = Math.min(35, Math.floor((verifiedCuts / 20) * 35));

  // 2. Specialty coverage (weight: 25)
  // How many unique styles has the barber executed onchain?
  const uniqueStyles = new Set(attestations.map((a) => a.styleId)).size;
  // Also consider their declared specialty styles
  const declaredSpecialties = barber.specialtyStyles.length;
  // Blend: 60% onchain proof + 40% declared (declared alone is less trustworthy)
  const onchainCoverage = Math.min(15, (uniqueStyles / 10) * 15);
  const declaredCoverage = Math.min(10, (declaredSpecialties / 12) * 10);
  const specialtyCoverageScore = Math.round(onchainCoverage + declaredCoverage);

  // 3. Consistency (weight: 20)
  // How regular is the attestation issuance? Measured by the standard
  // deviation of intervals between attestations. Lower variance = higher score.
  let consistencyScore = 10; // default for low-attestation barbers
  if (attestations.length >= 3) {
    const timestamps = attestations
      .map((a) => a.timestamp)
      .sort((a, b) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgInterval =
      intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);
    // Coefficient of variation (lower = more consistent)
    const cv = avgInterval > 0 ? stdDev / avgInterval : 1;
    // cv < 0.3 = very consistent (20), cv > 1.0 = sporadic (5)
    if (cv < 0.3) consistencyScore = 20;
    else if (cv < 0.5) consistencyScore = 17;
    else if (cv < 0.8) consistencyScore = 14;
    else if (cv < 1.0) consistencyScore = 10;
    else consistencyScore = 5;
  } else if (attestations.length >= 1) {
    consistencyScore = 8;
  }

  // 4. Recency (weight: 20)
  // How recent is the last attestation? Within 30 days = 20, 90 days = 15,
  // 180 days = 10, 365 days = 5, older = 0
  let recencyScore = 0;
  if (attestations.length > 0) {
    const lastTimestamp = Math.max(...attestations.map((a) => a.timestamp));
    const daysSinceLast = Math.floor((now - lastTimestamp) / (1000 * 60 * 60 * 24));
    if (daysSinceLast <= 30) recencyScore = 20;
    else if (daysSinceLast <= 90) recencyScore = 15;
    else if (daysSinceLast <= 180) recencyScore = 10;
    else if (daysSinceLast <= 365) recencyScore = 5;
    else recencyScore = 0;
  }

  // Average rating (bonus signal, not directly weighted but shown)
  const averageRating =
    attestations.length > 0
      ? attestations.reduce((sum, a) => sum + a.rating, 0) / attestations.length
      : 0;

  const score = verifiedCutsScore + specialtyCoverageScore + consistencyScore + recencyScore;

  return {
    score: Math.min(100, score),
    breakdown: {
      verifiedCuts,
      verifiedCutsScore,
      specialtyCoverage: uniqueStyles,
      specialtyCoverageScore,
      consistency: attestations.length >= 3 ? consistencyScore : 0,
      consistencyScore,
      recency: recencyScore,
      recencyScore,
      averageRating,
    },
  };
}

/**
 * Get a barber by wallet address.
 */
export function getBarberByAddress(address: string): Barber | undefined {
  return barbers.find(
    (b) => b.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get a barber by ID.
 */
export function getBarberById(id: string): Barber | undefined {
  return barbers.find((b) => b.id === id);
}

/**
 * Get all barbers.
 */
export function getAllBarbers(): Barber[] {
  return barbers;
}

/**
 * Build a full trust profile for a barber.
 */
export function getBarberTrustProfile(address: string): BarberTrustProfile | null {
  const barber = getBarberByAddress(address);
  if (!barber) return null;

  const { score, breakdown } = computeTrustScore(barber);
  const attestations = barber.attestationHistory.filter((a) => a.txVerified);

  const uniqueClients = new Set(
    attestations.map((a) => a.clientAddress.toLowerCase())
  ).size;

  const lastActiveTimestamp =
    attestations.length > 0
      ? Math.max(...attestations.map((a) => a.timestamp))
      : null;

  const daysSinceLastCut = lastActiveTimestamp
    ? Math.floor((Date.now() - lastActiveTimestamp) / (1000 * 60 * 60 * 24))
    : null;

  // Styles this barber is recommended for (intersection of specialty styles
  // and styles they have onchain proof of executing)
  const executedStyleIds = new Set(attestations.map((a) => a.styleId));
  const recommendedFor = barber.specialtyStyles.filter((s) =>
    executedStyleIds.has(s)
  );

  return {
    barber,
    trustScore: score,
    breakdown,
    verifiedCuts: attestations.length,
    uniqueStyles: new Set(attestations.map((a) => a.styleId)).size,
    uniqueClients,
    lastActiveTimestamp,
    daysSinceLastCut,
    recommendedFor,
  };
}

/**
 * Get all barber trust profiles, sorted by score.
 */
export function getAllBarberTrustProfiles(): BarberTrustProfile[] {
  return barbers
    .map((b) => {
      const { score, breakdown } = computeTrustScore(b);
      const attestations = b.attestationHistory.filter((a) => a.txVerified);
      const uniqueClients = new Set(
        attestations.map((a) => a.clientAddress.toLowerCase())
      ).size;
      const lastActiveTimestamp =
        attestations.length > 0
          ? Math.max(...attestations.map((a) => a.timestamp))
          : null;
      const daysSinceLastCut = lastActiveTimestamp
        ? Math.floor((Date.now() - lastActiveTimestamp) / (1000 * 60 * 60 * 24))
        : null;
      const executedStyleIds = new Set(attestations.map((a) => a.styleId));
      const recommendedFor = b.specialtyStyles.filter((s) =>
        executedStyleIds.has(s)
      );

      return {
        barber: b,
        trustScore: score,
        breakdown,
        verifiedCuts: attestations.length,
        uniqueStyles: new Set(attestations.map((a) => a.styleId)).size,
        uniqueClients,
        lastActiveTimestamp,
        daysSinceLastCut,
        recommendedFor,
      };
    })
    .sort((a, b) => b.trustScore - a.trustScore);
}

/**
 * Find barbers who can execute a specific style.
 * Returns sorted by trust score.
 */
export function findBarbersForStyle(styleId: string): BarberTrustProfile[] {
  return getAllBarberTrustProfiles().filter((profile) =>
    profile.barber.allStylesExecuted.includes(styleId)
  );
}
