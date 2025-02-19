import { useReducer } from 'react';
import { useSelector } from 'react-redux';
import {
    getOwningProvince,
    type MapModel,
} from '../locationTracker/mapTracker/MapModel';
import { mapModelSelector } from '../locationTracker/mapTracker/Selectors';
import type { ExitMapping } from '../logic/Locations';
import type { AreaGraph, Logic } from '../logic/Logic';
import { areaGraphSelector } from '../logic/Selectors';
import { exitsByIdSelector } from './Selectors';

export type InterfaceState =
    | {
          /**
           * The tracker is prompting the user to pick the entrance corresponding to
           * a given exit.
           */
          type: 'choosingEntrance';
          mapView: string | undefined;
          exitId: string;
          previousHintRegion: string | undefined;
      }
    | {
          /**
           * The normal tracker view, possibly presenting the user with a list of checks.
           */
          type: 'viewingChecks';
          hintRegion: string | undefined;
          mapView: string | undefined;
      };

type InterfaceStateInternal =
    | InterfaceState
    | {
          /**
           * The tracker is in its initial state. If starting entrance is randomized,
           * this will resolve to picking the starting entrance, otherwise it will
           * resolve to the starting region.
           */
          type: 'initial';
      };

export type InterfaceAction =
    | {
          /** Clicking on Faron, Eldin, Lanayru, or Skyloft */
          type: 'selectMapView';
          province: string;
      }
    | {
          /** Selecting a particular hint region */
          type: 'selectHintRegion';
          hintRegion: string;
      }
    | {
          /** Back to Sky */
          type: 'leaveMapView';
      }
    | {
          /** Choose an entrance */
          type: 'chooseEntrance';
          exitId: string;
      }
    | {
          /** Selected an entrance, or canceled the dialog */
          type: 'cancelChooseEntrance';
          selectedEntrance: string | undefined;
      };

function getHintRegionForEntrance(
    entranceId: string,
    areaGraph: Logic['areaGraph'],
): string {
    return areaGraph.entranceHintRegions[entranceId];
}

function getInitialState(
    mapModel: MapModel,
    areaGraph: AreaGraph,
    exits: Record<string, ExitMapping>,
): InterfaceState {
    const startingExit = exits['\\Start'];

    // If the user needs to select a starting entrance, prompt first
    if (startingExit.canAssign && !startingExit.entrance) {
        return {
            type: 'choosingEntrance',
            mapView: undefined,
            exitId: startingExit.exit.id,
            previousHintRegion: undefined,
        };
    }

    // Otherwise select the starting area
    if (startingExit.entrance) {
        const hintRegion = getHintRegionForEntrance(
            startingExit.entrance.id,
            areaGraph,
        );
        const result = getOwningProvince(mapModel, hintRegion);
        const mapView = result.type === 'ok' ? result.result : undefined;
        return {
            type: 'viewingChecks',
            mapView,
            hintRegion,
        };
    }
    return {
        type: 'viewingChecks',
        mapView: undefined,
        hintRegion: undefined,
    };
}

function interfaceReducer(
    mapModel: MapModel,
    areaGraph: AreaGraph,
    exits: Record<string, ExitMapping>,
) {
    return (
        state_: InterfaceStateInternal,
        action: InterfaceAction,
    ): InterfaceStateInternal => {
        // Make sure initial state is resolved
        const state =
            state_.type === 'initial'
                ? getInitialState(mapModel, areaGraph, exits)
                : state_;
        switch (action.type) {
            case 'selectMapView': {
                if (state.type === 'choosingEntrance') {
                    return {
                        ...state,
                        mapView: action.province,
                    };
                }
                return {
                    type: 'viewingChecks',
                    mapView: action.province,
                    hintRegion:
                        state.type === 'viewingChecks'
                            ? state.hintRegion
                            : undefined,
                };
            }

            case 'selectHintRegion': {
                const owningProvince = getOwningProvince(
                    mapModel,
                    action.hintRegion,
                );
                return {
                    type: 'viewingChecks',
                    mapView:
                        owningProvince.type === 'ok'
                            ? owningProvince.result
                            : state.mapView,
                    hintRegion: action.hintRegion,
                };
            }
            case 'leaveMapView':
                return {
                    ...state,
                    mapView: undefined,
                };
            case 'chooseEntrance':
                return {
                    type: 'choosingEntrance',
                    exitId: action.exitId,
                    mapView: state.mapView,
                    previousHintRegion:
                        state.type === 'viewingChecks'
                            ? state.hintRegion
                            : undefined,
                };
            case 'cancelChooseEntrance': {
                const hintRegion = action.selectedEntrance
                    ? getHintRegionForEntrance(
                          action.selectedEntrance,
                          areaGraph,
                      )
                    : state.type === 'choosingEntrance'
                      ? state.previousHintRegion
                      : undefined;
                const owningProvince = hintRegion
                    ? getOwningProvince(mapModel, hintRegion)
                    : undefined;
                return {
                    type: 'viewingChecks',
                    hintRegion,
                    mapView:
                        owningProvince?.type === 'ok'
                            ? owningProvince.result
                            : state.mapView,
                };
            }
        }
    };
}

const initialMapState: InterfaceStateInternal = {
    type: 'initial',
};

export function useTrackerInterfaceReducer(): [
    InterfaceState,
    React.Dispatch<InterfaceAction>,
] {
    const mapModel = useSelector(mapModelSelector);
    const areaGraph = useSelector(areaGraphSelector);
    const exits = useSelector(exitsByIdSelector);
    const [internalTrackerState, dispatch] = useReducer(
        interfaceReducer(mapModel, areaGraph, exits),
        undefined,
        () => initialMapState,
    );

    if (internalTrackerState.type === 'initial') {
        // Resolve initial state
        return [getInitialState(mapModel, areaGraph, exits), dispatch];
    }

    return [internalTrackerState, dispatch];
}
