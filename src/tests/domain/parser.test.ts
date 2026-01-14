import { describe, it, expect } from 'vitest';
import { parseImportText } from '../../domain/parser';

describe('Text Parser - parseImportText', () => {
    describe('Basic parsing', () => {
        it('should parse simple separator (=)', () => {
            const input = 'hello = cześć';

            const result = parseImportText(input);

            expect(result).toEqual([{ front: 'hello', back: 'cześć' }]);
        });

        it('should support multiple separators (=, :, -, tab)', () => {
            const input = 'cat:kot\ndog-pies\nbird = ptak';

            const result = parseImportText(input);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ front: 'cat', back: 'kot' });
            expect(result[1]).toEqual({ front: 'dog', back: 'pies' });
            expect(result[2]).toEqual({ front: 'bird', back: 'ptak' });
        });
    });

    describe('Edge cases', () => {
        it('should ignore empty lines', () => {
            const input = 'hello=hi\n\n\n\ncat=kot';

            const result = parseImportText(input);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ front: 'hello', back: 'hi' });
            expect(result[1]).toEqual({ front: 'cat', back: 'kot' });
        });

        it('should ignore lines without valid separators', () => {
            const input = 'no separator here\nhello=world';

            const result = parseImportText(input);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ front: 'hello', back: 'world' });
        });

        it('should handle very long strings', () => {
            const longFront = 'a'.repeat(1000);
            const longBack = 'b'.repeat(1000);
            const input = `${longFront}=${longBack}`;

            const result = parseImportText(input);

            expect(result).toHaveLength(1);
            expect(result[0].front).toHaveLength(1000);
            expect(result[0].back).toHaveLength(1000);
        });

        it('should handle special characters', () => {
            const input = 'c++:C plus plus\n$var=variable\n@mention:at sign';

            const result = parseImportText(input);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ front: 'c++', back: 'C plus plus' });
            expect(result[1]).toEqual({ front: '$var', back: 'variable' });
            expect(result[2]).toEqual({ front: '@mention', back: 'at sign' });
        });

        it('should handle unicode and emoji', () => {
            const input = '🐱=cat\nśnieg=snow\n日本=Japan';

            const result = parseImportText(input);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ front: '🐱', back: 'cat' });
            expect(result[1]).toEqual({ front: 'śnieg', back: 'snow' });
            expect(result[2]).toEqual({ front: '日本', back: 'Japan' });
        });
    });
});
