import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { X, CheckCircle } from 'lucide-react';

const CATEGORIES = ['Technology', 'Cloud & DevOps', 'Web Development', 'React', 'General'];

export default function CreatePostModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    category: 'Cloud & DevOps',
    tags: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  // TanStack Query Mutation for Creating Post
  const createMutation = useMutation({
    mutationFn: postsApi.createPost,
    onSuccess: () => {
      // Invalidate posts query to trigger instant UI refresh
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setFormData({
        title: '',
        content: '',
        author: '',
        category: 'Cloud & DevOps',
        tags: ''
      });
      setErrorMessage('');
      onClose();
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to create blog post');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage('Please fill in both title and content.');
      return;
    }

    createMutation.mutate({
      title: formData.title,
      content: formData.content,
      author: formData.author.trim() || 'Anonymous Developer',
      category: formData.category,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Blog Article</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                {errorMessage}
              </div>
            )}

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Containerizing MERN Applications with Docker & Cloud Run"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your Name (e.g. CSIT Student)"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags (Comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="docker, kubernetes, react, express"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Content *</label>
              <textarea
                className="form-textarea"
                rows="5"
                placeholder="Write your article markdown or text here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
