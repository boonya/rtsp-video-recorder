# Changelog

All notable changes to this project should be documented in this file.

## [2.1.0] - [Fix] Can't stop recording in a docker container

**[Breaking change]**

If you were rely on `playlistName` option that it was able to accept value like `$(date +%Y.%m.%d-%H.%M.%S)`, now it doesn't work. You have to prepare dynamic value somewhere in your code before you pass it into Recorder instance. But by default `playlistName` still dynamic and completely the same. So, you code should work with no changes and issues.

## [2.0.3] - Bugfix & update

- [Issue #195](https://github.com/boonya/rtsp-video-recorder/issues/195) acknowledged, investigated and fixed
- Dev dependencies updated
- `jest.mocked` instead of `ts-jest/mocked` due to https://github.com/facebook/jest/pull/12089

## [2.0.2-beta.1] - Bugfix & update

- [Issue #170](https://github.com/boonya/rtsp-video-recorder/issues/170) acknowledged, investigated and fixed
- Dev dependencies updated

## [2.0.1-alpha.6] - Several bugfixes and improvements

- Verify disc space on "start" as well. Recording is not going to start if space not enough.
- "space_full" event occurs correctly now
- unsubscribe "progress", "file_created" & "space_full" events when ffmpeg process stopped only.
- Event "start" occurs before "progress"

## [2.0.0-alpha.5] - FFMPEG HLS

- Simplified code
- No messy asynchronous operations anymore
- **.m3u8** playlist generation
- Zero dependencies (except of **ffmpeg** and dev dependencies of course)
- Reduced package size
- node 10+ support
- No space wiping, **space_wiped** event and **autoClear** option anymore `[BREAKING CHANGES]`
- In case threshold has reached process just stops
- **space_full** event does not expose a path anymore. Just **{threshold: Number, used: Number}**
- No **segment_started** event anymore `[BREAKING CHANGES]`
- **file_created** & **started** events expose relative path to playlist or video file `[BREAKING CHANGES]`
- **started** event property **path** has renamed to **destination** `[BREAKING CHANGES]`

## [1.4.0-alpha.4] - Dependencies update

Nothing really interesting so far.

- Just updated all dependencies to their latest versions
- Engines declaration supports `npm@8` as well as `npm@7` since now
- Development under `node@16.13` instead of `node@15`

## [1.4.0-alpha.3] - Spaces changed in favour of tabs

- Dev dependencies up to date.
- node & npm versions are bumped.

## [1.4.0-alpha.2] - Audio stream included by default

- `noAudio` option. By default the process is going to record audio stream into a file. But in case you don't want to, you can pass `true` to this option. Note that audio stream is encoded using ACC.

- All dependencies up to date.

## [1.3.1-alpha.2] - Show errors in a message for RecorderValidationError

- `RecorderValidationError` throws an errors list in addition to just a message.

[2.0.2-beta.1]: https://github.com/boonya/rtsp-video-recorder/compare/2.0.1-alpha.6...2.0.2-beta.1
[2.0.1-alpha.6]: https://github.com/boonya/rtsp-video-recorder/compare/2.0.0-alpha.5...2.0.1-alpha.6
[2.0.0-alpha.5]: https://github.com/boonya/rtsp-video-recorder/compare/1.4.0-alpha.4...2.0.0-alpha.5
[1.4.0-alpha.4]: https://github.com/boonya/rtsp-video-recorder/compare/1.4.0-alpha.3...1.4.0-alpha.4
[1.4.0-alpha.3]: https://github.com/boonya/rtsp-video-recorder/compare/1.4.0-alpha.2...1.4.0-alpha.3
[1.4.0-alpha.2]: https://github.com/boonya/rtsp-video-recorder/compare/1.3.1-alpha.2...1.4.0-alpha.2
[1.3.1-alpha.2]: https://github.com/boonya/rtsp-video-recorder/compare/1.3.1-alpha.1...1.3.1-alpha.2
