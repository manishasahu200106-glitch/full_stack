import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PostList from './components/PostList';
import CreatePostModal from './components/CreatePostModal';
import EditPostModal from './components/EditPostModal';
import { Layers, Cloud, GitBranch, Database, Cpu } from 'lucide-react';

export default function App() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  return (
    <div className="min-h-screen">
      <Navbar onOpenCreateModal={() => setIsCreateOpen(true)} />

      <main className="app-container">
        {/* Architecture Hero Banner */}
        <section className="hero">
          <div className="hero-tag">
            <span>Assignment 4</span> • <span>B.Tech CSIT CSE 3395</span>
          </div>

          <h1>
            Cloud-Native <span className="hero-gradient">MERN Stack</span> Application
          </h1>

          <p>
            Full-stack containerized blog platform orchestrated with Docker Compose, automated via
            GitHub Actions CI/CD pipelines, and deployed to Google Cloud Run.
          </p>

          <div className="badge-row">
            <span className="stack-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="var(--primary)" /> Docker Multi-Stage
            </span>
            <span className="stack-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cloud size={14} color="#38bdf8" /> Google Cloud Run
            </span>
            <span className="stack-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitBranch size={14} color="#34d399" /> GitHub Actions CI/CD
            </span>
            <span className="stack-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={14} color="#818cf8" /> MongoDB Atlas
            </span>
            <span className="stack-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="#f472b6" /> TanStack Query v5
            </span>
          </div>
        </section>

        {/* Blog Post List & Feed */}
        <PostList
          onEditPost={(post) => setEditingPost(post)}
          onOpenCreateModal={() => setIsCreateOpen(true)}
        />
      </main>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
      />
    </div>
  );
}
