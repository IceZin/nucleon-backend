const fs = require("fs");

class DeviceSocket {
    constructor(sock, req, cookies) {
        this.events = {};
        this.pingTimeout = null;
        this.lossTimer = null;
        this.pingTime = 100;
        this.maxLoss = 100;
        this.packetLoss = 0;
        this.awaitingPing = false;
        this.sock = sock;
        this.cookies = cookies;
        this.updating = false;

        this.sock.on('data', (data) => {
            let newPacket = true;
            let packetIndex = 0;
            let packetLen = 0;
            let packet = [];

            for (let i = 0; i < data.length; i++) {
                if (newPacket) {
                    packetIndex = 0;
                    packetLen = 0;
                    newPacket = false;
                    packet = [];
                    packetLen = data[i];
                } else {
                    packet[packetIndex++] = data[i];

                    if (packetIndex == packetLen) {
                        if (packet[0] == 0x0) this.awaitingPing = false;
                        else if (this.events["data"] != undefined) this.events["data"](packet);

                        newPacket = true;
                    }
                }
            }
        });

        this.sock.on('error', (err) => {
            if (this.events["error"] != undefined) 
                this.events["error"](err);
        })

        //this.pingTimeout = setTimeout(this.ping.bind(this), this.pingTime);
    }

    sendBuffer(buff) {
        if (!this.updating) {
            let data = Buffer.from([0x1, buff.length, ...buff]);
            console.log(data);
            this.sock.write(data);
        }
    }

    update(filename) {
        this.updating = true;

        console.log("Updating device");

        let file = fs.readFileSync(filename);
        let buffer = [];

        let kilobytes = Math.floor(file.length / 1024);
        for (let i = 0; i < Math.floor(kilobytes / 255); i++) {
            buffer = [...buffer, 0x1, 0xff];
        }
        buffer = [...buffer, 0x1, kilobytes % 255, 0x0, file.length % 1024];
        buffer = [0x2, buffer.length / 2, ...buffer, ...file];

        /*console.log("OK")

        for (let i = 0; i < 768000 / 256; i++) {
            for (let x = 0; x < 256; x++) {
                buffer.push(x);
            }
        }

        console.log("OK")*/

        console.log(Buffer.from(buffer));

        this.sock.write(Buffer.from(buffer));
    }

    clearTimeouts() {
        if (this.lossTimer) clearTimeout(this.lossTimer);
        if (this.pingTimeout) clearTimeout(this.pingTimeout);
    }

    clearCallbacks() {
        this.events = {};
    }

    ping() {
        if (!this.awaitingPing && !this.updating) {
            try {
                this.sock.write(Buffer.from([0x0]));
            } catch (error) {
                console.log(error)
            }

            this.awaitingPing = true;

            this.pingTimeout = setTimeout(() => {
                if (this.awaitingPing) {
                    this.packetLoss++;
                    this.awaitingPing = false;

                    if (this.packetLoss >= this.maxLoss) {
                        if (this.events['end'] != null) this.events['end']();
                        this.sock.end();
                    } else {
                        this.ping();
                    }
                } else {
                    this.packetLoss = 0;
                    this.ping();
                }
            }, this.pingTime);
        }
    }

    toggleTimer() {
        if (this.lossTimer != null) {
            clearTimeout(this.lossTimer);
            this.lossTimer = null;
        }

        this.lossTimer = setTimeout(() => {
            this.packetLoss = 0;
        }, (this.maxLoss * this.pingTime) * 0.5);
    }

    destroy() {

    }

    on(event, callback) {
        this.events[event] = callback;
    }
}

module.exports = DeviceSocket;