import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { Heart, Edit3, Trash2, Calendar, User, Tag } from 'lucide-react';

export default function PostCard({ post, onEdit }) {
  const queryClient = useQueryClient();

  // TanStack Query Mutation for Liking Post
  const likeMutation = useMutation({
    mutationFn: () => postsApi.likePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  // TanStack Query Mutation for Deleting Post
  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deletePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      deleteMutation.mutate();
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article className="post-card">
      <div>
        <div className="card-header">
          <span className="card-category">{post.category}</span>
          <span className="card-date" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={13} />
            {formattedDate}
          </span>
        </div>

        <h2 className="card-title">{post.title}</h2>
        <p className="card-content">{post.content}</p>

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="card-tags">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="tag-item">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {typeof post.tags === 'string' && post.tags.trim() && (
          <div className="card-tags">
            {post.tags.split(',').map((tag, idx) => (
              <span key={idx} className="tag-item">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="card-author" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <User size={14} color="var(--primary)" />
          <span>{post.author}</span>
        </div>

        <div className="card-actions">
          <button
            className="like-btn"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            title="Like Post"
          >
            <Heart size={14} fill={post.likes > 0 ? '#fb7185' : 'none'} />
            <span>{post.likes || 0}</span>
          </button>

          <button
            className="btn-icon"
            onClick={() => onEdit(post)}
            title="Edit Post"
          >
            <Edit3 size={15} />
          </button>

          <button
            className="btn-icon"
            style={{ color: 'var(--danger)' }}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            title="Delete Post"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
