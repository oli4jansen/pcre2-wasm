import assert from 'assert'

import PCRE from '../src/lib/PCRE'

describe(`PCRE`, function () {
  describe(`init()`, function () {
    it(`should not throw`, async function () {
      this.timeout(5000)
      await PCRE.init()
    })
  })

  describe(`version()`, function () {
    it(`should return the version of the PCRE2 library`, function () {
      const version = PCRE.version()
      assert.strictEqual(version, `10.31 2018-02-12`)
    })
  })

  describe(`constructor()`, function () {
    it(`should not throw`, function () {
      const re = new PCRE('aaa', 'i')
      re.destroy()
    })

    it(`should throw on malformed pattern`, function () {
      assert.throws(() => new PCRE('a(a'), /missing closing parenthesis/)
    })

    it(`should throw an error with correct offset property`, function () {
      let err
      try { new PCRE('a)aa') }
      catch (e) { err = e }
      assert.strictEqual(err.offset, 1)
    })
  })

  describe(`instance property`, function () {
    describe(`match()`, function () {
      let re
      const subject = 'fe fi fo fum';

      beforeEach(function () {
        re = new PCRE('(?<first_f>f)(?<the_rest>[a-z]+)')
      })

      afterEach(function () {
        re.destroy()
      })

      it(`should return null on no match`, function () {
        const matches = re.match('bar')
        assert.strictEqual(matches, null)
      })

      it(`should return array with matching string on match`, function () {
        const matches = re.match(subject);

        assert.strictEqual(matches[0].match, 'fe');
      })

      it(`should return named groups`, () => {
        const matches = re.match(subject);

        assert('first_f' in matches);
        assert('the_rest' in matches);
      })

      it(`should return numbered groups`, () => {
        const matches = re.match(subject);
        assert.strictEqual(matches.length, 3);
      })
    })
  })
})
