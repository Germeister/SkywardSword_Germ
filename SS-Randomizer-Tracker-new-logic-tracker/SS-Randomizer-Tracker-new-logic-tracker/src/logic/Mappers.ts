import type { OptionDefs, TypedOptions } from '../permalink/SettingsTypes';
import { appDebug } from '../utils/Debug';
import type { Requirements } from './bitlogic/BitLogic';
import { BitVector } from './bitlogic/BitVector';
import { LogicalExpression } from './bitlogic/LogicalExpression';
import { itemName } from './Inventory';
import { type ExitMapping, dungeonNames } from './Locations';
import type { Logic } from './Logic';
import { LogicBuilder } from './LogicBuilder';
import {
    completeTriforceReq,
    gotOpeningReq,
    gotRaisingReq,
    hordeDoorReq,
    impaSongCheck,
    runtimeOptions,
    swordsToAdd,
} from './ThingsThatWouldBeNiceToHaveInTheDump';
import {
    dungeonCompletionItems,
    sothItemReplacement,
    sothItems,
    triforceItemReplacement,
    triforceItems,
} from './TrackerModifications';

export const TimeOfDay = {
    DayOnly: 1,
    NightOnly: 2,
    Both: 3,
} as const;
export type TTimeOfDay = typeof TimeOfDay;

export function mapSettings(
    logic: Logic,
    options: OptionDefs,
    settings: TypedOptions,
    exits: ExitMapping[],
    requiredDungeons: string[],
) {
    const requirements: Requirements = {};
    const b = new LogicBuilder(logic.allItems, logic.itemLookup, requirements);

    for (const option of runtimeOptions) {
        const [item, command, expect] = option;
        const val = settings[command];
        const match =
            val !== undefined &&
            (typeof expect === 'function' ? expect(val) : expect === val);
        if (match) {
            appDebug('setting', item);
            b.set(item, b.true());
        }
    }

    // https://github.com/NindyBK/ssrnppbuild/pull/1
    if (logic.itemBits['Lanayru Mining Facility Unrequired'] !== undefined) {
        for (const dungeon of dungeonNames) {
            if (!requiredDungeons.includes(dungeon)) {
                b.trySet(`${dungeon} Unrequired`, b.true());
            } else {
                b.trySet(`${dungeon} Required`, b.true());
            }
        }
    }

    for (const option of options) {
        if (
            option.type === 'multichoice' &&
            (option.command === 'enabled-tricks-glitched' ||
                option.command === 'enabled-tricks-bitless')
        ) {
            const vals = settings[option.command];
            for (const option of vals) {
                b.set(`${option} Trick`, b.true());
            }
        }
    }

    const raiseGotExpr =
        settings['got-start'] === 'Raised'
            ? b.true()
            : b.singleBit(impaSongCheck);
    const neededSwords = swordsToAdd[settings['got-sword-requirement']];
    let openGotExpr = b.singleBit(`Progressive Sword x ${neededSwords}`);
    let hordeDoorExpr = settings['triforce-required']
        ? b.singleBit(completeTriforceReq)
        : b.true();

    const allRequiredDungeonsBits = requiredDungeons.reduce((acc, dungeon) => {
        if (dungeon !== 'Sky Keep') {
            acc.setBit(logic.itemBits[dungeonCompletionItems[dungeon]]);
        }
        return acc;
    }, new BitVector());
    const dungeonsExpr = new LogicalExpression([allRequiredDungeonsBits]);

    if (settings['got-dungeon-requirement'] === 'Required') {
        openGotExpr = openGotExpr.and(dungeonsExpr);
    } else if (settings['got-dungeon-requirement'] === 'Unrequired') {
        hordeDoorExpr = hordeDoorExpr.and(dungeonsExpr);
    }

    b.set(gotOpeningReq, openGotExpr);
    b.set(gotRaisingReq, raiseGotExpr);
    b.set(hordeDoorReq, hordeDoorExpr);

    const mapConnection = (from: string, to: string) => {
        const exitArea = logic.areaGraph.areasByExit[from];
        const exitExpr = b.singleBit(from);

        let dayReq: LogicalExpression;
        let nightReq: LogicalExpression;

        if (exitArea.availability === 'abstract') {
            dayReq = exitExpr;
            nightReq = exitExpr;
        } else if (exitArea.availability === TimeOfDay.Both) {
            dayReq = exitExpr.and(b.singleBit(b.day(exitArea.id)));
            nightReq = exitExpr.and(b.singleBit(b.night(exitArea.id)));
        } else if (exitArea.availability === TimeOfDay.DayOnly) {
            dayReq = exitExpr;
            nightReq = b.false();
        } else if (exitArea.availability === TimeOfDay.NightOnly) {
            dayReq = b.false();
            nightReq = exitExpr;
        } else {
            throw new Error('bad ToD');
        }

        const entranceDef = logic.areaGraph.entrances[to];
        if (entranceDef.allowed_time_of_day === TimeOfDay.Both) {
            b.addAlternative(b.day(to), dayReq);
            b.addAlternative(b.night(to), nightReq);
        } else if (entranceDef.allowed_time_of_day === TimeOfDay.DayOnly) {
            b.addAlternative(to, dayReq);
        } else if (entranceDef.allowed_time_of_day === TimeOfDay.NightOnly) {
            b.addAlternative(to, nightReq);
        } else {
            throw new Error('bad ToD');
        }
    };

    for (const mapping of exits) {
        if (mapping.entrance) {
            mapConnection(mapping.exit.id, mapping.entrance.id);
        }
    }

    return requirements;
}

export function mapInventory(logic: Logic, itemCounts: Record<string, number>) {
    const requirements: Requirements = {};
    const b = new LogicBuilder(logic.allItems, logic.itemLookup, requirements);

    for (const [item, count] of Object.entries(itemCounts)) {
        if (
            count === undefined ||
            item === 'Sailcloth' ||
            item === 'Tumbleweed'
        ) {
            continue;
        }
        if (item === sothItemReplacement) {
            for (let i = 1; i <= count; i++) {
                b.set(sothItems[i - 1], b.true());
            }
        } else if (item === triforceItemReplacement) {
            for (let i = 1; i <= count; i++) {
                b.set(triforceItems[i - 1], b.true());
            }
        } else {
            for (let i = 1; i <= count; i++) {
                b.set(itemName(item, i), b.true());
            }
        }
    }

    return requirements;
}
