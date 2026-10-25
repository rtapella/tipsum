/**
 * Utility functions for Checksum Tip Calculation.
 *
 * Checksum Rule:
 * For a total formatted with 2 decimal places (e.g. $46.11):
 * The last digit (single cent digit) must equal the ones-value
 * of the sum of the rest of the digits.
 * Example: 46.11 -> 4 + 6 + 1 = 11 -> 11 % 10 = 1 == last digit 1.
 */

export interface ChecksumResult {
  isValid: boolean;
  totalFormatted: string; // "46.11"
  digits: number[];
  prefixDigits: number[];
  lastDigit: number;
  sumOfPrefix: number;
  expectedLastDigit: number;
  formulaString: string;
}

/**
 * Validates whether a given dollar amount conforms to the checksum rule.
 */
export function checkChecksum(total: number | string): ChecksumResult {
  const num = typeof total === 'string' ? parseFloat(total) : total;
  if (isNaN(num) || num < 0) {
    return {
      isValid: false,
      totalFormatted: '0.00',
      digits: [0, 0, 0],
      prefixDigits: [0, 0],
      lastDigit: 0,
      sumOfPrefix: 0,
      expectedLastDigit: 0,
      formulaString: 'Invalid amount',
    };
  }

  // Format with standard 2 decimal places
  const totalFormatted = num.toFixed(2);
  // Extract all digit characters
  const digitChars = totalFormatted.replace(/\D/g, '').split('');

  if (digitChars.length < 2) {
    return {
      isValid: false,
      totalFormatted,
      digits: [0],
      prefixDigits: [],
      lastDigit: 0,
      sumOfPrefix: 0,
      expectedLastDigit: 0,
      formulaString: 'Amount too small',
    };
  }

  const digits = digitChars.map(d => parseInt(d, 10));
  const prefixDigits = digits.slice(0, -1);
  const lastDigit = digits[digits.length - 1];

  const sumOfPrefix = prefixDigits.reduce((acc, curr) => acc + curr, 0);
  const expectedLastDigit = sumOfPrefix % 10;
  const isValid = expectedLastDigit === lastDigit;

  const formulaString = `${prefixDigits.join(' + ')} = ${sumOfPrefix} → ones digit ${expectedLastDigit} ${
    isValid ? '==' : '≠'
  } last cent ${lastDigit}`;

  return {
    isValid,
    totalFormatted,
    digits,
    prefixDigits,
    lastDigit,
    sumOfPrefix,
    expectedLastDigit,
    formulaString,
  };
}

export interface TipTierResult {
  targetPercent: number;
  exactTargetTip: number;
  tipAmount: number;
  finalTotal: number;
  effectivePercent: number;
  centsOverExact: number;
  checksum: ChecksumResult;
}

export type TipMode = 'just-over' | 'closest' | 'just-under' | 'round-dollar';

/**
 * Finds a valid checksum total for a given bill base (subtotal + tax)
 * and target tip percentage (e.g. 15 for 15% on subtotal).
 *
 * @param subtotal - The pre-tax subtotal in dollars
 * @param billToPay - The total bill before tip (subtotal + tax) in dollars
 * @param targetPercent - Tip percentage, e.g. 15
 * @param mode - 'just-over' (default), 'closest', 'just-under', 'round-dollar'
 */
