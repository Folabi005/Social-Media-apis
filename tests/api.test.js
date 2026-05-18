const request = require("supertest");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = require("../app");
const User = require("../models/User");
const Post = require("../models/Post");

describe("Social Media API", () => {
  jest.setTimeout(30000);

  let aliceToken;
  let bobToken;
  let aliceId;
  let bobId;
  let alicePostId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await User.deleteMany({});
    await Post.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("registers a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      firstName: "Alice",
      lastName: "Smith",
      username: "alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.username).toBe("alice");
    expect(response.body.token).toBeDefined();
    aliceToken = response.body.token;
    aliceId = response.body.user._id;
  });

  test("logs in an existing user", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "alice@example.com",
      password: "password123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.email).toBe("alice@example.com");
    expect(response.body.token).toBeDefined();
  });

  test("registers a second user", async () => {
    const response = await request(app).post("/auth/register").send({
      firstName: "Bob",
      lastName: "Jones",
      username: "bob",
      email: "bob@example.com",
      password: "password123",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.username).toBe("bob");
    expect(response.body.token).toBeDefined();
    bobToken = response.body.token;
    bobId = response.body.user._id;
  });

  test("creates a draft post for Alice", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({
        title: "First draft",
        content: "This is a draft post.",
        tags: ["draft", "test"],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.state).toBe("draft");
    expect(response.body.title).toBe("First draft");
    alicePostId = response.body._id;
  });

  test("public posts endpoint returns no published posts", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBe(0);
    expect(Array.isArray(response.body.posts)).toBe(true);
  });

  test("publishes Alice's post", async () => {
    const response = await request(app)
      .put(`/posts/${alicePostId}`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ state: "published" });

    expect(response.statusCode).toBe(200);
    expect(response.body.state).toBe("published");
  });

  test("public posts endpoint returns the published post", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.posts[0].title).toBe("First draft");
    expect(response.body.posts[0].author.username).toBe("alice");
  });

  test("retrieves a single published post with author info", async () => {
    const response = await request(app).get(`/posts/${alicePostId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("First draft");
    expect(response.body.author.username).toBe("alice");
  });

  test("Bob follows Alice and sees her posts in his timeline", async () => {
    const followResponse = await request(app)
      .put(`/users/${aliceId}/follow`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send();

    expect(followResponse.statusCode).toBe(200);
    expect(followResponse.body.message).toContain("followed");

    const timelineResponse = await request(app)
      .get("/posts/timeline")
      .set("Authorization", `Bearer ${bobToken}`);

    expect(timelineResponse.statusCode).toBe(200);
    expect(timelineResponse.body.total).toBe(1);
    expect(timelineResponse.body.posts[0].author.username).toBe("alice");
  });

  test("Bob can unfollow Alice", async () => {
    const unfollowResponse = await request(app)
      .put(`/users/${aliceId}/unfollow`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send();

    expect(unfollowResponse.statusCode).toBe(200);
    expect(unfollowResponse.body.message).toContain("unfollowed");

    const timelineResponse = await request(app)
      .get("/posts/timeline")
      .set("Authorization", `Bearer ${bobToken}`);

    expect(timelineResponse.statusCode).toBe(200);
    expect(timelineResponse.body.total).toBe(0);
  });

  test("Alice sees her own posts filterable by state", async () => {
    const draftResponse = await request(app)
      .get("/posts/mine?state=draft")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(draftResponse.statusCode).toBe(200);
    expect(draftResponse.body.total).toBe(0);

    const publishedResponse = await request(app)
      .get("/posts/mine?state=published")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(publishedResponse.statusCode).toBe(200);
    expect(publishedResponse.body.total).toBe(1);
    expect(publishedResponse.body.posts[0].state).toBe("published");
  });

  test("Bob can like and unlike Alice's post", async () => {
    const likeResponse = await request(app)
      .put(`/posts/${alicePostId}/like`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send();

    expect(likeResponse.statusCode).toBe(200);
    expect(likeResponse.body.message).toContain("liked");

    const unlikeResponse = await request(app)
      .put(`/posts/${alicePostId}/like`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send();

    expect(unlikeResponse.statusCode).toBe(200);
    expect(unlikeResponse.body.message).toContain("unliked");
  });
});
