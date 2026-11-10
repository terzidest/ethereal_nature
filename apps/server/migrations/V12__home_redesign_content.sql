-- Home redesign (docs/design/redesign-spec.md §2): new copy, the values
-- ticker and the newsletter block. Only replaces the home config if it is
-- still exactly the V9 seed — a home page already edited in the admin is
-- left alone (jsonb equality ignores key order and whitespace).
update pages
set config = '[
  {
    "id": "hero",
    "type": "hero",
    "props": {
      "eyebrow": "New season harvest · 15 small batches",
      "title": "Nature, bottled, dried & *crystallised.*",
      "subtitle": "Essential oils, herbs, crystals and teas in small, honest batches — chosen slowly, shipped simply.",
      "primaryCta": {
        "label": "Shop everything"
      },
      "secondaryCta": {
        "label": "Under €15",
        "maxPriceMinor": 1500
      },
      "trust": [
        "Sourced with care",
        "Plastic-free post",
        "Secure checkout"
      ]
    }
  },
  {
    "id": "values-ticker",
    "type": "uspTicker",
    "props": {
      "items": [
        "Steam-distilled oils",
        "Whole dried herbs",
        "Hand-picked crystals",
        "Loose-leaf teas",
        "Plastic-free post",
        "Small batches"
      ]
    }
  },
  {
    "id": "categories",
    "type": "categoryTiles",
    "props": {
      "eyebrow": "01 — Shop by category",
      "heading": "Four quiet corners *of the garden.*",
      "tiles": [
        {
          "category": "OILS",
          "label": "Essential oils",
          "blurb": "Steam-distilled, single-origin"
        },
        {
          "category": "HERBS",
          "label": "Herbs",
          "blurb": "Dried whole, small harvests"
        },
        {
          "category": "CRYSTALS",
          "label": "Crystals",
          "blurb": "Hand-picked specimens"
        },
        {
          "category": "TEAS",
          "label": "Teas",
          "blurb": "Loose leaf, honest blends"
        }
      ]
    }
  },
  {
    "id": "new-arrivals",
    "type": "productStrip",
    "props": {
      "eyebrow": "02 — Fresh from the drying racks",
      "title": "New arrivals",
      "sort": "newest",
      "limit": 8
    }
  },
  {
    "id": "values",
    "type": "valueProps",
    "props": {
      "eyebrow": "03 — How we work",
      "heading": "Chosen slowly. *Shipped simply.*",
      "caption": "Hand-tied with a silk ribbon · picked the slow way",
      "items": [
        {
          "title": "Sourced with care",
          "blurb": "Every grower and cutter is someone we know by name."
        },
        {
          "title": "Small batches",
          "blurb": "Short runs, fresh stock — nothing sits in a warehouse for years."
        },
        {
          "title": "Plastic-free post",
          "blurb": "Recycled boxes, paper tape, no fillers."
        }
      ]
    }
  },
  {
    "id": "newsletter",
    "type": "newsletter",
    "props": {
      "eyebrow": "Harvest notes",
      "heading": "Hear when the next batch *is ready.*",
      "body": "One short letter per harvest. No noise.",
      "buttonLabel": "Subscribe"
    }
  }
]'::jsonb,
    updated_at = now()
where slug = 'home'
  and config = '[
  {
    "id": "hero",
    "type": "hero",
    "props": {
      "eyebrow": "New season harvest",
      "title": "Nature, bottled, dried & crystallised.",
      "subtitle": "Essential oils, herbs, crystals, and teas in small, honest batches — chosen slowly, shipped simply.",
      "primaryCta": { "label": "Shop everything" },
      "secondaryCta": { "label": "Under €15", "sort": "price-asc" }
    }
  },
  {
    "id": "categories",
    "type": "categoryTiles",
    "props": {
      "heading": "Shop by category",
      "tiles": [
        { "category": "OILS", "label": "Essential oils", "blurb": "Steam-distilled, single-origin" },
        { "category": "HERBS", "label": "Herbs", "blurb": "Dried whole, small harvests" },
        { "category": "CRYSTALS", "label": "Crystals", "blurb": "Hand-picked specimens" },
        { "category": "TEAS", "label": "Teas", "blurb": "Loose leaf, honest blends" }
      ]
    }
  },
  {
    "id": "new-arrivals",
    "type": "productStrip",
    "props": { "title": "New arrivals", "sort": "newest", "limit": 4 }
  },
  {
    "id": "values",
    "type": "valueProps",
    "props": {
      "items": [
        { "title": "Sourced with care", "blurb": "Every grower and cutter is someone we know by name." },
        { "title": "Small batches", "blurb": "Short runs, fresh stock — nothing sits in a warehouse for years." },
        { "title": "Plastic-free post", "blurb": "Recycled boxes, paper tape, no fillers." }
      ]
    }
  }
]'::jsonb;
