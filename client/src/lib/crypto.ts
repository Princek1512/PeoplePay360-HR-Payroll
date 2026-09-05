/**
 * Utility to encrypt sensitive credentials on the client side before sending over HTTP network payloads.
 * Prevents raw plaintext passwords from appearing in browser DevTools Network Inspect tabs.
 */
export function encryptPassword(password: string): string {
  if (!password) return password;
  const salt = 'PeoplePay360_Salt_';
  const salted = salt + password;
  let cipher = '';
  for (let i = 0; i < salted.length; i++) {
    cipher += String.fromCharCode(salted.charCodeAt(i) ^ 0x3f);
  }
  return 'ENC:' + btoa(encodeURIComponent(cipher));
}
