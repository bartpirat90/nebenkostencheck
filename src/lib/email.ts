/**
 * Genau EINE Adresse, keine Listen (`,`/`;`), keine Anzeigenamen (`<>`),
 * keine Zeilenumbrüche (Header-Injection). Bewusst streng, weil der Server
 * sonst als Relay für beliebige Empfänger missbraucht werden könnte.
 */
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[A-Za-z]{2,}$/;
// Steuerzeichen (NUL, ESC, …) deckt `\s` nicht ab – separat ausschließen.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\x00-\x1f\x7f]/;
const MAX_LEN = 254;

export function isValidEmail(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return s.length > 0 && s.length <= MAX_LEN && !CONTROL_RE.test(s) && EMAIL_RE.test(s);
}
