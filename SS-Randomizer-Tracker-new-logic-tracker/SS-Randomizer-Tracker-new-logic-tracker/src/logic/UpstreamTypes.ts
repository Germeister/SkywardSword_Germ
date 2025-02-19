import type { OptionValue } from '../permalink/SettingsTypes';

export type TimeOfDayInt =
    | /** DayOnly */ 1
    | /** NightOnly */ 2
    | /** Both */ 3;

export interface RawArea {
    name: string;
    abstract: boolean;
    can_sleep: boolean;
    hint_region: string | null;
    allowed_time_of_day: TimeOfDayInt;
    entrances: string[] | undefined;
    exits: Record<string, string> | undefined;
    sub_areas: {
        [subAreaName: string]: RawArea;
    };
    locations: Record<string, string> | undefined;
}

export interface RawEntrance {
    type: 'entrance';
    'can-start-at': boolean | undefined;
    allowed_time_of_day: TimeOfDayInt;
    subtype: string | undefined;
    stage: string | undefined;
    province: string | undefined;
    short_name: string;
}

export interface RawExit {
    type: 'exit';
    allowed_time_of_day: TimeOfDayInt;
    vanilla: string | undefined;
    stage: string | undefined;
    short_name: string;
    'pillar-province': string | undefined;
}

export interface RawCheck {
    type: string | null;
    short_name: string;
    'original item': string;
}

export interface ExitLink {
    exit_from_outside: string | string[];
    exit_from_inside: string;
}

export interface RawLogic {
    items: string[];
    checks: Record<string, RawCheck>;
    /** LocationId -> Area - Location Name */
    gossip_stones: Record<string, string>;
    exits: Record<string, RawExit>;
    entrances: Record<string, RawEntrance>;
    areas: RawArea;
    linked_entrances: {
        silent_realms: {
            [realm: string]: ExitLink;
        };
        dungeons: {
            [dungeon: string]: ExitLink;
        };
    };
    dungeon_completion_requirements: {
        [dungeon: string]: string;
    };
}

export interface RawPresets {
    [presetName: string]: Record<string, OptionValue>;
}
