
export function isValidPhoneNumber(phone: string): boolean {
  if (phone.length === 0) return false;

  if (phone.startsWith('+7')) {
    return phone.length === 12;
  }

  if (phone.startsWith('8')) {
    return phone.length === 11;
  }

  return false;
}