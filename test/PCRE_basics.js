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

  describe(`createMatchData()`, function () {
    it(`should allocate a match data block`, function () {
      const re = new PCRE('aaa')

      const matchDataPtr = re.createMatchData()
      assert(matchDataPtr)
      if (matchDataPtr) {
        re.destroyMatchData()
      }
      re.destroy()
    })
  })

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
  })

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
  })

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
  })
})