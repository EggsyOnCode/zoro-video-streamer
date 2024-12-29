import { randomBytes, scryptSync } from 'crypto';

const encryptPassword = (password: string, salt: string): string => {
  return scryptSync(password, salt, 32).toString('hex');
};

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex'); // Generate a random salt
  return encryptPassword(password, salt) + salt; // Return hash and salt concatenated
};

export const matchPassword = (password: string, hash: string): boolean => {
  const salt = hash.slice(64); // Extract the salt
  const originalPassHash = hash.slice(0, 64); // Extract the original hash
  const currentPassHash = encryptPassword(password, salt); // Hash the provided password with the extracted salt
  return originalPassHash === currentPassHash; // Compare the hashes
};
