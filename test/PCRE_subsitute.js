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
  })
})