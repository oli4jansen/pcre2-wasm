import assert from 'assert'

import PCRE from '../src/lib/PCRE'

before(async function () {
  await PCRE.init()
})

describe(`PCRE multiple substitutions`, function () {
  describe(`substituteAll()`, function () {
    let re
    const pattern = "(there)"
    const replacement = "world"

    beforeEach(function () {
      re = new PCRE(pattern)
    })

    afterEach(function () {
      re.destroy()
    })

    it(`should replace all "there" instances with "world"`, function () {
      const result = re.substituteAll("hello there, there!", replacement)

      assert.strictEqual(result, "hello world, world!")
    })
  })
})