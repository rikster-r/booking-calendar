export const formatPhone = (value: string): string => {
  const cleaned = ('' + value).replace(/\D/g, '');

  if (!cleaned) {
    return '+7';
  }

  let formatted = '';
  let digits = cleaned;

  if (digits.startsWith('8')) {
    formatted += '+7 ';
    digits = digits.slice(1);
  } else if (digits.startsWith('7')) {
    formatted += '+7 ';
    digits = digits.slice(1);
  } else if (digits.length > 0 && !value.startsWith('+7')) {
    formatted += '+7 ';
  } else if (value === '+7 ') {
    return ''; // If only '+7 ' remains, clear it
  }

  const areaCode = digits.slice(0, 3);
  const firstPart = digits.slice(3, 6);
  const secondPart = digits.slice(6, 8);
  const thirdPart = digits.slice(8, 10);

  if (areaCode) {
    formatted += areaCode;
    if (firstPart || secondPart || thirdPart) {
      formatted += ' ';
    }
  }
  if (firstPart) {
    formatted += firstPart;
    if (secondPart || thirdPart) {
      formatted += '-';
    }
  }
  if (secondPart) {
    formatted += secondPart;
    if (thirdPart) {
      formatted += '-';
    }
  }
  if (thirdPart) {
    formatted += thirdPart;
  }

  return formatted;
};

export const unformatPhone = (formatted: string): string => {
  // Keep only digits, but preserve the + at the start
  const cleaned = formatted.replace(/[^\d]/g, '');
  return '+7' + cleaned.slice(1); // Make sure it starts with +7
};
