import { act } from '@testing-library/react';
import { createTestLogic } from '../testing/TestingUtils';
import { allSettingsSelector } from './Selectors';
import { acceptSettings } from './Slice';
import { useTrackerInterfaceReducer } from './TrackerInterfaceReducer';

describe('tracker interface reducer', () => {
    const tester = createTestLogic();

    beforeAll(tester.initialize);
    beforeEach(tester.reset);

    it('initializes with starting region', () => {
        const { result } = tester.renderHook(() =>
            useTrackerInterfaceReducer(),
        );
        expect(result.current[0]).toMatchInlineSnapshot(`
          {
            "hintRegion": "Upper Skyloft",
            "mapView": "skyloftSubmap",
            "type": "viewingChecks",
          }
        `);
    });

    it('initializes with entrance chooser', () => {
        const settings = tester.readSelector(allSettingsSelector);
        tester.dispatch(
            acceptSettings({
                settings: { ...settings, 'random-start-entrance': 'Any' },
            }),
        );
        const { result } = tester.renderHook(() =>
            useTrackerInterfaceReducer(),
        );
        expect(result.current[0]).toMatchInlineSnapshot(`
          {
            "exitId": "\\Start",
            "mapView": undefined,
            "previousHintRegion": undefined,
            "type": "choosingEntrance",
          }
        `);

        act(() => {
            result.current[1]({
                type: 'cancelChooseEntrance',
                selectedEntrance: tester.findEntranceId(
                    'Sealed Grounds',
                    'Sealed Grounds Spiral',
                ),
            });
        });

        expect(result.current[0]).toMatchInlineSnapshot(`
          {
            "hintRegion": "Sealed Grounds",
            "mapView": "faronSubmap",
            "type": "viewingChecks",
          }
        `);
    });

    it('goes back to correct hint region', () => {
        const settings = tester.readSelector(allSettingsSelector);
        tester.dispatch(
            acceptSettings({
                settings: {
                    ...settings,
                    'randomize-entrances': 'All Surface Dungeons',
                },
            }),
        );

        const exitId = tester.findExit('Faron Woods', 'Exit to Skyview Temple')
            .exit.id;
        const { result } = tester.renderHook(() =>
            useTrackerInterfaceReducer(),
        );

        act(() => {
            result.current[1]({
                type: 'selectHintRegion',
                hintRegion: 'Lanayru Gorge',
            });
        });

        expect(result.current[0]).toMatchInlineSnapshot(`
          {
            "hintRegion": "Lanayru Gorge",
            "mapView": "lanayruSubmap",
            "type": "viewingChecks",
          }
        `);

        act(() => {
            result.current[1]({
                type: 'chooseEntrance',
                exitId,
            });
        });

        // TODO maybe mapView should be faron? Hard to select an exit without being
        // on that map though.
        expect(result.current[0]).toMatchInlineSnapshot(`
          {
            "exitId": "\\Faron\\Faron Woods\\Deep Woods\\Exit to Skyview Temple",
            "mapView": "lanayruSubmap",
            "previousHintRegion": "Lanayru Gorge",
            "type": "choosingEntrance",
          }
        `);

        act(() => {
            result.current[1]({
                type: 'cancelChooseEntrance',
                selectedEntrance: undefined,
            });
        });

        expect(result.current[0]).toMatchInlineSnapshot(`
          {
            "hintRegion": "Lanayru Gorge",
            "mapView": "lanayruSubmap",
            "type": "viewingChecks",
          }
        `);
    });
});
