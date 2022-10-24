class WsManager {
    constructor(ws, req, cookies) {
        this.events = {};
        this.pingTimeout = null;
        this.lossTimer = null;
        this.pingTime = 1000;
        this.maxLoss = 10;
        this.packetLoss = 0;
        this.awaitingPing = false;
        this.ws = ws;

        this.ws.onclose = () => {
            this.destroy();
        }

        this.ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);

            if (data.type == 0x0) this.awaitingPing = false;
            else if (this.events["data"] != undefined) this.events["data"](data);
        };

        this.pingTimeout = setTimeout(this.ping.bind(this), this.pingTime);
    }

    sendJSON(json) {
        this.ws.send(JSON.stringify(json));
    }

    clearTimeouts() {
        if (this.lossTimer) clearTimeout(this.lossTimer);
        if (this.pingTimeout) clearTimeout(this.pingTimeout);
    }

    ping() {
        if (!this.awaitingPing) {
            try {
                this.sendJSON({type: 0x0});
            } catch (error) {
                console.log(error)
            }

            this.awaitingPing = true;

            this.pingTimeout = setTimeout(() => {
                if (this.awaitingPing) {
                    this.toggleTimer();

                    this.packetLoss++;
                    this.awaitingPing = false;

                    if (this.packetLoss >= this.maxLoss) {
                        if (this.events['end'] != null) this.events['end']();
                        this.ws.close();
                    } else {
                        this.ping();
                    }
                } else {
                    this.ping();
                }
            }, this.pingTime);
        }
    }

    destroy() {
        if (this.events['end'] != null) this.events['end']();
        this.ws.close();
    }

    toggleTimer() {
        if (this.lossTimer != null) {
            clearTimeout(this.lossTimer);
            this.lossTimer = null;
        }

        this.lossTimer = setTimeout(() => {
            this.packetLoss = 0;
        }, this.maxLoss * this.pingTime);
    }

    on(event, callback) {
        this.events[event] = callback;
    }
}

module.exports = WsManager;