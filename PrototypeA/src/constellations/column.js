export class Column {
    constructor(core, header, permissionChecker) {
        this._core = core;
        this._logger = core.logger.prefix("Column:"+header);

        this._header = header;
        this._checker = permissionChecker;

        this._value = null;
        this._utc = null;
        this._signature = null;
        this._signer = null;
    }

    get value() {
        return this._value;
    }

    get utc() {
        return this._utc;
    }

    get signer () {
        return this._signer;
    }

    processPacket = async(packet) => {
        if (packet.header != this._header) return false;

        const hash = this._core.cryptoService.sha256(
            JSON.stringify(packet.signedData)
        );

        const signer = await this._core.cryptoService.verifyGetSigner(
            hash,
            packet.signature
        );

        // even if signer is unchanged, still check:
        // permissions may have changed!
        if (!this._checker(signer)) {
            this._logger.trace("processPacket: Rejected by permission checker.");
            return true;
        }

        if (this._utc && packet.signedData.utc <= this._utc) {
            this._logger.trace("processPacket: Rejected, not newer than current. ")
            return true;
        }

        this._logger.trace("processPacket: Update accepted.");
        this._value = packet.signedData.payload;
        this._utc = packet.signedData.utc;
        this._signature = packet.signature;
        this._signer = signer;
        return true;
    }

    getAsPacket = async () => {
        return {
            header: this._header,
            signature: this._signature,
            signedData: {
                utc: this._utc,
                payload: this._value
            }
        };
    }
}
