"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function directoryExists(path) {
    try {
        const stats = fs_1.default.lstatSync(path);
        if (!stats.isDirectory()) {
            throw new TypeError(`${path} exists but it is not a directory.`);
        }
        return true;
    }
    catch (err) {
        if (err instanceof TypeError) {
            throw err;
        }
        return false;
    }
}
exports.default = directoryExists;
//# sourceMappingURL=directoryExists.js.map