function generateStarId(core, starInfoPrototype) {
  const json = JSON.stringify(starInfoPrototype);
  return "s" + core.cryptoService.sha256(json);
}

export class StarInfo {
  constructor(core, type, owners, creationUtc) {
    this.type = type;
    this.owners = owners;
    this.creationUtc = creationUtc;

    const prototype = {
      type: type,
      owners: owners,
      creationUtc: creationUtc,
    };

    this.starId = generateStarId(core, prototype);
  }

  canModify = (address) => {
    if (this.owners.length < 1) return true;
    return this.owners.includes(address);
  };
}
