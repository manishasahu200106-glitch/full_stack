import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import PostCard from './PostCard';
import { Search, RefreshCw, AlertCircle, FileText } from 'lucide-react';

const CATEGORIES = ['All', 'Technology', 'Cloud & DevOps', 'Web Development', 'React', 'General'];

export default function PostList({ onEditPost, onOpenCreateModal }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // TanStack Query for fetching posts with automatic caching and refetching
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['posts', { category: selectedCategory, search: searchTerm }],
    queryFn: () => postsApi.getAllPosts({ category: selectedCategory, search: searchTerm }),
    staleTime: 1000 * 30, // 30 seconds fresh
  });

  const rawPosts = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const posts = Array.isArray(rawPosts) ? rawPosts : [];

  return (
    <section>
      {/* Controls Bar: Category Pills and Search Filter */}
      <div className="controls-bar">
        <div className="category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search posts or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="btn-icon"
            onClick={() => refetch()}
            title="Refresh Posts"
            style={{ padding: '0.6rem' }}
          >
            <RefreshCw size={16} className={isFetching ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="state-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading articles via TanStack Query...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="state-container" style={{ borderColor: 'rgba(248, 113, 113, 0.4)' }}>
          <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Failed to Load Posts</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {error?.response?.data?.message || error?.message || 'Could not connect to the Backend API container.'}
          </p>
          <button className="btn btn-secondary" onClick={() => refetch()}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && posts.length === 0 && (
        <div className="state-container">
          <FileText size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No Posts Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {searchTerm || selectedCategory !== 'All'
              ? 'No blog articles match your current filter. Try clearing filters.'
              : 'Be the first developer to publish an article!'}
          </p>
          <button className="btn btn-primary" onClick={onOpenCreateModal}>
            Create First Post
          </button>
        </div>
      )}

      {/* Posts Grid */}
      {!isLoading && !isError && Array.isArray(posts) && posts.length > 0 && (
        <div className="posts-grid">
          {posts.map((post) => (
            post && (post._id || post.id) ? (
              <PostCard key={post._id || post.id} post={post} onEdit={onEditPost} />
            ) : null
          ))}
        </div>
      )}
    </section>
  );
}
