import { keyBy } from 'es-toolkit';
import { BitVector } from './bitlogic/BitVector';
import type { ExitMapping } from './Locations';
import type { AreaGraph } from './Logic';
import { TimeOfDay, type TTimeOfDay } from './Mappers';

/*
The pathfinding algorithm starts at the Start entrance with its specific time of day,
and then walks the area graph (potentially with its requirements).
*/

type SpecificTimeOfDay = TTimeOfDay['DayOnly'] | TTimeOfDay['NightOnly'];

export interface ExplorationNode {
    area: string;
    timeOfDay: SpecificTimeOfDay;
    parent: ExplorationNode | undefined;
    edge: string | undefined;
}

function nodeKey(node: ExplorationNode) {
    return `${node.area}_${node.timeOfDay}`;
}

export function exploreAreaGraph(
    areaGraph: AreaGraph,
    exits: ExitMapping[],
    logicBits: BitVector,
) {
    const mappingsByExitId = keyBy(exits, (exit) => exit.exit.id);
    const startingEntrance = mappingsByExitId['\\Start']?.entrance;
    if (!startingEntrance) {
        return undefined;
    }
    const startingEntranceDef = areaGraph.entrances[startingEntrance.id];
    if (
        startingEntranceDef.allowed_time_of_day !== TimeOfDay.DayOnly &&
        startingEntranceDef.allowed_time_of_day !== TimeOfDay.NightOnly
    ) {
        return undefined;
    }
    const startingNode: ExplorationNode = {
        area: areaGraph.areasByEntrance[startingEntrance.id].id,
        timeOfDay: startingEntranceDef.allowed_time_of_day,
        parent: undefined,
        edge: undefined,
    };
    const visitedNodes: Record<string, ExplorationNode> = {};
    visitedNodes[nodeKey(startingNode)] = startingNode;
    const workList = [startingNode];

    const reachableChecks: Record<string, ExplorationNode> = {};

    while (workList.length) {
        const workItem = workList.pop()!;
        const area = areaGraph.areas[workItem.area];
        const currentTimeOfDay = workItem.timeOfDay;
        if (area.canSleep) {
            const oppositeTimeOfDay: SpecificTimeOfDay =
                currentTimeOfDay === TimeOfDay.DayOnly
                    ? TimeOfDay.NightOnly
                    : TimeOfDay.DayOnly;
            const nextNode = {
                timeOfDay: oppositeTimeOfDay,
                area: area.id,
                parent: workItem,
                edge: 'Sleep',
            };
            if (!visitedNodes[nodeKey(nextNode)]) {
                visitedNodes[nodeKey(nextNode)] = nextNode;
                workList.unshift(nextNode);
            }
        }
        for (const location of area.locations) {
            const condition =
                location.areaAvailability === TimeOfDay.Both
                    ? currentTimeOfDay === TimeOfDay.DayOnly
                        ? location.requirements.day
                        : location.requirements.night
                    : location.requirements;
            switch (location.type) {
                case 'logicalExit': {
                    const destArea = areaGraph.areas[location.toArea];
                    const nextNode = {
                        timeOfDay: currentTimeOfDay,
                        area: destArea.id,
                        parent: workItem,
                        edge: undefined,
                    };
                    if (
                        !visitedNodes[nodeKey(nextNode)] &&
                        (destArea.availability === TimeOfDay.Both ||
                            destArea.availability === currentTimeOfDay) &&
                        condition.eval(logicBits)
                    ) {
                        visitedNodes[nodeKey(nextNode)] = nextNode;
                        workList.unshift(nextNode);
                    }
                    break;
                }
                case 'mapExit': {
                    if (
                        !reachableChecks[location.id] &&
                        condition.eval(logicBits)
                    ) {
                        reachableChecks[location.id] = workItem;
                    }
                    const entrance = mappingsByExitId[location.id]?.entrance;
                    if (entrance) {
                        const destArea = areaGraph.areasByEntrance[entrance.id];
                        const nextNode = {
                            timeOfDay: currentTimeOfDay,
                            area: destArea.id,
                            parent: workItem,
                            edge: areaGraph.exits[location.id].short_name,
                        };

                        if (
                            !visitedNodes[nodeKey(nextNode)] &&
                            (destArea.availability === TimeOfDay.Both ||
                                destArea.availability === currentTimeOfDay)
                        ) {
                            visitedNodes[nodeKey(nextNode)] = nextNode;
                            workList.unshift(nextNode);
                        }
                    }
                    break;
                }
                case 'check': {
                    if (
                        !reachableChecks[location.id] &&
                        condition.eval(logicBits)
                    ) {
                        reachableChecks[location.id] = workItem;
                    }
                    break;
                }
                case 'virtualLocation': {
                    // Nothing to do, virtual locations are resolved through `inLogicBits`
                    break;
                }
            }
        }
    }

    return reachableChecks;
}
