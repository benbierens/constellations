import sha256 from "crypto-js/sha256.js";
import { ethers } from "ethers";

export class CryptoService {
  constructor(constellationNode) {
    this.constellationNode = constellationNode;
  }

  sha256 = (input) => {
    const digest = sha256(input);
    return "" + digest;
  };

  sign = async (message) => {
    return await this.constellationNode.wallet.signMessage(message);
  };

  verifyGetSigner = async (message, signature) => {
    return await ethers.verifyMessage(message, signature);
  };
}
