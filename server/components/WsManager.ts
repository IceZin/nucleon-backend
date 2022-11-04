import { IncomingMessage } from "http";
import { WebSocket } from "ws"

export default class WsManager {
    private _events: Map<string, (data: any) => void> = new Map();
    private _pingTimeout: NodeJS.Timeout | undefined;
    private _lossTimer: NodeJS.Timeout | undefined;
    private _pingTime: number = 1000;
    private _maxLoss: number = 10;
    private _packetLoss: number = 0;
    private _awaitingPing: boolean = false;
    private _ws: WebSocket;

    constructor(ws: WebSocket, req: IncomingMessage, cookies: {[key: string]: string}) {
        this._ws = ws;

        this._ws.onclose = () => {
            this.destroy();
        }

        this._ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data.toString());

            if (data.type == 0x0) this._awaitingPing = false;
            else if (this._events.has("data")) this._events.get("data")?.(data);
        };

        this._pingTimeout = setTimeout(this.ping.bind(this), this._pingTime);
    }

    sendJSON(data: any) {
        this._ws.send(JSON.stringify(data));
    }

    clearTimeouts() {
        if (this._lossTimer) clearTimeout(this._lossTimer);
        if (this._pingTimeout) clearTimeout(this._pingTimeout);
    }

    ping() {
        if (!this._awaitingPing) {
            try {
                this.sendJSON({type: 0x0});
            } catch (error) {
                console.log(error)
            }

            this._awaitingPing = true;

            this._pingTimeout = setTimeout(() => {
                if (this._awaitingPing) {
                    this.toggleTimer();

                    this._packetLoss++;
                    this._awaitingPing = false;

                    if (this._packetLoss >= this._maxLoss) {
                        if (this._events.has("end")) this._events.get("end")?.(undefined);
                        this._ws.close();
                    } else {
                        this.ping();
                    }
                } else {
                    this.ping();
                }
            }, this._pingTime);
        }
    }

    destroy() {
        if (this._events.has("end")) this._events.get("end")?.(undefined);
        this._ws.close();
    }

    toggleTimer() {
        if (this._lossTimer != null) {
            clearTimeout(this._lossTimer);
            this._lossTimer = undefined;
        }

        this._lossTimer = setTimeout(() => {
            this._packetLoss = 0;
        }, this._maxLoss * this._pingTime);
    }

    on(event: string, callback: (data: any) => void) {
        this._events.set(event, callback);
    }
}

module.exports = WsManager;