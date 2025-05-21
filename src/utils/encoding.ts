import { CHAR_SETS } from './constants';

/**
 * Encoding utilities for various formats
 */

/**
 * Convert a buffer to a hexadecimal string
 * @param buffer - The buffer to convert
 * @returns Hexadecimal string representation
 */
export function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hexadecimal string to a buffer
 * @param hex - The hexadecimal string to convert
 * @returns Uint8Array representation
 */
export function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  
  return bytes;
}

/**
 * Convert a buffer to a Base64 string
 * @param buffer - The buffer to convert
 * @returns Base64 string representation
 */
export function bufferToBase64(buffer: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return Buffer.from(buffer).toString('base64');
  } else if (typeof btoa === 'function') {
    // Browser environment
    const binary = Array.from(buffer)
      .map(b => String.fromCharCode(b))
      .join('');
    return btoa(binary);
  } else {
    // Fallback implementation
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;
    let i = 0;
    
    while (i < len) {
      const b1 = bytes[i++];
      const b2 = i < len ? bytes[i++] : 0;
      const b3 = i < len ? bytes[i++] : 0;
      
      const triplet = (b1 << 16) | (b2 << 8) | b3;
      
      result += CHARS[(triplet >> 18) & 0x3F];
      result += CHARS[(triplet >> 12) & 0x3F];
      result += i > len - 2 ? '=' : CHARS[(triplet >> 6) & 0x3F];
      result += i > len - 1 ? '=' : CHARS[triplet & 0x3F];
    }
    
    return result;
  }
}

/**
 * Convert a Base64 string to a buffer
 * @param base64 - The Base64 string to convert
 * @returns Uint8Array representation
 */
export function base64ToBuffer(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    // Node.js environment
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else if (typeof atob === 'function') {
    // Browser environment
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    // Fallback implementation
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    // Remove padding if present
    const str = base64.replace(/=+$/, '');
    const bytesLength = Math.floor(str.length * 3 / 4);
    const bytes = new Uint8Array(bytesLength);
    
    let p = 0;
    for (let i = 0; i < str.length; i += 4) {
      const c1 = CHARS.indexOf(str[i]);
      const c2 = CHARS.indexOf(str[i + 1]);
      const c3 = i + 2 < str.length ? CHARS.indexOf(str[i + 2]) : 64;
      const c4 = i + 3 < str.length ? CHARS.indexOf(str[i + 3]) : 64;
      
      bytes[p++] = (c1 << 2) | (c2 >> 4);
      if (c3 < 64) bytes[p++] = ((c2 & 15) << 4) | (c3 >> 2);
      if (c4 < 64) bytes[p++] = ((c3 & 3) << 6) | c4;
    }
    
    return bytes;
  }
}

/**
 * Convert a buffer to a Base58 string (Bitcoin style)
 * @param buffer - The buffer to convert
 * @returns Base58 string representation
 */
export function bufferToBase58(buffer: Uint8Array): string {
  const ALPHABET = CHAR_SETS.BASE58;
  
  // Count leading zeros
  let zeros = 0;
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0) {
      zeros++;
    } else {
      break;
    }
  }
  
  // Convert to base58
  const input = Array.from(buffer);
  let output = '';
  
  for (let i = zeros; i < input.length; i++) {
    let carry = input[i];
    let j = 0;
    
    // Apply "b58 = b58 * 256 + ch"
    for (let k = output.length - 1; k >= 0 || carry > 0; k--) {
      if (k < 0) {
        output = ALPHABET[0] + output;
        k = 0;
      }
      
      let x = ALPHABET.indexOf(output[k]) * 256 + carry;
      output = output.substring(0, k) + ALPHABET[x % 58] + output.substring(k + 1);
      carry = Math.floor(x / 58);
    }
  }
  
  // Add leading '1's for each leading zero byte
  for (let i = 0; i < zeros; i++) {
    output = ALPHABET[0] + output;
  }
  
  return output;
}

/**
 * Convert a Base58 string to a buffer
 * @param base58 - The Base58 string to convert
 * @returns Uint8Array representation
 */
export function base58ToBuffer(base58: string): Uint8Array {
  const ALPHABET = CHAR_SETS.BASE58;
  
  if (!base58) {
    return new Uint8Array(0);
  }
  
  // Count leading '1's
  let zeros = 0;
  for (let i = 0; i < base58.length; i++) {
    if (base58[i] === ALPHABET[0]) {
      zeros++;
    } else {
      break;
    }
  }
  
  // Convert from base58 to base256
  const input = Array.from(base58);
  const output = new Uint8Array(base58.length * 2); // Over-allocate for safety
  let outputLen = 0;
  
  for (let i = zeros; i < input.length; i++) {
    const c = ALPHABET.indexOf(input[i]);
    if (c < 0) {
      throw new Error(`Invalid Base58 character: ${input[i]}`);
    }
    
    let carry = c;
    for (let j = 0; j < outputLen; j++) {
      carry += output[j] * 58;
      output[j] = carry & 0xff;
      carry >>= 8;
    }
    
    while (carry > 0) {
      output[outputLen++] = carry & 0xff;
      carry >>= 8;
    }
  }
  
  // Add leading zeros
  for (let i = 0; i < zeros; i++) {
    output[outputLen++] = 0;
  }
  
  // Reverse the array
  const result = new Uint8Array(outputLen);
  for (let i = 0; i < outputLen; i++) {
    result[i] = output[outputLen - 1 - i];
  }
  
  return result;
}

/**
 * Convert a buffer to a Base32 string (RFC 4648)
 * @param buffer - The buffer to convert
 * @returns Base32 string representation
 */
export function bufferToBase32(buffer: Uint8Array): string {
  const ALPHABET = CHAR_SETS.BASE32;
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      result += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += ALPHABET[(value << (5 - bits)) & 31];
  }
  
  // Add padding
  while (result.length % 8 !== 0) {
    result += '=';
  }
  
  return result;
}

/**
 * Convert a Base32 string to a buffer
 * @param base32 - The Base32 string to convert
 * @returns Uint8Array representation
 */
export function base32ToBuffer(base32: string): Uint8Array {
  const ALPHABET = CHAR_SETS.BASE32;
  
  // Remove padding and convert to uppercase
  const str = base32.toUpperCase().replace(/=+$/, '');
  
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.ceil(str.length * 5 / 8));
  
  for (let i = 0; i < str.length; i++) {
    const c = ALPHABET.indexOf(str[i]);
    if (c < 0) {
      throw new Error(`Invalid Base32 character: ${str[i]}`);
    }
    
    value = (value << 5) | c;
    bits += 5;
    
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  
  return output.slice(0, index);
}
