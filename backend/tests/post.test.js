const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Post = require('../models/Post');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Post.deleteMany({});
});

describe('MERN Blog Backend API Tests', () => {
  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('mern-blog-backend');
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new blog post with valid data', async () => {
      const newPost = {
        title: 'Mastering Docker and CI/CD for MERN',
        content: 'Containerizing fullstack applications using Docker and GitHub Actions.',
        author: 'Student Developer',
        category: 'Cloud & DevOps',
        tags: ['docker', 'cicd', 'mern']
      };

      const res = await request(app)
        .post('/api/posts')
        .send(newPost);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(newPost.title);
      expect(res.body.data.category).toBe('Cloud & DevOps');
      expect(res.body.data.likes).toBe(0);
    });

    it('should fail with 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Content without title' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/posts', () => {
    it('should return all blog posts', async () => {
      await Post.create([
        { title: 'Post 1', content: 'Content 1', author: 'Author 1', category: 'Technology' },
        { title: 'Post 2', content: 'Content 2', author: 'Author 2', category: 'React' }
      ]);

      const res = await request(app).get('/api/posts');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter posts by category', async () => {
      await Post.create([
        { title: 'React Hooks Guide', content: 'Deep dive into TanStack Query', author: 'Dev', category: 'React' },
        { title: 'Docker Compose Overview', content: 'Managing containers', author: 'Dev', category: 'Cloud & DevOps' }
      ]);

      const res = await request(app).get('/api/posts?category=React');
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('React Hooks Guide');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return a single post by ID', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'This is a test post',
        author: 'Tester',
        category: 'Web Development'
      });

      const res = await request(app).get(`/api/posts/${post._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Post');
    });

    it('should return 404 for non-existent post ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/posts/${fakeId}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update an existing post', async () => {
      const post = await Post.create({
        title: 'Original Title',
        content: 'Original Content',
        author: 'Tester',
        category: 'General'
      });

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
    });
  });

  describe('PATCH /api/posts/:id/like', () => {
    it('should increment likes count', async () => {
      const post = await Post.create({
        title: 'Likeable Post',
        content: 'Tap like!',
        author: 'Tester',
        category: 'Technology'
      });

      const res = await request(app).patch(`/api/posts/${post._id}/like`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.likes).toBe(1);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a post', async () => {
      const post = await Post.create({
        title: 'To Be Deleted',
        content: 'Delete me',
        author: 'Tester',
        category: 'Technology'
      });

      const res = await request(app).delete(`/api/posts/${post._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const findPost = await Post.findById(post._id);
      expect(findPost).toBeNull();
    });
  });
});
