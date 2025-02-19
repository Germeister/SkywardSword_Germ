import React from 'react';
import type { Op } from '../logic/booleanlogic/BooleanExpression';
import type {
    RootTooltipExpression,
    TooltipExpression,
} from '../tooltips/TooltipExpression';
import { addDividers } from '../utils/React';

export default function RequirementsTooltip({
    requirements,
}: {
    requirements: RootTooltipExpression | undefined;
}) {
    return (
        <>
            {requirements ? <TopLevelExpr expr={requirements} /> : 'Loading...'}
        </>
    );
}

function TopLevelExpr({ expr }: { expr: RootTooltipExpression }) {
    if (expr.items.length <= 1) {
        return <Expr expr={expr.items[0]} parentOp={undefined} />;
    }
    return (
        <ul>
            {expr.items.map((item, idx) => (
                <li key={idx}>
                    <Expr expr={item} parentOp={undefined} />
                </li>
            ))}
        </ul>
    );
}

function Expr({
    expr,
    parentOp,
}: {
    expr: TooltipExpression;
    parentOp: Op | undefined;
}): React.ReactElement {
    if (expr.type === 'expr') {
        return (
            <>
                {parentOp !== undefined && '('}
                {addDividers(
                    expr.items.map((val, idx) => (
                        <Expr key={idx} expr={val} parentOp={expr.op} />
                    )),
                    <>{` ${expr.op} `}</>,
                )}
                {parentOp !== undefined && ')'}
            </>
        );
    } else {
        return (
            <span
                style={{
                    color: `var(--scheme-${expr.logicalState})`,
                }}
            >
                {expr.item}
            </span>
        );
    }
}
