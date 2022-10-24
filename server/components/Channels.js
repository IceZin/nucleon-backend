const ComplexObject = require("./ComplexObject");

class Channels {
    constructor() {
        this.channels = {};
        this.clients = {};
    }

    throwData(channel, data) {
        Object.values(this.channels[channel].callbacks).forEach(cb => cb(data));
    }

    wsDataHandler(packet) {
        if (this.channels[packet.data.channel]) {
            this.throwData(packet.data.channel, packet.data);
        }
    }

    newChannel(channel, options) {
        if (this.channels[channel] != undefined) return;

        this.channels[channel] = {
            clients: {},
            callbacks: {}
        }

        let complexObj = new ComplexObject(options);

        return complexObj;
    }

    registerWS(ws) {
        let addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, 0);
        while (this.clients[addr] != null) addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, 0);

        ws.on("data", this.wsDataHandler.bind(this));

        this.clients[addr] = ws;

        return addr;
    }

    removeWS(addr) {
        let client = this.clients[addr];

        if (client != null) {
            client.on("data", undefined);
            delete this.clients[addr];
        }
    }

    registerCallback(channel, cb) {
        if (this.channels[channel] == undefined) return;

        let addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, 0);
        while (this.channels[channel].callbacks[addr] != null) addr = Math.floor(Math.random()*0xffffff).toString(16).padStart(6, 0);

        this.channels[channel].callbacks[addr] = cb;

        return addr;
    }

    removeCallback(channel, addr) {
        if (this.channels[channel] == undefined) return;

        let callback = this.channels[channel].callbacks[addr];

        if (callback) {
            delete this.channels[channel].callbacks[addr];
        }
    }
}

module.exports = Channels;