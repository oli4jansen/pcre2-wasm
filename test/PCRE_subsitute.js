import assert from 'assert'

import PCRE from '../src/lib/PCRE'

before(async function () {
  await PCRE.init()
})

describe(`PCRE single substitution`, function () {
  describe(`substitute()`, function () {
    let re
    const subject = "hello there!"
    const pattern = "(there)"
    const replacement = "world"

    beforeEach(function () {
      re = new PCRE(pattern)
    })

    afterEach(function () {
      re.destroy()
    })

    it(`should replace "there" with "world"`, function () {
      const result = re.substitute(subject, replacement)

      assert.strictEqual(result, "hello world!")
    })

    it(`should replace "there" with "world", but only once`, function () {
      const result = re.substitute("hello there, there!", replacement)

      assert.strictEqual(result, "hello world, there!")
    })

    it(`should return the subject if no subtitutions are done`, function () {
      const subject = "no matches here"
      const result = re.substitute(subject, replacement)

      assert.strictEqual(result, subject)
    })

    it(`should return error if the output buffer gets too big`, function () {
      const subject = 'a'.repeat(1024 * 1024)
      const re = new PCRE('a')
      const result = re.substitute(subject, 'bb')
      re.destroy()

      assert.strictEqual(result, -48)  // PCRE2_ERROR_NOMEMORY
    })

    it(`should handle resizing of the output buffer transparently`, function () {
      const subject = 'a'
      const re = new PCRE('a')
      const result = re.substitute(subject, 'bbbb')
      re.destroy()

      assert.strictEqual(result, 'bbbb')  // PCRE2_ERROR_NOMEMORY
    })

    it(`should return an error code on invalid utf16 string`, function () {
      const subject = 'a'
      const re = new PCRE('a')
      assert.throws(() => {
        re.substitute(subject, '\uD800') // unpaired lead surrogate      
      }, /PCRE2_ERROR_UTF16_/)
      re.destroy()
    })

    it(`should return null if start offset is > subject length`, function () {
      const matches = re.substitute(subject, "a", subject.length + 1)
      assert.strictEqual(matches, null)
    })

    it(`should use back references correctly`, function () {
      const subject = "first second"
      const re = new PCRE("^([a-z]+) ([a-z]+)$")
      const result = re.substitute(subject, "$2 $1")
      re.destroy()

      assert.strictEqual(result, "second first")
    })

    it(`should handle case-insensitivity`, function () {
      const re = new PCRE("a", "i")
      const result = re.substitute("A", "b")
      re.destroy()

      assert.strictEqual(result, "b")
    })

    // covers issue 7 (https://github.com/stephen-riley/regexworkbench/issues/7)
    it(`should handle extended substitution simple case conversion`, function () {
      const re = new PCRE("ID_OSOB_([A-Z_a-złóźżćęą]+)")
      const subject = "ID_OSOB_Bułgaria"
      const replace = 'ID_OSOB_\\U$1(""),'
      const result = re.substitute(subject, replace)
      re.destroy()

      assert.strictEqual(result, 'ID_OSOB_BUŁGARIA(""),')
    })
  })
})