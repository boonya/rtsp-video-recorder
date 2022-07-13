"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderValidationError = exports.RecorderError = exports.RecorderEvents = exports.Recorder = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
const types_1 = require("./types");
Object.defineProperty(exports, "RecorderEvents", { enumerable: true, get: function () { return types_1.Events; } });
const error_1 = require("./error");
Object.defineProperty(exports, "RecorderError", { enumerable: true, get: function () { return error_1.RecorderError; } });
Object.defineProperty(exports, "RecorderValidationError", { enumerable: true, get: function () { return error_1.RecorderValidationError; } });
const validators_1 = require("./validators");
const space_1 = __importDefault(require("./helpers/space"));
const playlistName_1 = __importDefault(require("./helpers/playlistName"));
const sizeThreshold_1 = __importDefault(require("./helpers/sizeThreshold"));
const segmentTime_1 = __importDefault(require("./helpers/segmentTime"));
const APPROXIMATION_PERCENTAGE = 1;
class Recorder {
    constructor(uri, destination, options = {}) {
        this.uri = uri;
        this.destination = destination;
        this.ffmpegBinary = 'ffmpeg';
        this.filePattern = '%Y.%m.%d/%H.%M.%S';
        this.segmentTime = 600;
        this.process = null;
        this.start = () => {
            this.eventEmitter.emit(types_1.Events.START, 'programmatically');
            return this;
        };
        this.stop = () => {
            this.eventEmitter.emit(types_1.Events.STOP, 'programmatically');
            return this;
        };
        this.on = (event, callback) => {
            this.eventEmitter.on(event, callback);
            return this;
        };
        this.removeListener = (event, callback) => {
            this.eventEmitter.removeListener(event, callback);
            return this;
        };
        this.isRecording = () => Boolean(this.process);
        this.startRecord = async () => {
            try {
                await Promise.resolve(true);
                if (this.process) {
                    throw new error_1.RecorderError('Process already spawned.');
                }
                if (!this.isSpaceEnough()) {
                    this.eventEmitter.emit(types_1.Events.STOPPED, 0, 'space_full');
                    return;
                }
                this.on(types_1.Events.PROGRESS, this.onProgress)
                    .on(types_1.Events.FILE_CREATED, this.isSpaceEnough)
                    .on(types_1.Events.SPACE_FULL, this.onSpaceFull)
                    .on(types_1.Events.STOPPED, this.onStopped);
                this.process = (0, child_process_1.spawn)(this.ffmpegBinary, [
                    '-rtsp_transport', 'tcp',
                    '-i', this.uri,
                    '-reset_timestamps', '1',
                    ...(this.title ? ['-metadata', `title="${this.title}"`] : []),
                    ...(this.noAudio ? ['-an'] : ['-c:a', 'aac']),
                    '-strftime', '1',
                    '-strftime_mkdir', '1',
                    '-hls_time', String(this.segmentTime),
                    '-hls_list_size', '0',
                    '-hls_segment_filename', `${this.filePattern}.mp4`,
                    `./${this.playlistName}.m3u8`,
                ], {
                    detached: false,
                    cwd: this.destination,
                });
                this.process.stderr.on('data', (buffer) => {
                    const message = buffer.toString();
                    this.eventEmitter.emit(types_1.Events.PROGRESS, message);
                });
                this.process.on('error', (error) => {
                    this.eventEmitter.emit(types_1.Events.ERROR, new error_1.RecorderError(error));
                });
                this.process.on('close', (code) => {
                    this.eventEmitter.emit(types_1.Events.STOPPED, code, 'ffmpeg_exited');
                });
            }
            catch (err) {
                this.eventEmitter.emit(types_1.Events.ERROR, err);
            }
        };
        this.stopRecord = async () => {
            await Promise.resolve(true);
            if (!this.process) {
                this.eventEmitter.emit(types_1.Events.ERROR, new error_1.RecorderError('No process spawned.'));
                return;
            }
            this.process.kill();
        };
        this.matchStarted = (message) => {
            var _a, _b;
            const pattern = new RegExp('Output #0, hls, to \'./(?<file>(:?.+).m3u8)\':');
            return (_b = (_a = message.match(pattern)) === null || _a === void 0 ? void 0 : _a.groups) === null || _b === void 0 ? void 0 : _b.file;
        };
        this.matchFileCreated = (message) => {
            var _a, _b;
            const pattern = new RegExp('Opening \'(?<file>.+)\' for writing');
            const file = ((_b = (_a = message.match(pattern)) === null || _a === void 0 ? void 0 : _a.groups) === null || _b === void 0 ? void 0 : _b.file) || false;
            const segment = file && !file.match(/\.m3u8\.tmp$/u);
            return segment ? file : undefined;
        };
        this.onProgress = (message) => {
            const playlist = this.matchStarted(message);
            if (playlist) {
                this.eventEmitter.emit(types_1.Events.STARTED, {
                    uri: this.uri,
                    destination: this.destination,
                    playlist,
                    title: this.title,
                    filePattern: this.filePattern,
                    segmentTime: this.segmentTime,
                    dirSizeThreshold: this.dirSizeThreshold,
                    noAudio: this.noAudio,
                    ffmpegBinary: this.ffmpegBinary,
                });
            }
            const file = this.matchFileCreated(message);
            if (file) {
                this.eventEmitter.emit(types_1.Events.FILE_CREATED, file);
            }
        };
        this.isSpaceEnough = () => {
            try {
                if (!this.dirSizeThreshold) {
                    return true;
                }
                const used = (0, space_1.default)(this.destination);
                const enough = Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) < this.dirSizeThreshold;
                if (enough) {
                    return true;
                }
                this.eventEmitter.emit(types_1.Events.SPACE_FULL, {
                    threshold: this.dirSizeThreshold,
                    used,
                });
                return false;
            }
            catch (err) {
                this.eventEmitter.emit(types_1.Events.ERROR, err);
            }
            return true;
        };
        this.onSpaceFull = () => {
            this.eventEmitter.emit(types_1.Events.STOP, 'space_full');
        };
        this.onStopped = () => {
            this.eventEmitter.removeListener(types_1.Events.PROGRESS, this.onProgress);
            this.eventEmitter.removeListener(types_1.Events.FILE_CREATED, this.isSpaceEnough);
            this.eventEmitter.removeListener(types_1.Events.SPACE_FULL, this.onSpaceFull);
            this.process = null;
        };
        const errors = (0, validators_1.verifyAllOptions)(destination, options);
        if (errors.length) {
            throw new error_1.RecorderValidationError('Options invalid', errors);
        }
        this.title = options.title;
        this.ffmpegBinary = options.ffmpegBinary || this.ffmpegBinary;
        this.playlistName = (0, playlistName_1.default)(options.playlistName);
        this.filePattern = (options.filePattern || this.filePattern).replace(/(?:[\s:]+)/gu, '_');
        this.segmentTime = options.segmentTime
            ? (0, segmentTime_1.default)(options.segmentTime)
            : this.segmentTime;
        this.dirSizeThreshold = options.dirSizeThreshold
            ? (0, sizeThreshold_1.default)(options.dirSizeThreshold)
            : undefined;
        this.noAudio = options.noAudio || false;
        this.eventEmitter = new events_1.EventEmitter();
        this.on(types_1.Events.START, this.startRecord);
        this.on(types_1.Events.STOP, this.stopRecord);
    }
}
exports.default = Recorder;
exports.Recorder = Recorder;
//# sourceMappingURL=recorder.js.map