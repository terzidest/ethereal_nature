-- Our own product photos replace the V8 Unsplash placeholders. They are hosted
-- in the R2 bucket behind img.terzidest.com as products/<slug>.jpg, so the URL
-- derives from the slug. Display-only, like V8: frontends fall back to
-- generated artwork when a URL is missing or dead.
-- Guarded so a manually-set image_url is never overwritten: only rows still
-- on the V8 seed URL (or with none) change. The archived cacao has no photo.
update products
   set image_url = 'https://img.terzidest.com/products/' || slug || '.jpg'
 where slug in (
         'lavender-essential-oil', 'eucalyptus-essential-oil',
         'sweet-orange-essential-oil', 'frankincense-essential-oil',
         'dried-chamomile-flowers', 'white-sage-bundle',
         'organic-nettle-leaf', 'mugwort-herb',
         'clear-quartz-point', 'amethyst-cluster',
         'rose-quartz-palm-stone', 'black-tourmaline-raw',
         'moonlight-jasmine-green-tea', 'forest-berry-herbal-tea',
         'smoked-lapsang-souchong'
       )
   and (image_url is null or image_url like 'https://images.unsplash.com/%');
