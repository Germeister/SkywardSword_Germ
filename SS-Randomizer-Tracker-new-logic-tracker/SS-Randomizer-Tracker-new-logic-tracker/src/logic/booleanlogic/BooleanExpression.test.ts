import BooleanExpression from './BooleanExpression';

test('flattenFalse', () => {
    const expr = new BooleanExpression([], 'or');

    expect(expr.flatten()).toMatchInlineSnapshot(`
      BooleanExpression {
        "items": [],
        "type": "or",
      }
    `);
});

test('flattenAnother', () => {
    const expr = new BooleanExpression(
        [new BooleanExpression([], 'and')],
        'or',
    );

    expect(expr.flatten()).toMatchInlineSnapshot(`
      BooleanExpression {
        "items": [],
        "type": "and",
      }
    `);
});
