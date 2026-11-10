import { describe, expect, it } from 'vitest'
import { galleryRow, toImageRequests } from './components/GalleryEditor'

describe('toImageRequests', () => {
  it('keeps order, trims, drops empty rows and blank labels', () => {
    const rows = [
      galleryRow(' https://img.test/a.jpg ', ' Front view '),
      galleryRow('   ', 'orphan label'),
      galleryRow('https://img.test/b.jpg', '  '),
    ]
    expect(toImageRequests(rows)).toEqual([
      { url: 'https://img.test/a.jpg', label: 'Front view' },
      { url: 'https://img.test/b.jpg' },
    ])
  })

  it('gives every row its own key', () => {
    expect(galleryRow().key).not.toBe(galleryRow().key)
  })
})
