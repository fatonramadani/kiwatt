import type { Data } from "swissqrbill/types";

export interface QRBillData {
  // Creditor (organization)
  creditorName: string;
  creditorAddress: string;
  creditorZip: string;
  creditorCity: string;
  creditorCountry?: string;
  iban: string;
  // Debtor (member)
  debtorName: string;
  debtorAddress?: string;
  debtorZip?: string;
  debtorCity?: string;
  debtorCountry?: string;
  // Payment
  amount: number;
  currency?: "CHF" | "EUR";
  // Reference
  reference?: string;
  message?: string;
}

/**
 * Generate QR-bill data object for swissqrbill
 */
export function createQRBillData(data: QRBillData): Data {
  const qrData: Data = {
    currency: data.currency ?? "CHF",
    amount: data.amount,
    creditor: {
      name: data.creditorName,
      address: data.creditorAddress,
      zip: parseInt(data.creditorZip) || 0,
      city: data.creditorCity,
      country: data.creditorCountry ?? "CH",
      account: data.iban,
    },
    debtor: {
      name: data.debtorName,
      address: data.debtorAddress ?? "",
      zip: data.debtorZip ? parseInt(data.debtorZip) || 0 : 0,
      city: data.debtorCity ?? "",
      country: data.debtorCountry ?? "CH",
    },
  };

  // Add reference if provided (QRR reference)
  if (data.reference) {
    qrData.reference = data.reference;
  }

  // Add message if provided
  if (data.message) {
    qrData.message = data.message;
  }

  return qrData;
}

/**
 * Generate a QR reference number from invoice number
 * Swiss QR reference must be 27 characters, numeric only
 */
export function generateQRReference(invoiceNumber: string): string {
  // Remove non-numeric characters and pad/truncate to 26 chars
  const numeric = invoiceNumber.replace(/\D/g, "");
  const padded = numeric.padStart(26, "0").slice(-26);

  // Calculate check digit using modulo 10 recursive
  const checkDigit = calculateMod10Recursive(padded);

  return padded + checkDigit;
}

/**
 * Calculate modulo 10 recursive check digit
 * Used for Swiss reference numbers
 */
function calculateMod10Recursive(value: string): string {
  const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
  let carry = 0;

  for (const char of value) {
    const digit = parseInt(char, 10);
    carry = table[(carry + digit) % 10] ?? 0;
  }

  return ((10 - carry) % 10).toString();
}

/**
 * Validate Swiss IBAN format
 */
export function isValidSwissIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  return /^CH\d{2}\d{5}[A-Z0-9]{12}$/.test(cleaned);
}

/**
 * Check if IBAN is a QR-IBAN (required for QRR references)
 * QR-IBANs have an IID (Institution ID) in range 30000-31999
 */
export function isQrIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (!cleaned.startsWith("CH") || cleaned.length !== 21) {
    return false;
  }
  // Extract IID (positions 4-8, 0-indexed after CH and 2 check digits)
  const iid = parseInt(cleaned.substring(4, 9), 10);
  return iid >= 30000 && iid <= 31999;
}

/**
 * Format IBAN with spaces for display
 */
export function formatIBAN(iban: string): string {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(" ") ?? cleaned;
}
