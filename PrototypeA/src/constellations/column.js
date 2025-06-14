export const ColumnUpdateCheckResponse = {
  Unknown: "unknown",
  Discard: "discard",   // The update should be discarded.
  Delay: "delay",       // The update may be applied later.
  Accept: "accept"      // The update should be applied immediately.
};

const exampleHandler = {
    checkUpdate: async (signer, newValue) => { return ColumnUpdateCheckResponse.Unknown; },
    onValueChanged: async () => { }
};

export class Column {
    constructor(core, header, handler) {
        this._core = core;
        this._logger = core.logger.prefix("Column:"+header);

        this._header = header;
        this._handler = handler;

        this._isReady = false;
        this._hash = null;
        this._value = null;
        this._utc = null;
        this._signature = null;
        this._signer = null;
        this._delayedPacketAndHashAndSigner = null;
    }

    get isReady() {
        return this._isReady;
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

    processPacket = async (packet) => {
        if (!this._handler) this._logger.errorAndThrow("processPacket: handler not set.");
        if (packet.header != this._header) return false;

        if (!packet.header) this._logger.errorAndThrow("processPacket: packet has no header.");
        if (!packet.signedData) this._logger.errorAndThrow("processPacket: packet has no signedData.");
        if (!packet.signature) this._logger.errorAndThrow("processPacket: packet has no signature.");

        const hash = this._core.cryptoService.sha256(
            JSON.stringify(packet.signedData)
        );

        const signer = await this._core.cryptoService.verifyGetSigner(
            hash,
            packet.signature
        );

        await this._processPacket(packet, hash, signer);
        return true;
    }

    applyDelayedUpdate = async () => {
        if (!this._delayedPacketAndHashAndSigner) {
            this.logger.trace("applyDelayedUpdate: No delayed packet was set.");
            return;
        }

        await this._processPacket(
            this._delayedPacketAndHashAndSigner.packet,
            this._delayedPacketAndHashAndSigner.hash,
            this._delayedPacketAndHashAndSigner.signer
        )
        
        this._delayedPacketAndHashAndSigner = null;
    }

    getAsPacket = async () => {
        if (!this._signature) this._logger.errorAndThrow("getAsPacket: signature not set.");
        if (!this._utc) this._logger.errorAndThrow("getAsPacket: utc not set.");
        if (!this._value) this._logger.errorAndThrow("getAsPacket: value not set.");

        return {
            header: this._header,
            signature: this._signature,
            signedData: {
                utc: this._utc,
                payload: this._value
            }
        };
    }

    _processPacket = async (packet, hash, signer) => {
        if (this._hash && this._hash == hash) {
            this._logger.trace("_processPacket: Ignored, hash unchanged.");
            return;
        }

        if (this._utc && packet.signedData.utc <= this._utc) {
            this._logger.trace("_processPacket: Rejected, not newer than current.")
            return;
        }

        // even if signer/signature is unchanged, still ask the handler to check:
        // permissions may have changed!
        const checkResponse = await this._handler.checkUpdate(signer, packet.signedData.payload);
        if (!checkResponse || checkResponse == ColumnUpdateCheckResponse.Unknown) {
            this._logger.errorAndThrow("_processPacket: Invalid response from columnHandler.checkUpdate.");
        }
        if (checkResponse == ColumnUpdateCheckResponse.Discard) {
            this._logger.trace("_processPacket: Rejected by columnHandler.checkUpdate.");
            return;
        }
        if (checkResponse == ColumnUpdateCheckResponse.Delay) {
            this._logger.trace("_processPacket: Delayed by columnHandler.");
            this._updateDelayedPacket(packet, hash, signer);
            return;
        }
        if (checkResponse != ColumnUpdateCheckResponse.Accept) {
            this._logger.assert(`_processPacket: Unknown CheckResponse received from handler: '${checkResponse}'`);
        }

        await this._applyUpdate(packet, hash, signer);
    }

    _applyUpdate = async (packet, hash, signer) => {
        this._logger.trace("_applyUpdate: Update accepted.");
        this._hash = hash;
        this._value = packet.signedData.payload;
        this._utc = packet.signedData.utc;
        this._signature = packet.signature;
        this._signer = signer;
        this._isReady = true;

        await this._handler.onValueChanged();
    }

    _updateDelayedPacket = (packet, hash, signer) => {
        if (
            // No delayed packet was previously set,
            !this._delayedPacketAndHashAndSigner || 
            // Or, the previous delayed packet is older than this one.
            packet.signedData.utc > this._delayedPacketAndHashAndSigner.packet.signedData.utc
        ) {
            this._delayedPacketAndHashAndSigner = {
                packet: packet,
                hash: hash,
                signer: signer
            };
        }
    }
}
