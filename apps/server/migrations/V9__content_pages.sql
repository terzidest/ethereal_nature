create table pages (
    slug       varchar(100) primary key,
    config     jsonb        not null,
    updated_at timestamptz  not null default now()
);

-- Seed: the home page as a block config, reproducing the hardcoded layout
-- verbatim (visual no-op when the storefront switches to the renderer).
-- Structure matches blockprint: an array of { type, props, id } entries.
insert into pages (slug, config) values ('home', '[
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
]'::jsonb);
