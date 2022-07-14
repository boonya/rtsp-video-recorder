import { verifyAllOptions } from '../../src/validators';
import { mockSpawnProcess, URI, DESTINATION } from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';
import playlistName from '../../src/helpers/playlistName';

jest.mock('../../src/validators');
jest.mock('../../src/helpers/playlistName');

let onStart: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	mockSpawnProcess();
	onStart = jest.fn().mockName('onStart');
	jest.mocked(playlistName).mockReturnValue('playlist');
});

test('should return "programmatically" if .stop() executed', () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.START, onStart)
		.start();

	expect(onStart).toBeCalledTimes(1);
	expect(onStart).toBeCalledWith('programmatically');
});
