CREATE TABLE posts_new (
    post_id integer primary key,
    image_url text not null,
    caption text not null,
    tags text CHECK(tags IN ( 'Wilderness', 'Experimental', 'Places&Spaces', 'Waterfalls', 'Seaside', 'Black&White'))
) strict;

insert into posts_new (
    post_id,
    image_url,
    caption,
    tags)
select
    post_id,
    image_url,
    caption,
    tags
from posts;

drop table posts;
alter table posts_new rename to posts;
pragma foreign_key_check;
