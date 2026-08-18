/**
 * formSecurity.js
 *
 * Defence-in-depth security for the Professionals registration form.
 * This runs CLIENT-SIDE as a first gate. It does NOT replace:
 *   - Supabase Row Level Security (RLS) policies
 *   - Supabase Auth rate limiting
 *   - Server-side input validation
 *
 * Attack surfaces covered:
 *   1. XSS via stored/reflected script injection
 *   2. SQL injection via special characters
 *   3. Path traversal in file names
 *   4. MIME-type spoofing / polyglot file uploads
 *   5. Prototype pollution via crafted input keys
 *   6. Open redirect via javascript: / data: URLs
 *   7. Submission flooding (client-side sliding window rate limit)
 *   8. Oversized payloads crashing the backend
 *   9. Enumeration attacks leaking whether an email exists
 */

// ─── 1. SANITIZATION ──────────────────────────────────────────
//
// React already escapes JSX output, so stored XSS is largely
// prevented at render time. The risk here is data that gets:
//   a) stored in Supabase and later rendered outside React
//   b) passed to a third-party integration (email, PDF, CRM)
//   c) injected into a dynamic SQL query if RLS ever lapses
//
// We strip at the input layer so nothing dirty enters the DB.

/**
 * General text — strips HTML, SQL injection chars, control bytes,
 * null bytes, and anything outside printable ASCII + Latin Extended.
 * Safe for: name, business, specialty, service area.
 */
export function sanitizeText(value, { maxLength = 200 } = {}) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')                    // strip HTML/SVG tags
    .replace(/&[a-z]+;|&#\d+;|&#x[\da-f]+;/gi, '') // strip HTML entities
    .replace(/['"`;\\]/g, '')                   // strip SQL metacharacters
    .replace(/--/g, '')                         // strip SQL comment sequences
    .replace(/\/\*/g, '')                       // strip SQL block comment open
    .replace(/[\x00-\x1F\x7F]/g, '')           // strip control + null bytes
    .replace(/[^\x20-\x7E\u00C0-\u024F]/g, '') // allow printable ASCII + Latin Extended only
    .replace(/\s{2,}/g, ' ')                    // collapse whitespace
    .trim()
    .slice(0, maxLength);
}

/**
 * Email — RFC 5321 whitelist only. Nothing else enters.
 * Lowercased to prevent duplicate accounts via case variation.
 */
export function sanitizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^a-zA-Z0-9._%+\-@]/g, '') // strict whitelist
    .trim()
    .toLowerCase()
    .slice(0, 254); // RFC 5321 max
}

/**
 * Phone — digits and formatting only.
 * Strips everything that could be used for injection.
 */
export function sanitizePhone(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^0-9()\-\s+]/g, '')
    .trim()
    .slice(0, 20);
}

/**
 * URL — enforces https:// scheme, blocks javascript: and data: URIs
 * which are the two primary open-redirect / XSS vectors via URLs.
 */
export function sanitizeUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, 2048);
  if (!trimmed) return '';
  // Block dangerous schemes at the character level before any parse
  if (/^\s*(javascript|data|vbscript|file|blob)\s*:/i.test(trimmed)) return '';
  // Only allow http / https
  if (!/^https?:\/\//i.test(trimmed)) return '';
  // Strip any embedded newlines (header injection vector)
  return trimmed.replace(/[\r\n]/g, '');
}

/**
 * Notes — preserves newlines for readability but still strips
 * HTML, dangerous entities, and SQL injection chars.
 */
