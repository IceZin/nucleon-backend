import Session from "../Session";
import Socket from "../Socket";
import Module from "./Module";

type Mode = {
    code: number;
    parameters: {
        [key: string]: {
            code: number;
            value: number;
        }
    }
}

export default class Audio extends Module {
    private _modes: {[key: string]: Mode};

    constructor() {
        super();

        this._mode = "audio";

        this._modes = {
            audio: {
                code: 0x3,
                parameters: {
                    cutoff: {
                        code: 0x0,
                        value: 0
                    },
                    decay: {
                        code: 0x1,
                        value: 50
                    },
                    maxIntensity: {
                        code: 0x2,
                        value: 100
                    },
                    minFrequency: {
                        code: 0x3,
                        value: 3
                    },
                    maxFrequency: {
                        code: 0x4,
                        value: 5
                    },
                    broadcastData: {
                        code: 0x5,
                        value: 0
                    }
                }
            }
        }

        this._actions.set("setParameter", this.setParameter.bind(this));
    }

    syncParameter(socket: Socket, param: string) {
        let parameter = this._modes[this._mode].parameters[param];
        if (parameter == undefined) return;

        socket.sendBuffer([
            0x2, 0x3, parameter.code, parameter.value
        ])
    }

    setParameter(session: Session, socket: Socket, data: any) {
        let parameter = this._modes[this._mode].parameters[data.parameter];
        if (parameter == undefined) return;

        this._modes[this._mode].parameters[data.parameter].value = data.value;
        this.syncParameter(socket, data.parameter)

        this.broadcast([session.address], {
            type: "setParameter",
            data: {
                parameter: data.parameter,
                value: data.value
            }
        })
    }

    syncSession(session: Session) {
        session.send({
            type: "setParameters",
            data: {
                value: this._modes[this._mode].parameters
            }
        })
    }

    syncDevice(socket: Socket) {
        Object.keys(this._modes[this._mode].parameters).forEach(parameter => {
            this.syncParameter(socket, parameter);
        })
    }
}