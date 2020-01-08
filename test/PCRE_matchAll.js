import assert from 'assert'

import PCRE from '../src/lib/PCRE'

before(async function () {
  await PCRE.init()
})

describe(`PCRE multiple matching`, function () {
  describe(`matchAll()`, function () {
    let re
    const subject = 'fe fi fo fum'
    const pattern = '(?<first_f>f)(?<the_rest>[a-z]+)'

    beforeEach(function () {
      re = new PCRE(pattern)
    })

    afterEach(function () {
      re.destroy()
    })

    it(`should return empty array on no match`, function () {
      const matches = re.matchAll('bar')
      assert.deepEqual(matches, [])
    })

    it(`should return array with matching string on match`, function () {
      const matches = re.matchAll(subject)

      assert.strictEqual(matches[0][0].match, 'fe')
      assert.strictEqual(matches[1][0].match, 'fi')
      assert.strictEqual(matches[2][0].match, 'fo')
      assert.strictEqual(matches[3][0].match, 'fum')
    })

    it(`should throw an error code on invalid utf16 string`, function () {
      const re = new PCRE('a')
      assert.throws(() => {
        re.matchAll('\uD800')  // unpaired lead surrogate
      }, /PCRE2_ERROR_UTF16_/)
      re.destroy()
    })
  })
})