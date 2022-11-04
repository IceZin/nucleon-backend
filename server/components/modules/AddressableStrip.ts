import Session from "../Session";
import Socket from "../Socket";
import Module from "./Module";

type Mode = {
    code: number;
    parameters: {
        [key: string]: {
            code: number;
            value: number;
            min?: number;
            max?: number;
        }
    }
}

export default class AddressableStrip extends Module {
    private _color = [0, 0, 0];
    private _modes: {[key: string]: Mode};

    constructor() {
        super();

        this._mode = "solid";

        this._modes = {
            solid: {
                code: 0x0,
                parameters: {
                    intensity: {
                        code: 0x0,
                        value: 100,
                        min: 0,
                        max: 100
                    }
                }
            },
            fade: {
                code: 0x1,
                parameters: {
                    intensity: {
                        code: 0x0,
                        value: 100,
                        min: 0,
                        max: 100
                    }
                }
            },
            spectrum: {
                code: 0x2,
                parameters: {
                    animation: {
                        code: 0x0,
                        value: 0
                    },
                    colorType: {
                        code: 0x1,
                        value: 0
                    },
                    cometCutoff: {
                        code: 0x2,
                        value: 70,
                        min: 0,
                        max: 100
                    },
                    cometSize: {
                        code: 0x3,
                        value: 1,
                        min: 1,
                        max: 10
                    },
                    cometTailSize: {
                        code: 0x4,
                        value: 0,
                        min: 0,
                        max: 10
                    },
                    cometSpacing: {
                        code: 0x5,
                        value: 1,
                        min: 0,
                        max: 10
                    },
                    cometUpdateTime: {
                        code: 0x6,
                        value: 20,
                        min: 0,
                        max: 255
                    }
                }
            },
            chroma: {
                code: 0x3,
                parameters: {
                    intensity: {
                        code: 0x0,
                        value: 100,
                        min: 0,
                        max: 100
                    }
                }
            }
        }

        this._actions.set("setColor", this.setColor.bind(this));
        this._actions.set("setMode", this.setMode.bind(this));
        this._actions.set("setParameter", this.setParameter.bind(this));
    }

    syncColor(socket: Socket) {
        console.log("[ADDRESSABLE STRIP] Syncing Color");
        socket.sendBuffer([
            0x2, 0x0, ...this._color
        ])
    }

    setColor(session: Session, socket: Socket, data: any) {
        if (data.color.length > 3) return;

        this._color = data.color;

        this.syncColor(socket);

        this.broadcast([session.address], {
            type: "setColor",
            data: {
                value: data.color
            }
        })
    }

    syncMode(socket: Socket) {
        console.log("[ADDRESSABLE STRIP] Syncing Mode");
        socket.sendBuffer([
            0x2, 0x1, this._modes[this._mode].code
        ])
    }

    setMode(session: Session, socket: Socket, data: any) {
        let mode = data.mode;

        if (this._modes[mode] == undefined) return;

        this._mode = mode;
        this.syncMode(socket);

        this.broadcast([session.address], {
            type: "setMode",
            data: {
                value: mode
            }
        })
    }

    syncParameter(socket: Socket, param: string) {
        console.log("[ADDRESSABLE STRIP] Syncing Parameter");
        let parameter = this._modes[this._mode].parameters[param];
        if (parameter == undefined) return;

        socket.sendBuffer([
            0x2, 0x2, parameter.code, parameter.value
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
            type: "setColor",
            data: {
                value: this._color
            }
        })

        session.send({
            type: "setMode",
            data: {
                value: this._mode
            }
        })

        session.send({
            type: "setParameters",
            data: {
                value: this._modes[this._mode].parameters
            }
        })
    }

    syncDevice(socket: Socket) {
        console.log("[ADDRESSABLE STRIP] Syncing Device");

        this.syncColor(socket);
        this.syncMode(socket);

        Object.keys(this._modes[this._mode].parameters).forEach(parameter => {
            this.syncParameter(socket, parameter);
        })
    }
}
