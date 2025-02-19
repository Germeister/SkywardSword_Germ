import type { TypedOptions } from '../../permalink/SettingsTypes';
import type { AppAction, RootState } from '../../store/Store';
import { createTestLogic } from '../../testing/TestingUtils';
import { allSettingsSelector } from '../../tracker/Selectors';
import { acceptSettings, mapEntrance } from '../../tracker/Slice';
import { getOwningProvince } from './MapModel';
import { mapModelSelector } from './Selectors';

describe('tracker interaction', () => {
    const tester = createTestLogic();

    beforeAll(tester.initialize);
    beforeEach(tester.reset);

    /**
     * Read the value of a selector. The result is not reactive,
     * so for updated state you must read again after dispatching any actions.
     */
    function readSelector<T>(selector: (state: RootState) => T): T {
        return tester.readSelector(selector);
    }

    function dispatch(action: AppAction) {
        return tester.dispatch(action);
    }

    /** Set a particular settings value. */
    function updateSettings<K extends keyof TypedOptions>(
        option: K,
        value: TypedOptions[K],
    ) {
        const settings = {
            ...readSelector(allSettingsSelector),
            [option]: value,
        };
        dispatch(acceptSettings({ settings }));
    }

    it('can build a map model', () => {
        const mapModel = readSelector(mapModelSelector);
        expect(getOwningProvince(mapModel, 'Sky')).toMatchInlineSnapshot(`
          {
            "result": undefined,
            "type": "ok",
          }
        `);

        expect(getOwningProvince(mapModel, 'Faron Woods'))
            .toMatchInlineSnapshot(`
          {
            "result": "faronSubmap",
            "type": "ok",
          }
        `);
    });

    it('correctly assigns dungeons in other regions', () => {
        updateSettings('randomize-entrances', 'All Surface Dungeons');
        let mapModel;
        mapModel = readSelector(mapModelSelector);
        expect(getOwningProvince(mapModel, 'Earth Temple'))
            .toMatchInlineSnapshot(`
          {
            "type": "err",
          }
        `);
        dispatch(
            mapEntrance({
                from: tester.findExit('Faron Woods', 'Exit to Skyview Temple')
                    .exit.id,
                to: tester.findEntranceId('Earth Temple', 'Main Entrance'),
            }),
        );
        mapModel = readSelector(mapModelSelector);
        expect(getOwningProvince(mapModel, 'Earth Temple'))
            .toMatchInlineSnapshot(`
          {
            "result": "faronSubmap",
            "type": "ok",
          }
        `);
    });
});
