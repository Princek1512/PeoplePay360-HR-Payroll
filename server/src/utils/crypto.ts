/**
 * Utility to decrypt encrypted password payloads received from the client.
 */
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword) return encryptedPassword;
  if (!encryptedPassword.startsWith('ENC:')) {
    return encryptedPassword; // Fallback for raw passwords (e.g. automated tests or direct API calls)
  }
  try {
    const rawCipher = decodeURIComponent(atob(encryptedPassword.slice(4)));
    let salted = '';
    for (let i = 0; i < rawCipher.length; i++) {
      salted += String.fromCharCode(rawCipher.charCodeAt(i) ^ 0x3f);
    }
    const salt = 'PeoplePay360_Salt_';
    if (salted.startsWith(salt)) {
      return salted.slice(salt.length);
    }
    return salted;
  } catch {
    return encryptedPassword;
  }
}
