import { optionsSelector } from '../logic/Selectors';
import { createTestLogic } from '../testing/TestingUtils';
import {
    decodePermalink,
    defaultSettings,
    encodePermalink,
    validateSettings,
} from './Settings';

describe('permalink', () => {
    const tester = createTestLogic();

    beforeAll(tester.initialize);
    beforeEach(tester.reset);

    function getOptions() {
        return tester.readSelector(optionsSelector);
    }

    it('round trips a permalink', () => {
        const options = getOptions();
        const settings = defaultSettings(options);
        const encoded = encodePermalink(options, settings);
        const decoded = decodePermalink(options, encoded);
        expect(settings).toEqual(decoded);
        const encodedAgain = encodePermalink(options, decoded);
        expect(encodedAgain).toEqual(encoded);
    });

    it('recovers from bad settings', () => {
        const options = getOptions();
        const settings = defaultSettings(options);
        const defaultExcludedLocations = settings['excluded-locations'];
        settings['damage-multiplier'] = -1;
        settings['fs-lava-flow'] = 3 as unknown as boolean;
        settings['boss-key-mode'] = 'Unvanilla' as 'Vanilla';
        settings['excluded-locations'] = 9 as unknown as string[];
        const vSettings = validateSettings(options, settings);
        expect(vSettings['damage-multiplier']).toBe(1);
        expect(vSettings['fs-lava-flow']).toBe(false);
        expect(vSettings['boss-key-mode']).toBe('Own Dungeon');
        expect(vSettings['excluded-locations']).toEqual(
            defaultExcludedLocations,
        );
    });
});
