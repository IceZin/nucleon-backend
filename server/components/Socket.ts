import { IncomingMessage } from "http";
import internal from "stream";

const fs = require("fs");

export default class Socket {
    private _events: Map<string, (data: any) => void> = new Map()
    private _pingTimeout: NodeJS.Timeout | undefined = undefined;
    private _lossTimer: NodeJS.Timeout | undefined = undefined;
    private _pingTime: number = 100;
    private _maxLoss: number = 100;
    private _packetLoss: number = 0;
    private _awaitingPing: boolean = false;
    private _updating: boolean = false;
    private _socket: internal.Duplex;
    private _cookies: {[key: string]: string};
    
    constructor(socket: internal.Duplex, req: IncomingMessage, cookies: {[key: string]: string}) {
        this._socket = socket;
        this._cookies = cookies;

        this._socket.on('data', (data) => {
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
                        if (packet[0] == 0x0) this._awaitingPing = false;
                        else if (this._events.has("data")) this._events.get("data")?.(packet);

                        newPacket = true;
                    }
                }
            }
        });

        this._socket.on('error', (err) => {
            if (this._events.has("error")) 
                this._events.get("error")?.(err);
        })

        //this._pingTimeout = setTimeout(this.ping.bind(this), this._pingTime);
    }

    sendBuffer(buffer: number[]) {
        if (!this._updating) {
            let data = Buffer.from([0x1, buffer.length, ...buffer]);
            console.log(data);
            this._socket.write(data);
        }
    }

    write(message: string) {
        this._socket.write(message);
    }

    update(filename: string) {
        this._updating = true;

        console.log("Updating device");

        let file = fs.readFileSync(filename);
        let buffer: number[] = [];

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

        this._socket.write(Buffer.from(buffer));
    }

    clearTimeouts() {
        if (this._lossTimer) clearTimeout(this._lossTimer);
        if (this._pingTimeout) clearTimeout(this._pingTimeout);
    }

    clearCallbacks() {
        this._events.clear();
    }

    ping() {
        if (!this._awaitingPing && !this._updating) {
            try {
                this._socket.write(Buffer.from([0x0]));
            } catch (error) {
                console.log(error)
            }

            this._awaitingPing = true;

            this._pingTimeout = setTimeout(() => {
                if (this._awaitingPing) {
                    this._packetLoss++;
                    this._awaitingPing = false;

                    if (this._packetLoss >= this._maxLoss) {
                        if (this._events.has("end")) this._events.get("end")?.(undefined);
                        this._socket.end();
                    } else {
                        this.ping();
                    }
                } else {
                    this._packetLoss = 0;
                    this.ping();
                }
            }, this._pingTime);
        }
    }

    toggleTimer() {
        if (this._lossTimer) {
            clearTimeout(this._lossTimer);
            this._lossTimer = undefined;
        }

        this._lossTimer = setTimeout(() => {
            this._packetLoss = 0;
        }, (this._maxLoss * this._pingTime) * 0.5);
    }

    destroy() {

    }

    on(event: string, callback: (data: any) => void) {
        this._events.set(event, callback);
    }

    get cookies() {
        return this._cookies;
    }
}
