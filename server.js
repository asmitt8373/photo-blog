// Import the framework and instantiate it
import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyView from "@fastify/view";
import { Eta } from "eta";
import { db } from "./database/db.js";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import formBody from "@fastify/formbody";
import basicAuth from "@fastify/basic-auth";

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
  templates: path.join(__dirname, "views"),
});

fastify.register(formBody);

const schema = {
  type: "object",
  required: ["USERNAME", "PASSWORD"],
  properties: {
    USERNAME: {
      type: "string",
      default: "",
    },
    PASSWORD: {
      type: "string",
      default: "",
    },
  },
};

const options = {
  dotenv: true,
  schema,
};

fastify.register(fastifyEnv, options).ready((err) => {
  if (err) console.error(err);
});

const authenticate = { realm: "myApp" };
fastify.register(basicAuth, { validate, authenticate });
async function validate(username, password, req, reply) {
  if (username !== process.env.USERNAME || password !== process.env.PASSWORD) {
    reply.header("authorization", "");
    reply.header("WWW-Authenticate", "Basic realm='myApp'");
    reply.statusCode = 401;
    return reply.status(401).send("🙅🏻 nope");
  }
}

const TAG_LIST = [
  // desert oasis
  "Wilderness",
  "Experimental",
  "Places&Spaces",
  "Seaside",
  "Waterfalls",
  "Black&White",
];
fastify.get("/health", (request, reply) => {
  return reply.send("Okay");
});
fastify.get("/", async (request, reply) => {
  const NUMBER_OF_PHOTOS = 1;
  try {
    const postsArr = await db.posts.get();
    const posts = postsArr.map((post) => {
      const splitUrl = post.image_url.split("/upload/");
      post.image_url = `${splitUrl[0]}/upload/c_fill,h_400,w_400/${splitUrl[1]}`;
      return post;
    });
    const wildernessPosts = posts
      .filter((p) => p.tags === "Wilderness")
      .slice(0, NUMBER_OF_PHOTOS);
    const blackAndWhitePosts = posts
      .filter((p) => p.tags === "Black&White")
      .slice(0, NUMBER_OF_PHOTOS);
    const experimentalPosts = posts
      .filter((p) => p.tags === "Experimental")
      .slice(0, NUMBER_OF_PHOTOS);
    const placesAndSpacesPosts = posts
      .filter((p) => p.tags === "Places&Spaces")
      .slice(0, NUMBER_OF_PHOTOS);
    const seasidePosts = posts
      .filter((p) => p.tags === "Seaside")
      .slice(0, NUMBER_OF_PHOTOS);
    const waterfallPosts = posts
      .filter((p) => p.tags === "Waterfalls")
      .slice(0, NUMBER_OF_PHOTOS);
    return reply.viewAsync("homePage.eta", {
      posts,
      experimentalPosts,
      placesAndSpacesPosts,
      seasidePosts,
      waterfallPosts,
      wildernessPosts,
      blackAndWhitePosts,
    });
  } catch (err) {
    console.error(err);
  }
});
// tag page below
fastify.get("/posts/tags/:tag", async (request, reply) => {
  function randomWholeNum() {
    return Math.floor(Math.random() * 10);
  }
  try {
    const postsArr = await db.posts.get({
      tags: request.params.tag,
    });

    const posts = postsArr
      .map((post) => {
        const splitUrl = post.image_url.split("/upload/");
        return {
          ...post,
          order: randomWholeNum(),
          fullsize_image: post.image_url,
          image_url: `${splitUrl[0]}/upload/c_fill,h_300,w_300/${splitUrl[1]}`,
        };
      })
      .sort((a, b) => a.order - b.order);
    const galleryPhotos = posts.map((post) => {
      return {
        href: post.fullsize_image,
        type: "image",
        title: "",
        description: "",
      };
    });

    return reply.viewAsync("tagPage.eta", {
      tags: TAG_LIST,
      posts,
      galleryPhotos,
      hxAttribute: `hx-post=/posts`,
    });
  } catch (err) {
    console.error(err);
  }
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

// admin page select filter below
fastify.get("/admin/posts/tag", async (request, reply) => {
  try {
    console.log(request.query);
    const postsArr = await db.posts.get({
      tags: request.query.tag,
    });
    const posts = postsArr.map((post) => {
      const splitUrl = post.image_url.split("/upload/");
      post.image_url = `${splitUrl[0]}/upload/c_fill,h_150,w_150/${splitUrl[1]}`;
      return post;
    });
    console.log(posts);
    const galleryPhotos = posts.map((post) => {
      return {
        href: post.image_url,
        type: "image",
        title: "",
        description: "",
      };
    });
    return reply.viewAsync("admin.eta", {
      posts,
      tags: TAG_LIST,
      galleryPhotos,
    });
  } catch (err) {
    console.error(err);
  }
});

fastify.get("/admin", async (request, reply) => {
  const authHeader = request.headers["authorization"];
  if (!authHeader) {
    reply.header("WWW-Authenticate", "Basic realm='myApp'");
    reply.statusCode = 401;
    return reply.status(401).send("🙅🏻 nope");
  }

  const base64String = authHeader?.split(" ")[1];
  const auth = new Buffer(base64String, "base64").toString("ascii");
  const [username, password] = auth.split(":");

  validate(username, password, request, reply);

  return reply.viewAsync("admin.eta", {
    tags: TAG_LIST,
    posts: [],
    hxAttribute: `hx-post=/posts`,
  });
});

// new get route /posts/:tagName

// Run the server!
try {
  await fastify.listen({
    host: "0.0.0.0",
    port: 3000,
  });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
