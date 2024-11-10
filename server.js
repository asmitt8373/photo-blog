// Import the framework and instantiate it
import Fastify from "fastify";
import fastifyView from "@fastify/view";
import { Eta } from "eta";
import { db } from "./database/db.js";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import formBody from "@fastify/formbody";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eta = new Eta();

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

fastify.register(fastifyView, {
  engine: {
    eta,
  },
  templates: "./views",
});

fastify.register(formBody);

const TAG_LIST = [
  "Nature", // get rid of
  "City", // get rid of
  "Landscape",
  // into the wild
  // mountain majesty
  //tidal tranquility
  // waterfalls
  // colour
  // architecture
  // beach/ coast / seascapes
  "Skateboarding", // get rid of it
  "Mountains", // get rid of
  "Black&White",
];

fastify.get("/", async (request, reply) => {
  const NUMBER_OF_PHOTOS = 1;
  try {
    const postsArr = await db.posts.get();
    const posts = postsArr.map((post) => {
      const splitUrl = post.image_url.split("/upload/");
      post.image_url = `${splitUrl[0]}/upload/c_fill,h_400,w_400/${splitUrl[1]}`;
      return post;
    });
    const naturePosts = posts
      .filter((p) => p.tags === "Nature")
      .slice(0, NUMBER_OF_PHOTOS);
    const blackAndWhitePosts = posts
      .filter((p) => p.tags === "Black&White")
      .slice(0, NUMBER_OF_PHOTOS);
    const cityPosts = posts
      .filter((p) => p.tags === "City")
      .slice(0, NUMBER_OF_PHOTOS);
    const landscapePosts = posts
      .filter((p) => p.tags === "Landscape")
      .slice(0, NUMBER_OF_PHOTOS);
    const skateboardingPosts = posts
      .filter((p) => p.tags === "Skateboarding")
      .slice(0, NUMBER_OF_PHOTOS);
    const mountainPosts = posts
      .filter((p) => p.tags === "Mountains")
      .slice(0, NUMBER_OF_PHOTOS);
    return reply.viewAsync("homePage.eta", {
      posts,
      cityPosts,
      landscapePosts,
      skateboardingPosts,
      mountainPosts,
      naturePosts,
      blackAndWhitePosts,
    });
  } catch (err) {
    console.error(err);
  }
});
fastify.get("/posts/tags/:tag", async (request, reply) => {
  try {
    console.log(request.params);
    const posts = await db.posts.get();
    const filteredPosts = posts.filter(
      (p) => p.tags?.toLowerCase() === request.params.tag?.toLowerCase()
    );
    const galleryPhotos = filteredPosts.map((post) => {
      return {
        href: post.image_url,
        type: "image",
        title: "",
        description: "",
      };
    });
    return reply.viewAsync("tagPage.eta", {
      posts,
      filteredPosts,
      galleryPhotos,
    });
  } catch (err) {
    console.error(err);
  }
});

fastify.get("/admin", async (request, reply) => {
  const posts = await db.posts.get(
    {},
    {
      orderBy: "post_id",
      desc: true,
    }
  );
  return reply.viewAsync("admin.eta", {
    tags: TAG_LIST,
    posts,
    hxAttribute: `hx-post=/posts`,
  });
});
// make a variable for all the options, create a post/ insert
// create the for loop with the variable consisted in it
fastify.post("/posts", async (request, reply) => {
  const { image_url, caption, tags } = request.body;
  await db.post.insert({ image_url, caption, tags });
  const posts = await db.posts.get(
    {},
    {
      orderBy: "post_id",
      desc: true,
    }
  );
  return reply.viewAsync("admin.eta", {
    tags: TAG_LIST,
    posts,
    hxAttribute: `hx-post=/posts`,
  });
});

fastify.patch("/posts/:post_id", async (request, reply) => {
  const { image_url, caption, tags } = request.body;
  const { post_id } = request.params;
  await db.post.update({ post_id }, { image_url, caption, tags });
  const posts = await db.posts.get();
  return reply.viewAsync("admin.eta", {
    tags: TAG_LIST,
    posts,
  });
});

fastify.delete("/posts/:post_id", async (request, reply) => {
  const { post_id } = request.params;
  await db.post.remove({ post_id });
  const posts = await db.posts.get(
    {},
    {
      orderBy: "post_id",
      desc: true,
    }
  );
  return reply.viewAsync("admin.eta", {
    tags: TAG_LIST,
    posts,
    hxAttribute: `hx-post=/posts`,
  });
});

fastify.get("/posts/:id", async (request, reply) => {
  const { id } = request.params;
  try {
    const post = await db.posts.get({
      post_id: id,
    });
    return reply.send(post);
  } catch (err) {
    console.error(err);
  }
});

fastify.get("/posts/:postId/get-edit-form", async (request, reply) => {
  const postArray = await db.posts.get({
    post_id: request.params.postId,
  });
  const post = postArray[0]; // is this an array or now an object
  console.log(post);
  return reply.viewAsync("partials/form.eta", {
    post,
    tags: TAG_LIST,
    hxAttribute: `hx-patch=/posts/${request.params.postId}`,
  });
});

// new get route /posts/:tagName

// Run the server!
try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
