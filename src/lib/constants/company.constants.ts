/**
 * Seller details printed on the invoice header.
 *
 * ⚠️ ADDRESS AND PHONE ARE PLACEHOLDERS — replace with the registered details
 * before sending invoices to real customers. An invoice carrying the wrong
 * business address is worse than one carrying none.
 *
 * No GSTIN here on purpose: Nervaya is not GST-registered, so the document is a
 * plain invoice with tax-inclusive prices. If that changes, add the GSTIN and
 * HSN codes and switch on the tax block in invoice-pdf.ts.
 */
export const COMPANY = {
  name: 'Nervaya',
  tagline: 'Sleep and mental wellness',
  addressLines: ['[Street address]', '[City, State PIN]', 'India'],
  email: 'support@nervaya.com',
  phone: '[Support phone]',
  website: 'nervaya.com',
} as const;

/** Prices already include everything owed, so the invoice says so explicitly. */
export const INVOICE_NOTE = 'All prices are inclusive. This is a computer-generated invoice and needs no signature.';

export const INVOICE_TERMS =
  'Thank you for choosing Nervaya. Questions? Reply to this message or email support@nervaya.com.';
