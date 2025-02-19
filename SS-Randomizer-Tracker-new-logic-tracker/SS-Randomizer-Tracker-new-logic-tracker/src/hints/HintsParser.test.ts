import { logicSelector } from '../logic/Selectors';
import { createTestLogic } from '../testing/TestingUtils';
import { parseHintsText } from './HintsParser';

describe('hints parser', () => {
    const tester = createTestLogic();
    const parse = (text: string) =>
        parseHintsText(text, tester.readSelector(logicSelector).hintRegions);

    beforeAll(tester.initialize);
    beforeEach(tester.reset);

    it('parses sots hints', () => {
        expect(parse('upper sots \n boko sots')).toMatchInlineSnapshot(`
          {
            "Bokoblin Base": [
              {
                "type": "sots",
              },
            ],
            "Upper Skyloft": [
              {
                "type": "sots",
              },
            ],
          }
        `);
    });

    it('parses barren hints', () => {
        expect(parse('flooded dead \n faron woods barren'))
            .toMatchInlineSnapshot(`
          {
            "Faron Woods": [
              {
                "type": "barren",
              },
            ],
            "Flooded Faron Woods": [
              {
                "type": "barren",
              },
            ],
          }
        `);
    });

    it('refuses ambiguous hints', () => {
        expect(parse('faron barren')).toMatchInlineSnapshot(`{}`);
    });

    it('parses path hints', () => {
        expect(parse('fs -> g2')).toMatchInlineSnapshot(`
          {
            "Fire Sanctuary": [
              {
                "index": 5,
                "type": "path",
              },
            ],
          }
        `);

        expect(parse('Skyview -> moldy')).toMatchInlineSnapshot(`
          {
            "Skyview": [
              {
                "index": 2,
                "type": "path",
              },
            ],
          }
        `);
    });

    it('parses item hints', () => {
        expect(parse('beetle in eldin silent')).toMatchInlineSnapshot(`
          {
            "Eldin Silent Realm": [
              {
                "item": "Progressive Beetle",
                "type": "item",
              },
            ],
          }
        `);

        expect(parse('triforce in Desert')).toMatchInlineSnapshot(`
          {
            "Lanayru Desert": [
              {
                "item": "Triforce",
                "type": "item",
              },
            ],
          }
        `);
    });
});
