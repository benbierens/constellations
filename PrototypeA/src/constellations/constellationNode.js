import { Wallet } from "ethers";

export class ConstellationNode {
  constructor(privateKey) {
    this.privateKey = privateKey;
    this.wallet = new Wallet(privateKey);
    this.address = this.wallet.address;
  }
}
