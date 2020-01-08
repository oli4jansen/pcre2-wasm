import assert from 'assert'

import PCRE from '../src/lib/PCRE'

before(async function () {
  await PCRE.init()
})

describe(`PCRE single matching`, function () {
  describe(`match()`, function () {
    let re
    const subject = 'fee fi fo fum'
    const pattern = '(?<first_f>f)(?<the_rest>[a-z]+)'

    beforeEach(function () {
      re = new PCRE(pattern)
    })

    afterEach(function () {
      re.destroy()
    })

    it(`should return null on no match`, function () {
      const matches = re.match('bar')
      assert.strictEqual(matches, null)
    })

    it(`should return array with matching string on match`, function () {
      const matches = re.match(subject)

      assert.strictEqual(typeof matches, 'object')
      assert.strictEqual(matches[0].match, 'fee')
    })

    it(`should return named groups`, () => {
      const matches = re.match(subject)

      assert('first_f' in matches)
      assert('the_rest' in matches)
    })

    it(`should return numbered groups`, () => {
      const matches = re.match(subject)
      assert.strictEqual(matches.length, 3)
    })

    it(`should return null if start offset is > subject length`, function () {
      const matches = re.match(subject, subject.length + 1)
      assert.strictEqual(matches, null)
    })

    it(`should throw an error code on invalid utf16 string`, function () {
      const re = new PCRE('a')
      assert.throws(() => {
        re.match('\uD800')  // unpaired lead surrogate
      }, /PCRE2_ERROR_UTF16_/)
      re.destroy()
    })
  })
})