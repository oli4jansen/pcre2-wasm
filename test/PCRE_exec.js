import assert from 'assert'

import PCRE from '../src/lib/PCRE'

before(async function () {
  await PCRE.init()
})

describe(`PCRE exec`, function () {
  describe(`exec()`, function () {
    let re
    const subject = 'fee fi fo fum'
    const pattern = '(?<first_f>f)(?<the_rest>[a-z]+)'

    beforeEach(function () {
      re = new PCRE(pattern)
    })

    afterEach(function () {
      re.destroy()
    })

    it(`exec() should be same as match()`, function () {
      const match = re.match(subject)
      const exec = re.exec(subject)

      assert.deepEqual(match, exec)
    })

    it(`exec(...,'g') should be same as matchAll()`, function () {
      const matchAll = re.matchAll(subject)
      const exec = re.exec(subject, 'g')

      assert.deepEqual(matchAll, exec)
    })
  })
})