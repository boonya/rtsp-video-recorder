"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurationFactor = exports.BytesFactor = exports.Events = void 0;
var Events;
(function (Events) {
    Events["START"] = "start";
    Events["STARTED"] = "started";
    Events["STOP"] = "stop";
    Events["STOPPED"] = "stopped";
    Events["ERROR"] = "error";
    Events["PROGRESS"] = "progress";
    Events["FILE_CREATED"] = "file_created";
    Events["SPACE_FULL"] = "space_full";
})(Events = exports.Events || (exports.Events = {}));
var BytesFactor;
(function (BytesFactor) {
    BytesFactor["Megabytes"] = "M";
    BytesFactor["Gigabytes"] = "G";
    BytesFactor["Terabytes"] = "T";
})(BytesFactor = exports.BytesFactor || (exports.BytesFactor = {}));
var DurationFactor;
(function (DurationFactor) {
    DurationFactor["Seconds"] = "s";
    DurationFactor["Minutes"] = "m";
    DurationFactor["Hours"] = "h";
})(DurationFactor = exports.DurationFactor || (exports.DurationFactor = {}));
//# sourceMappingURL=types.js.map