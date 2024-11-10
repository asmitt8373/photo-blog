drop table posts;
CREATE TABLE posts (
    post_id integer primary key,
    image_url text not null,
    caption text not null,
    tags text CHECK(tags IN ('Nature', 'City', 'Landscape', 'Skateboarding', 'Mountains', 'Black&White'))
);
