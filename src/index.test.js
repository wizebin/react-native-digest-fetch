import { expect } from 'chai';
import { getNextNonceId, setNextNonceId, quoteIfRelevant } from './index';

describe('digest fetch', () => {
  describe('nonce', () => {
    it('returns nonces as expected', () => {
      let prev = getNextNonceId();
      for(let a = 0; a < 11; a++) {
        const temp = getNextNonceId();
        expect(temp).have.lengthOf(8);
        expect(parseInt(temp)).equal(parseInt(prev) + 1);
        prev = temp;
      }
    });

    it('rolls over at 9 digits', () => {
      setNextNonceId(99999998);
      expect(getNextNonceId()).equal('99999999');
      expect(getNextNonceId()).equal('00000000');
    });
  });

  describe('quoteIfRelevant', () => {
    it('quotes everything but the two nonce values', () => {
      const testObject = {
        nc: 'hello',
        hello: 'goodbye',
        '1nc': 'bazonga',
        nc1: 'bazinga',
        qop: 'unquoted',
        qop1: 'isquoted',
        '1qop': 'alsoquoted',
      };
      expect(quoteIfRelevant(testObject, 'hello')).equal('"goodbye"');
      expect(quoteIfRelevant(testObject, 'nc')).equal('hello');
      expect(quoteIfRelevant(testObject, 'nc1')).equal('"bazinga"');
      expect(quoteIfRelevant(testObject, '1nc')).equal('"bazonga"');
      expect(quoteIfRelevant(testObject, 'qop')).equal('unquoted');
      expect(quoteIfRelevant(testObject, 'qop1')).equal('"isquoted"');
      expect(quoteIfRelevant(testObject, '1qop')).equal('"alsoquoted"');
    })
  })
});
