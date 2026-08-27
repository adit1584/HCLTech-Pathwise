// Blocked disposable / throwaway email provider domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'sharklasers.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'trashmail.net',
  'dispostable.com',
  'getnada.com',
  'fakemailgenerator.com',
  'fakeinbox.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mohmal.com',
  'burnermail.io',
  'crazymailing.com',
  'tmail.ws',
  'mytemp.email',
]);

export interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
  normalizedEmail?: string;
}

export function validateRealEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email is required.' };
  }

  const clean = email.trim().toLowerCase();

  // Basic RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(clean)) {
    return { isValid: false, reason: 'Please enter a valid email address format (e.g. name@domain.com).' };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { isValid: false, reason: 'Invalid email address.' };
  }

  const [localPart, domain] = parts;

  if (localPart.length === 0 || localPart.length > 64) {
    return { isValid: false, reason: 'Email username must be between 1 and 64 characters.' };
  }

  if (domain.length < 3 || domain.length > 255) {
    return { isValid: false, reason: 'Email domain is invalid.' };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isValid: false, reason: 'Email domain must include a valid top-level domain (e.g. .com, .edu, .org).' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, reason: 'Top-level domain (.com, .org, etc.) is invalid.' };
  }

  // Check against disposable / temporary email lists
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      reason: 'Disposable or temporary email addresses are not permitted. Please use a permanent email address (e.g., Gmail, Outlook, University/Work email).',
    };
  }

  return { isValid: true, normalizedEmail: clean };
}
