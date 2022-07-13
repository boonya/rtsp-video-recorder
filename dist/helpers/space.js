"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function dirSize(path) {
    return getDirListing(path)
        .map((item) => fs_1.default.statSync(item).size)
        .reduce((acc, size) => acc + size, 0);
}
exports.default = dirSize;
function getDirListing(dir) {
    return fs_1.default.readdirSync(dir)
        .map((item) => {
        const path = path_1.default.join(dir, item);
        if (fs_1.default.statSync(path).isDirectory()) {
            return getDirListing(path);
        }
        return path;
    })
        .reduce((acc, i) => {
        if (Array.isArray(i)) {
            return [...acc, ...i];
        }
        return [...acc, i];
    }, []);
}
//# sourceMappingURL=space.js.map