export function sanitizeNotes(value, { maxLength = 1000 } = {}) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;|&#\d+;|&#x[\da-f]+;/gi, '')
    .replace(/['"`;\\]/g, '')
    .replace(/--/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // keep \n \r \t, strip rest
    .trim()
    .slice(0, maxLength);
}

/**
 * File name — prevents path traversal attacks.
 * A filename like "../../etc/passwd.pdf" could escape the storage
 * bucket prefix if not cleaned before being used in a path.
 */
export function sanitizeFileName(name) {
  if (typeof name !== 'string') return 'upload';
  return name
    .replace(/[^a-zA-Z0-9._\-]/g, '_') // whitelist safe chars
    .replace(/\.{2,}/g, '.')            // collapse .. (path traversal)
    .replace(/^[./]+/, '')              // strip leading dots/slashes
    .slice(0, 100);
}


// ─── 2. VALIDATION ────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^\(\d{3}\)\s\d{3}-\d{4}$/;
// Name: letters, accents, hyphen, apostrophe, spaces — 2 to 80 chars
const NAME_RE  = /^[a-zA-Z\u00C0-\u024F'\- ]{2,80}$/;
// Profession values must be from the known whitelist — prevents injection
// via crafted checkbox values if the DOM is tampered with
const ALLOWED_PROFESSIONS = new Set([
  'General Contractor',
  'Hardwood Flooring',
  'Plumbing',
  'Bathroom Remodel',
  'Electrician',
  'Other Trade',
]);

export function validateForm({ name, email, phone, password, confirmPassword, selectedProfs, website }) {
  if (!NAME_RE.test(name))
    return { valid: false, field: 'name', message: 'Name may only contain letters, spaces, hyphens, and apostrophes (2–80 characters).' };

  if (!EMAIL_RE.test(email))
    return { valid: false, field: 'email', message: 'Please enter a valid email address.' };

  if (phone && !PHONE_RE.test(phone))
    return { valid: false, field: 'phone', message: 'Phone must be in (555) 000-0000 format.' };

  // Password rules — matches what Supabase enforces so errors are consistent
  if (password.length < 8)
    return { valid: false, field: 'password', message: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password))
    return { valid: false, field: 'password', message: 'Password must contain at least one uppercase letter.' };
  if (!/[0-9]/.test(password))
    return { valid: false, field: 'password', message: 'Password must contain at least one number.' };
  if (password !== confirmPassword)
    return { valid: false, field: 'confirmPassword', message: 'Passwords do not match.' };

  // Whitelist-validate profession values — rejects anything injected via DevTools
  if (!selectedProfs || selectedProfs.length === 0)
    return { valid: false, field: 'profession', message: 'Please select at least one profession.' };
  for (const p of selectedProfs) {
    if (!ALLOWED_PROFESSIONS.has(p))
      return { valid: false, field: 'profession', message: 'Invalid profession value detected.' };
  }

  if (website && !/^https?:\/\//i.test(website))
    return { valid: false, field: 'website', message: 'Website must start with https://' };

  return { valid: true };
}


// ─── 3. CLIENT-SIDE RATE LIMITING ─────────────────────────────
//
// Supabase rate-limits auth.signUp server-side, but each attempt
// still triggers a network round-trip and a Supabase Auth write.
// This client-side gate stops obvious flooding before it reaches
// the network at all.
//
// Uses a sliding window stored in sessionStorage (survives refresh,
// clears when the tab closes — intentional: legitimate users can
// retry in a new session without being permanently blocked).

const RATE_KEY     = 'smdf_pro_attempts';
const MAX_ATTEMPTS = 5;
const WINDOW_MS    = 15 * 1000; // 15 minutes

function getAttempts() {
  try {
    return JSON.parse(sessionStorage.getItem(RATE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAttempts(list) {
  try {
    sessionStorage.setItem(RATE_KEY, JSON.stringify(list));
  } catch { /* storage unavailable — fail open, Supabase server limit still applies */ }
}

/**
 * Call before every submission.
 * Records the attempt timestamp and returns whether it is allowed.
 */
export function checkRateLimit() {
  const now      = Date.now();
  const attempts = getAttempts().filter(ts => now - ts < WINDOW_MS); // evict expired

  if (attempts.length >= MAX_ATTEMPTS) {
    const oldest      = Math.min(...attempts);
    const retryAfterMs = WINDOW_MS - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  attempts.push(now);
  saveAttempts(attempts);
  return { allowed: true };
}

export function formatRetryTime(ms) {
  const minutes = Math.ceil(ms / 60000);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}


// ─── 4. FILE SECURITY ─────────────────────────────────────────
//
// Two attack vectors:
//   a) Oversized files → backend / storage quota exhaustion
//   b) MIME-type spoofing → malicious file disguised as PDF/image
//      (a .exe or .html renamed to .pdf passes a MIME check alone)
//
// Defence: check both the declared MIME type AND the magic bytes
// (first 8 bytes of the file's binary content).

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_WHITELIST = {
  resume:      ['application/pdf', 'application/msword',
                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  certificate: ['application/pdf', 'image/jpeg'],
  insurance:   ['application/pdf', 'image/jpeg'],
};

/**
 * Magic-byte signatures for allowed file types.
 * Index 0 = hex prefix that must appear at byte offset 0.
 */
const MAGIC = [
  { sig: '25504446', label: 'PDF'  },  // %PDF
  { sig: 'ffd8ff',   label: 'JPEG' },  // JPEG SOI
  { sig: '504b0304', label: 'DOCX' },  // ZIP (Office Open XML)
  { sig: 'd0cf11e0', label: 'DOC'  },  // OLE Compound (legacy Word)
];

export function validateFile(file, type = 'resume') {
  if (!file) return { valid: true }; // optional fields

  if (file.size === 0)
    return { valid: false, message: `${file.name} is empty.` };

  if (file.size > MAX_FILE_BYTES)
    return { valid: false, message: `${file.name} exceeds the 10 MB limit.` };

  const allowed = MIME_WHITELIST[type] || MIME_WHITELIST.resume;
  if (!allowed.includes(file.type))
    return { valid: false, message: `${file.name} is not an accepted file type.` };

  return { valid: true };
}

/**
 * Reads the first 8 bytes of the file and checks for a known
 * magic-byte signature. Rejects files whose actual content does
 * not match any allowed type regardless of their MIME or extension.
 *
 * This catches the most common polyglot / renamed-file attack:
 *   mv malware.exe resume.pdf
 */
export async function verifyFileMagic(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target.result);
      const hex   = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const ok    = MAGIC.some(({ sig }) => hex.startsWith(sig));
      resolve(ok);
    };
    reader.onerror = () => resolve(false); // deny on read error
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
}


// ─── 5. ENUMERATION PROTECTION ────────────────────────────────
//
// Supabase auth.signUp returns a specific error when an email is
// already registered. If we surface that message verbatim, an
// attacker can enumerate whether any email has an account by
// watching error responses.
//
// normalizeAuthError maps all auth errors to a single generic
// message so no account existence information leaks.

export function normalizeAuthError(authError) {
  if (!authError) return null;
  const msg = authError.message?.toLowerCase() ?? '';
  console.log(msg);

  // Enumeration risk: "user already exists" / "email already registered"
  if (
    msg.includes('already registered') ||
    msg.includes('user already exists') ||
    msg.includes('email already') ||
    msg.includes('already in use')
  ) {
    // Return the same message we'd show for any other error
    // so attackers can't distinguish "email taken" from "invalid email"
    return 'Unable to sign in. Please check your details and try again.';
  }

  // Generic fallback — never expose raw Supabase error text to the UI
  return 'Unable to sign in. Please check your details and try again.';
}