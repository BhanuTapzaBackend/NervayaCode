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
  addressLines: ['47 Anuragha Township', 'K R Pura, Kadugodi', 'Bengaluru, Karnataka 560067', 'India'],
  email: 'nervayaofficial@gmail.com',
  phone: '+91 82921 97371',
  website: 'nervaya.com',
} as const;

/** Sign-off under the totals, where Zoho puts "Thanks for your business." */
export const INVOICE_THANK_YOU = 'Thank you for doing business with us.';

/** Prices already include everything owed, so the invoice says so explicitly. */
export const INVOICE_NOTE = 'All prices are inclusive. This is a computer-generated invoice and needs no signature.';

export const INVOICE_TERMS =
  'Thank you for choosing Nervaya. Questions? Reply to this message or email nervayaofficial@gmail.com.';
