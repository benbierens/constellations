import sha256 from 'crypto-js/sha256.js';

export class CryptoService {
  sha256 = (input) => {
    const digest = sha256(input);
    return "" + digest;
  };
}
