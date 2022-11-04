import Session from "../Session";
import Socket from "../Socket";

export default class Module {
    private _sessions: Map<string, Session> = new Map();
    protected _actions: Map<string, (session: Session, socket: Socket, data: any) => void> = new Map();
    private _name: string = "Default";
    protected _mode: string = "deafult";

    addSession(session: Session) {
        if (!this._sessions.has(session.address)) return;
        this._sessions.set(session.address, session);
    }

    removeSession(session: Session) {
        if (!this._sessions.has(session.address)) return;
        this._sessions.delete(session.address);
    }

    broadcast(excludeAddresses: string[], data: any) {
        Object.keys(this._sessions).forEach(sessionAddr => {
            if (!excludeAddresses.includes(sessionAddr)) {
                console.log(sessionAddr);
                this._sessions.get(sessionAddr)?.send(data);
            }
        })
    }

    handleAction(session: Session, socket: Socket, data: any) {
        if (this._actions.has(data.action)) {
            this._actions.get(data.action)?.(session, socket, data);
        }
    }

    get name() {
        return this._name;
    }
}