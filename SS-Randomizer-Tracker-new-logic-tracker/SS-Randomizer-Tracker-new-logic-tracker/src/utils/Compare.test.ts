import { chainComparators, compareBy } from './Compare';

test('compareBy', () => {
    const arr = [14, 25, 39, 41, 83, 65, 10, 53];
    expect([...arr].sort(compareBy((val) => val % 10))).toMatchInlineSnapshot(`
      [
        10,
        41,
        83,
        53,
        14,
        25,
        65,
        39,
      ]
    `);
});

test('chainComparators', () => {
    const arr = [14, 25, 38, 41, 53, 65, 10, 83];
    expect(
        [...arr].sort(
            chainComparators(
                compareBy((val) => val % 2),
                compareBy((val) => val % 10),
            ),
        ),
    ).toMatchInlineSnapshot(`
      [
        10,
        14,
        38,
        41,
        53,
        83,
        25,
        65,
      ]
    `);
});
