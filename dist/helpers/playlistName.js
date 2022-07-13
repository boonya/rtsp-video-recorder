"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function playlistName(customValue) {
    if (customValue) {
        return customValue.replace(/[^\w]+/ug, '_');
    }
    const now = new Date();
    const [date] = now.toISOString().split('T');
    const [time] = now.toTimeString().split(' ');
    return [
        date.replace(/-/ug, '.'),
        time.replace(/:/ug, '.'),
    ].join('-');
}
exports.default = playlistName;
//# sourceMappingURL=playlistName.js.map