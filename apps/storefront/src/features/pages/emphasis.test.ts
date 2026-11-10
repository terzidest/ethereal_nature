import { describe, expect, it } from 'vitest'
import { splitEmphasis } from './emphasis'

describe('splitEmphasis', () => {
  it('splits asterisk-marked words out as emphasis', () => {
    expect(splitEmphasis('Four quiet corners *of the garden.*')).toEqual([
      { text: 'Four quiet corners ', em: false },
      { text: 'of the garden.', em: true },
    ])
  })

  it('handles several marks and plain text', () => {
    expect(splitEmphasis('Chosen slowly. *Shipped simply.*').map((p) => p.em)).toEqual([false, true])
    expect(splitEmphasis('New arrivals')).toEqual([{ text: 'New arrivals', em: false }])
  })

  it('leaves an unmatched asterisk literal', () => {
    expect(splitEmphasis('5* rated')).toEqual([{ text: '5* rated', em: false }])
  })
})
