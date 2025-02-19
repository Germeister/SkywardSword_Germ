import type { RootTooltipExpression } from '../../tooltips/TooltipExpression';

export const impossibleTooltip: RootTooltipExpression = {
    op: 'and',
    type: 'expr',
    items: [
        {
            type: 'item',
            item: 'Impossible (discover an entrance first)',
            logicalState: 'outLogic',
        },
    ],
};

export const exampleTooltip: RootTooltipExpression = {
    op: 'and',
    type: 'expr',
    items: [
        {
            type: 'item',
            item: 'Emerald Tablet',
            logicalState: 'inLogic',
        },
        {
            type: 'expr',
            op: 'or',
            items: [
                {
                    type: 'item',
                    item: 'Practice Sword',
                    logicalState: 'outLogic',
                },
                {
                    type: 'expr',
                    op: 'and',
                    items: [
                        {
                            type: 'item',
                            item: 'Beetle',
                            logicalState: 'inLogic',
                        },
                        {
                            type: 'expr',
                            op: 'or',
                            items: [
                                {
                                    type: 'item',
                                    item: 'Bomb Bag',
                                    logicalState: 'outLogic',
                                },
                                {
                                    type: 'item',
                                    item: 'Bow',
                                    logicalState: 'inLogic',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

export const semiLogicTooltip: RootTooltipExpression = {
    op: 'and',
    type: 'expr',
    items: [
        {
            type: 'item',
            item: 'Goddess Cube on top of Skyview',
            logicalState: 'semiLogic',
        },
        {
            type: 'expr',
            op: 'or',
            items: [
                {
                    type: 'item',
                    item: 'Beetle',
                    logicalState: 'outLogic',
                },
                {
                    type: 'item',
                    item: 'Bow',
                    logicalState: 'outLogic',
                },
                {
                    type: 'item',
                    item: 'Clawshots',
                    logicalState: 'inLogic',
                },
                {
                    type: 'item',
                    item: 'Slingshot',
                    logicalState: 'outLogic',
                },
            ],
        },
    ],
};

export const trickLogicTooltip: RootTooltipExpression = {
    op: 'and',
    type: 'expr',
    items: [
        {
            type: 'item',
            item: 'Ruby Tablet',
            logicalState: 'inLogic',
        },
        {
            type: 'expr',
            op: 'or',
            items: [
                {
                    type: 'item',
                    item: 'Bow',
                    logicalState: 'outLogic',
                },
                {
                    type: 'item',
                    item: 'Slingshot',
                    logicalState: 'outLogic',
                },
                {
                    type: 'item',
                    item: 'Stuttersprint Trick',
                    logicalState: 'trickLogic',
                },
            ],
        },
    ],
};
