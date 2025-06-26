// Validation utilities for spam protection

// Lista podejrzanych domen email
const SUSPICIOUS_EMAIL_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'throwaway.email',
  'temp-mail.org',
  'yopmail.com',
  'maildrop.cc',
  'test.com',
  'example.com',
  'fake.com',
  'spam.com'
];

// Lista fake imion
const FAKE_NAMES = [
  'test', 'asdf', 'qwerty', 'admin', 'user', 'fake', 'spam', 'bot',
  'aaa', 'bbb', 'ccc', 'xxx', 'yyy', 'zzz', '123', 'abc', 'def'
];

// Walidacja numeru telefonu
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Numer telefonu jest wymagany' };
  }

  // Usuń wszystkie spacje i znaki specjalne
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Sprawdź czy zawiera tylko cyfry i opcjonalnie +48
  const phoneRegex = /^(\+48)?[1-9]\d{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Nieprawidłowy format numeru telefonu' };
  }

  // Sprawdź czy nie składa się z powtarzających się cyfr
  const digits = cleanPhone.replace('+48', '');
  if (digits.length === 9) {
    // Sprawdź czy wszystkie cyfry są takie same
    if (new Set(digits).size === 1) {
      return { isValid: false, error: 'Numer telefonu nie może składać się z identycznych cyfr' };
    }
    
    // Sprawdź czy to sekwencja rosnąca (123456789)
    if (digits === '123456789' || digits === '987654321') {
      return { isValid: false, error: 'Numer telefonu wygląda na fałszywy' };
    }
    
    // Sprawdź czy nie ma zbyt wielu powtarzających się cyfr
    const digitCounts = {};
    for (let digit of digits) {
      digitCounts[digit] = (digitCounts[digit] || 0) + 1;
    }
    const maxRepeats = Math.max(...Object.values(digitCounts));
    if (maxRepeats > 6) {
      return { isValid: false, error: 'Numer telefonu zawiera zbyt wiele powtarzających się cyfr' };
    }
  }

  return { isValid: true, error: null };
};

// Walidacja adresu email
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Adres email jest wymagany' };
  }

  // Podstawowa walidacja regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Nieprawidłowy format adresu email' };
  }

  // Sprawdź czy email nie jest zbyt prosty
  const [localPart, domain] = email.split('@');
  
  if (localPart.length < 2) {
    return { isValid: false, error: 'Część lokalna adresu email jest zbyt krótka' };
  }

  // Sprawdź podejrzane domeny
  const domainLower = domain.toLowerCase();
  if (SUSPICIOUS_EMAIL_DOMAINS.includes(domainLower)) {
    return { isValid: false, error: 'Proszę użyć stałego adresu email' };
  }

  // Sprawdź czy nie jest zbyt prosty (test@test.pl, admin@admin.com)
  if (localPart.toLowerCase() === domain.split('.')[0].toLowerCase()) {
    return { isValid: false, error: 'Adres email wygląda na fałszywy' };
  }

  // Sprawdź czy lokalPart nie składa się tylko z cyfr lub prostych wzorców
  if (/^\d+$/.test(localPart) || FAKE_NAMES.includes(localPart.toLowerCase())) {
    return { isValid: false, error: 'Adres email wygląda na fałszywy' };
  }

  return { isValid: true, error: null };
};

