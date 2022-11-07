"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Views = void 0;
const utils_1 = require("../components/utils/utils");
const Users_1 = __importDefault(require("./Users"));
var Views;
(function (Views) {
    function SignedIn(target, propertyName, descriptor) {
        let method = descriptor.value;
        descriptor.value = function () {
            let args = Object.values(arguments);
            const cookies = (0, utils_1.parseCookies)(args[0].headers.cookie || "");
            let user = Users_1.default.get(cookies.utoken);
            if (user) {
                if (user.checkSession(cookies.sessionID)) {
                    return method.apply(this, [...args, user]);
                }
            }
            args[1].statusCode = 401;
            args[1].end();
        };
    }
    Views.SignedIn = SignedIn;
    function Admin(target, propertyName, descriptor) {
        return true;
    }
    Views.Admin = Admin;
    function NoVerification(target, propertyName, descriptor) {
        let method = descriptor.value;
        descriptor.value = function () {
            let args = Object.values(arguments);
            return method.apply(this, args);
        };
    }
    Views.NoVerification = NoVerification;
})(Views = exports.Views || (exports.Views = {}));
