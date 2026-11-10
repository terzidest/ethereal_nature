-- Product gallery and specs for the redesigned product page.
--
-- product_images is the ordered gallery (position 0 = the main photo).
-- products.image_url stays as a denormalised copy of position 0, written by
-- the catalog repository, so listings, cart and order snapshots keep reading
-- one column.
alter table products
    add column summary varchar(300),
    add column origin  varchar(100),
    add column size    varchar(100),
    add column weight  varchar(100);

create table product_images (
    product_id uuid         not null references products (id) on delete cascade,
    position   integer      not null check (position >= 0),
    url        varchar(500) not null,
    label      varchar(100),
    primary key (product_id, position)
);

-- Every existing photo becomes its product's first gallery image.
insert into product_images (product_id, position, url)
select id, 0, image_url
  from products
 where image_url is not null;

-- The one product the design shows with a second shot and specs.
update product_images
   set label = 'Front view'
 where position = 0
   and product_id = (select id from products where slug = 'amethyst-cluster')
   and url = 'https://img.terzidest.com/products/amethyst-cluster.jpg';

insert into product_images (product_id, position, url, label)
select id, 1, 'https://img.terzidest.com/products/amethyst-cluster-in-hand.jpg', 'In hand, for scale'
  from products
 where slug = 'amethyst-cluster'
   and image_url = 'https://img.terzidest.com/products/amethyst-cluster.jpg';

update products
   set summary = 'Deep-violet Brazilian amethyst druse, roughly fist-sized. Every piece unique.',
       origin  = 'Brazil',
       size    = 'Roughly fist-sized'
 where slug = 'amethyst-cluster'
   and summary is null;
