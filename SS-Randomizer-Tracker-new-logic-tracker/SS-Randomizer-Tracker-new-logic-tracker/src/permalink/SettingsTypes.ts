import type { LogicOption } from '../options/Options';
import type { GeneratedOptions } from './GeneratedOptions';

export type BaseOption = {
    permalink: boolean | undefined;
    help: string;
    name: string;
    command: OptionsCommand;
};

export type BooleanOption = BaseOption & {
    type: 'boolean';
    default: boolean;
};

export type SingleChoiceOption = BaseOption & {
    type: 'singlechoice';
    choices: string[];
    bits: number;
    default: string;
};

export type MultiChoiceOption = BaseOption & {
    type: 'multichoice';
    choices: string[];
    default: string[];
};

export type IntOption = BaseOption & {
    type: 'int';
    min: number;
    max: number;
    bits: number;
    default: number;
};

export type Option =
    | BooleanOption
    | SingleChoiceOption
    | MultiChoiceOption
    | IntOption;

export type OptionDefs = Option[];

export type OptionValue = string | string[] | number | boolean;
export type OptionType = Option['type'];
export type OptionsCommand = keyof AllTypedOptions;

export interface AllTypedOptions
    extends Omit<
        GeneratedOptions,
        'rupeesanity' | 'shopsanity' | 'randomize-entrances' | 'logic-mode'
    > {
    rupeesanity: GeneratedOptions['rupeesanity'] | 'Vanilla';

    // Bizzare Bazaar splits Shopsanity into three settings
    // https://github.com/ssrando/ssrando/pull/442
    shopsanity: GeneratedOptions['shopsanity'] | 'Vanilla' | undefined;
    'beedle-shopsanity': boolean | undefined;
    'rupin-shopsanity': boolean | undefined;
    'luv-shopsanity': boolean | undefined;

    // ER renames randomize-entrances -> randomize-dungeon-entrances
    // https://github.com/ssrando/ssrando/pull/497
    'randomize-entrances':
        | GeneratedOptions['randomize-entrances']
        | 'All'
        | 'Vanilla';
    'randomize-dungeon-entrances':
        | GeneratedOptions['randomize-entrances']
        | undefined;

    // NindyBK's Preposterous Playoffs add dungeon shortcuts
    // https://github.com/NindyBK/ssrnppbuild/pull/1
    'open-shortcuts':
        | 'None'
        | 'Unrequired Dungeons Only'
        | 'All Dungeons'
        | undefined;

    // Beatable Logic Only
    // https://github.com/ssrando/ssrando/pull/599
    'logic-mode':
        | GeneratedOptions['logic-mode']
        | 'Normal'
        | 'Beatable Only'
        | 'Beatable Then Banned';
}

export type TypedOptions = Pick<AllTypedOptions, LogicOption>;
