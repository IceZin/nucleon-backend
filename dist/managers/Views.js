"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Views = void 0;
var Views;
(function (Views) {
    function SignedIn(target, propertyName, descriptor) {
        console.log(target);
        console.log(propertyName);
        console.log(descriptor);
    }
    Views.SignedIn = SignedIn;
    function SignedInTest(target, propertyName, descriptor) {
        console.log(target);
        console.log(propertyName);
        console.log(descriptor);
        console.log(descriptor.value);
        let method = descriptor.value;
        descriptor.value = function () {
            let args = Object.values(arguments);
            console.log(args);
            args.forEach((arg) => {
                if (arg == "Mascaico")
                    console.log("Olha meus irmaunnsss");
                else
                    console.log(arg);
            });
            return method.apply(this, args);
        };
    }
    Views.SignedInTest = SignedInTest;
    function Admin(target, propertyName, descriptor) {
        return true;
    }
    Views.Admin = Admin;
    function NoVerification(target, propertyName, descriptor) {
        return true;
    }
    Views.NoVerification = NoVerification;
})(Views = exports.Views || (exports.Views = {}));
