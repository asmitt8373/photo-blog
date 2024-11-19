drop table posts;
CREATE TABLE posts (
    post_id integer primary key,
    image_url text not null,
    caption text not null,
    tags text CHECK(tags IN ( 'Wilderness', 'Experimental', 'Places&Spaces', 'Waterfalls', 'Seaside', 'Black&White'))
);
