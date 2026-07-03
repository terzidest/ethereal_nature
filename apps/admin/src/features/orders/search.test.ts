import { describe, expect, it } from 'vitest'
import { pageOf, pageSizeOf, validateOrdersTableSearch } from './search'

describe('validateOrdersTableSearch', () => {
  it('defaults page 1 / pageSize 25 and strips them from the URL', () => {
    const search = validateOrdersTableSearch({ page: '1', pageSize: '25' })
    expect(search).toEqual({ page: undefined, pageSize: undefined, status: undefined })
    expect(pageOf(search)).toBe(1)
    expect(pageSizeOf(search)).toBe(25)
  })

  it('rejects page sizes outside the allowed set', () => {
    expect(validateOrdersTableSearch({ pageSize: '9999' }).pageSize).toBeUndefined()
    expect(validateOrdersTableSearch({ pageSize: '50' }).pageSize).toBe(50)
  })

  it('drops unknown statuses', () => {
    expect(validateOrdersTableSearch({ status: 'REFUNDED' }).status).toBeUndefined()
    expect(validateOrdersTableSearch({ status: 'PACKED' }).status).toBe('PACKED')
  })
})
