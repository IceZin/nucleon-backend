const { parse } = require('url')
const next = require('next')
const fs = require('fs');
const WebSocket = require('ws');
const WsManager = require('./components/WsManager.js');
const SockManager = require('./components/SockManager.js');
const User = require('./components/User.js');
const { createServer } = require('http');
const { genHex, genAddress } = require('./components/utils/utils.js');
const Device = require('./components/Device.js');

const port = process.env.PORT || 3000;
const update = true;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, hostname: "localhost", port })
const handle = app.getRequestHandler()

const wss = new WebSocket.Server({noServer: true});

// [---] Cookie Parser [---]

function getCookies(raw) {
    if (raw == undefined) return;
    var cookies = raw.split(';')
    var arr = {};

    cookies.forEach(cookie => {
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }

        let ck = cookie.substring(0, cookie.indexOf('='));
        let ck_val = cookie.substring(cookie.indexOf('=') + 1, cookie.length);
        
        arr[ck] = ck_val;
    });

    return arr;
}

let token = "3f66092318698232381ab122efab14a5410a29a92ab7e1fdd52f58fb922869b26460bec7aade4440c9d87aa8f653e77e38de8957bdec2f952eeb0bd44dbaa62b";

const users = {
    [token]: new User("IceZin", "123", token)
}

const usersToken = {
    "IceZin": token
}

function get_user(frame) {
    let headers = frame.req.headers;
    let cookies = getCookies(headers.cookie);
    return cookies?.utoken != undefined ? users[cookies.utoken] : undefined;
}

function get_session_id(frame) {
    let headers = frame.req.headers;
    let cookies = getCookies(headers.cookie);
    return cookies.sessionID;
}

function send_json_res(res, obj) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(
        obj
    ));
}

const apiPaths = {
    "login": (frame) => {
        let res = frame.res;
        let header = frame.req.headers;

        let username = header.username;
        let password = header.password;

        let userToken = usersToken[username]

        if (userToken != undefined) {
            let user = users[userToken];

            let check = user.checkLogin(username, password);

            if (check) {
                let sessionID = user.newSession();

                console.log(header);
                console.log("User logged in, sessionID: " + sessionID);

                res.statusCode = 200;
                res.setHeader("Set-Cookie", [
                    `utoken=${userToken}; path=/;`,
                    `sessionID=${sessionID}; path=/`
                ]);
                res.end();

                return;
            }
        }

        res.statusCode = 404;
        res.end();
    },
    "checkSession": (frame) => {
        let res = frame.res;
        let user = get_user(frame);

        console.log("Checking session");

        if (user != undefined) {
            console.log("User found");

            if (user.checkSession(get_session_id(frame))) {
                console.log("Checked");

                res.statusCode = 200;
                res.end();

                return;
            }
        }

        res.statusCode = 404;
        res.end();
    },
    "getEnvironments": (frame) => {
        let user = get_user(frame);

        if (user != undefined) {
            if (user.checkSession(get_session_id(frame))) {
                send_json_res(frame.res, user.getEnvironments())
                return;
            }
        }

        frame.res.statusCode = 404;
        frame.res.end();
    },
    "getEnvironmentDevices": (frame) => {
        let user = get_user(frame);

        if (user != undefined) {
            if (user.checkSession(get_session_id(frame))) {
                send_json_res(frame.res, user.getEnvironmentDevices())
                return;
            }
        }

        frame.res.statusCode = 404;
        frame.res.end();
    }
}

const pathsHandler = {
    'api': (frame) => {
        frame.path.splice(0, 1);

        console.log("API Section");
        console.log(frame.path);
        console.log(frame.headers);

        try {
            apiPaths[frame.path[0]](frame);
        } catch (err) {
            console.log(err)
        }
    }
}

const upgradeHandlers = {
    "PHDevice": function(req, sock, head, cookies) {
        //console.log(req.headers);
        let user = users[cookies.utoken];
        let addr = cookies.dvc_addr;
        let name = cookies.dvc_name;
        let environment = cookies.environment;

        if (!user.checkDevice(addr)) {
            let client = new Device(addr, name, environment, user);
            user.registerDevice(client)
        }

        let device = user.getDevice(addr);
        device.handleConnection(sock, req, cookies);
        if (update) {
            device.update();
        }
    },
    "WsClient": function(req, sock, head, cookies) {
        console.log(req.headers);

        wss.handleUpgrade(req, sock, head, function(ws) {
            wss.emit('connection', ws, req);

            let wsClient = new WsManager(ws, req, cookies)

            let user = users[cookies.utoken];

            if (user == undefined) return;

            user.setSessionWs(cookies.sessionID, wsClient);
        })
    }
}

// [---] App Initialization [---]

app.prepare().then(() => {
    const httpserver = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        let { pathname, query } = parsedUrl;

        pathname = pathname.split('/');
        pathname.splice(0, 1);

        console.log(pathname);

        try {
            let path = pathname[0];
            pathsHandler[path]({
                req,
                res,
                path: pathname,
                query
            });
        } catch (err) {
            handle(req, res, parsedUrl);
        }
    });

    httpserver.on('upgrade', (req, sock, head) => {
        console.log("[WebSocket] New upgrade request");

        if (req.url == "/_next/webpack-hmr") {
            return;
        }

        if (req.headers['upgrade'] !== 'websocket') {
            sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            return;
        }
    
        let cookies = getCookies(req.headers.cookie);

        console.log(cookies);

        if (cookies == undefined) {
            sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            return;
        }

        console.log(req.headers);
        console.log(req.url);

        if (req.url == "/WsClient") {
            if (cookies.utoken == undefined) {
                sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                return;
            }
    
            upgradeHandlers["WsClient"](req, sock, head, cookies);
        } else {
            if (upgradeHandlers[req.headers["sec-websocket-protocol"]] == undefined || cookies.utoken == undefined) {
                sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                return;
            }
    
            upgradeHandlers[req.headers["sec-websocket-protocol"]](req, sock, head, cookies);
        }
    
    });

    httpserver.listen(port, (err) => {
        if (err) throw err
        console.log('> Ready on http://localhost:' + port)
        //TimeManager.newInterval(sendTempRequest, 1000 * 60 * 15);
    });
})
