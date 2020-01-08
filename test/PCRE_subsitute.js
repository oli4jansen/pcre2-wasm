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
      const result = re.substitute(subject, '\uD800') // unpaired lead surrogate
      re.destroy()

      assert.ok(result < 0)
    })

    it(`should return null if start offset is > subject length`, function () {
      const matches = re.substitute(subject, "a", subject.length + 1)
      assert.strictEqual(matches, null)
    })
  })
})