// Walidacja imienia i nazwiska
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Imię i nazwisko są wymagane' };
  }

  const trimmedName = name.trim();
  
  // Sprawdź minimalną długość
  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Imię i nazwisko muszą mieć co najmniej 3 znaki' };
  }

  // Sprawdź czy zawiera tylko litery, spacje i myślniki
  const nameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Imię i nazwisko mogą zawierać tylko litery, spacje i myślniki' };
  }

  // Sprawdź czy nie składa się z fake imion
  const nameParts = trimmedName.toLowerCase().split(/\s+/);
  for (let part of nameParts) {
    if (FAKE_NAMES.includes(part)) {
      return { isValid: false, error: 'Proszę podać prawdziwe imię i nazwisko' };
    }
  }

  // Sprawdź czy ma co najmniej 2 części (imię i nazwisko)
  if (nameParts.length < 2) {
    return { isValid: false, error: 'Proszę podać imię i nazwisko' };
  }

  // Sprawdź czy każda część ma co najmniej 2 znaki
  for (let part of nameParts) {
    if (part.length < 2) {
      return { isValid: false, error: 'Każda część imienia i nazwiska musi mieć co najmniej 2 znaki' };
    }
  }

  return { isValid: true, error: null };
};

// Walidacja adresu
export const validateAddress = (address) => {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Adres jest wymagany' };
  }

  const trimmedAddress = address.trim();
  
  // Sprawdź minimalną długość
  if (trimmedAddress.length < 5) {
    return { isValid: false, error: 'Adres musi mieć co najmniej 5 znaków' };
  }

  // Sprawdź czy zawiera cyfry (numer domu)
  if (!/\d/.test(trimmedAddress)) {
    return { isValid: false, error: 'Adres musi zawierać numer domu' };
  }

  // Sprawdź czy nie składa się tylko z cyfr
  if (/^\d+$/.test(trimmedAddress)) {
    return { isValid: false, error: 'Adres nie może składać się tylko z cyfr' };
  }

  // Sprawdź czy nie zawiera podejrzanych wzorców
  const suspiciousPatterns = ['test', 'fake', 'spam', 'asdf', 'qwerty'];
  const addressLower = trimmedAddress.toLowerCase();
  for (let pattern of suspiciousPatterns) {
    if (addressLower.includes(pattern)) {
      return { isValid: false, error: 'Proszę podać prawdziwy adres' };
    }
  }

  return { isValid: true, error: null };
};

// Sprawdzenie czy formularz został wypełniony zbyt szybko (bot)
export const checkFormTiming = (startTime) => {
  const currentTime = Date.now();
  const timeDiff = currentTime - startTime;
  const minTime = 10000; // 10 sekund minimum
  
  if (timeDiff < minTime) {
    return { isValid: false, error: 'Formularz został wypełniony zbyt szybko. Proszę spróbować ponownie.' };
  }
  
  return { isValid: true, error: null };
};

// Sprawdzenie rate limiting
export const checkRateLimit = () => {
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem('formAttempts') || '[]');
  
  // Usuń stare próby (starsze niż 5 minut)
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const recentAttempts = attempts.filter(time => time > fiveMinutesAgo);
  
  if (recentAttempts.length >= 3) {
    return { isValid: false, error: 'Zbyt wiele prób wysłania formularza. Proszę spróbować za 5 minut.' };
  }
  
  // Dodaj obecną próbę
  recentAttempts.push(now);
  localStorage.setItem('formAttempts', JSON.stringify(recentAttempts));
  
  return { isValid: true, error: null };
};

// Główna funkcja walidacji formularza
export const validateForm = (formData, startTime) => {
  const errors = {};
  
  // Walidacja rate limiting
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.isValid) {
    return { isValid: false, errors: { general: rateLimitCheck.error } };
  }
  
  // Walidacja czasu wypełniania
  const timingCheck = checkFormTiming(startTime);
  if (!timingCheck.isValid) {
    return { isValid: false, errors: { general: timingCheck.error } };
  }
  
  // Sprawdź honeypot (jeśli jest wypełniony, to bot)
  if (formData.honeypot && formData.honeypot.trim() !== '') {
    return { isValid: false, errors: { general: 'Wykryto podejrzaną aktywność' } };
  }
  
  // Walidacja poszczególnych pól
  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  const phoneValidation = validatePhoneNumber(formData.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.error;
  }
  
  const addressValidation = validateAddress(formData.address);
  if (!addressValidation.isValid) {
    errors.address = addressValidation.error;
  }
  
  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
};