export function calculateChecksumTip(
  subtotal: number,
  billToPay: number,
  targetPercent: number,
  mode: TipMode = 'just-over'
): TipTierResult {
  const safeSubtotal = Math.max(0, subtotal);
  const safeBill = Math.max(0, billToPay);

  // Exact tip dollar amount according to target percentage of subtotal
  const exactTargetTip = (safeSubtotal * targetPercent) / 100;
  const targetTipCents = Math.round(exactTargetTip * 100);
  const billCents = Math.round(safeBill * 100);

  if (safeSubtotal === 0 && safeBill === 0) {
    const ck = checkChecksum(0);
    return {
      targetPercent,
      exactTargetTip: 0,
      tipAmount: 0,
      finalTotal: 0,
      effectivePercent: 0,
      centsOverExact: 0,
      checksum: ck,
    };
  }

  let chosenTipCents = targetTipCents;

  if (mode === 'round-dollar') {
    // Find nearest or next whole dollar total that satisfies checksum
    // A whole dollar total has cents = 00.
    // In cents, total is a multiple of 100.
    // e.g. 45.00 -> 4 + 5 + 0 = 9 -> expected last digit is 9 != 0.
    // Only certain whole dollar amounts satisfy checksum!
    // Let's search upward from the base total + targetTip
    const minCents = billCents + targetTipCents;
    let found = false;
    // Look up to 50 dollars above
    for (let c = Math.ceil(minCents / 100) * 100; c <= minCents + 5000; c += 100) {
      if (checkChecksum(c / 100).isValid) {
        chosenTipCents = c - billCents;
        found = true;
        break;
      }
    }
    if (!found) {
      // fallback to just-over
      chosenTipCents = findJustOver(billCents, targetTipCents);
    }
  } else if (mode === 'just-under') {
    // Scan downwards from targetTipCents
    let found = false;
    for (let t = targetTipCents; t >= 0; t--) {
      const candidateTotal = (billCents + t) / 100;
      if (checkChecksum(candidateTotal).isValid) {
        chosenTipCents = t;
        found = true;
        break;
      }
    }
    if (!found) {
      chosenTipCents = findJustOver(billCents, targetTipCents);
    }
  } else if (mode === 'closest') {
    // Search both directions to find smallest absolute difference in cents
    let bestTip = targetTipCents;
    let minDiff = Infinity;
    for (let delta = 0; delta <= 15; delta++) {
      // test +delta
      const tPlus = targetTipCents + delta;
      if (checkChecksum((billCents + tPlus) / 100).isValid) {
        bestTip = tPlus;
        minDiff = delta;
        break;
      }
      // test -delta
      if (delta > 0 && targetTipCents - delta >= 0) {
        const tMinus = targetTipCents - delta;
        if (checkChecksum((billCents + tMinus) / 100).isValid) {
          bestTip = tMinus;
          minDiff = delta;
          break;
        }
      }
    }
    chosenTipCents = bestTip;
  } else {
    // Default: 'just-over'
    // Start at Math.ceil(exactTargetTip * 100) and scan upwards
    const minCandidateTipCents = Math.ceil(exactTargetTip * 100);
    chosenTipCents = findJustOver(billCents, minCandidateTipCents);
  }

  const tipAmount = chosenTipCents / 100;
  const finalTotal = (billCents + chosenTipCents) / 100;
  const effectivePercent =
    safeSubtotal > 0 ? (tipAmount / safeSubtotal) * 100 : 0;
  const centsOverExact = chosenTipCents - targetTipCents;
  const checksum = checkChecksum(finalTotal);

  return {
    targetPercent,
    exactTargetTip,
    tipAmount,
    finalTotal,
    effectivePercent,
    centsOverExact,
    checksum,
  };
}

function findJustOver(billCents: number, minTipCents: number): number {
  // Always guaranteed within 10 cents
  for (let t = minTipCents; t < minTipCents + 20; t++) {
    const candidateTotal = (billCents + t) / 100;
    if (checkChecksum(candidateTotal).isValid) {
      return t;
    }
  }
  return minTipCents;
}

/**
 * Calculates all primary required tip tiers (10%, 15%, 20%, 25%)
 */
export function calculateAllStandardTiers(
  subtotal: number,
  billToPay: number,
  mode: TipMode = 'just-over'
): TipTierResult[] {
  const tiers = [10, 15, 20, 25];
  return tiers.map(pct => calculateChecksumTip(subtotal, billToPay, pct, mode));
}

/**
 * Format currency with dollar sign
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
