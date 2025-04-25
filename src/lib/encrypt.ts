import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc'; // Encryption algorithm
const SECRET_KEY = process.env.AVITO_ACCESS_TOKEN_SECRET as string;
const IV_LENGTH = 16; // Initialization vector length for aes-256-cbc

// Create a 32-byte key from the provided secret key using sha256
function getKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

// Encrypt function
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
  const key = getKey(SECRET_KEY); // Hash the secret key to 32 bytes
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Return IV + encrypted text
}

// Decrypt function
export function decrypt(text: string): string {
  const textParts = text.split(':'); // Split the IV and encrypted text
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = textParts[1];
  const key = getKey(SECRET_KEY); // Hash the secret key to 32 bytes
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
