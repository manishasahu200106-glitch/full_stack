import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { X } from 'lucide-react';

const CATEGORIES = ['Technology', 'Cloud & DevOps', 'Web Development', 'React', 'General'];

export default function EditPostModal({ post, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    category: 'Technology',
    tags: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        author: post.author || '',
        category: post.category || 'Technology',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : ''
      });
    }
  }, [post]);

  const updateMutation = useMutation({
    mutationFn: postsApi.updatePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setErrorMessage('');
      onClose();
    },
    onError: (err) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update post');
    }
  });

  if (!isOpen || !post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setErrorMessage('Title and content are required.');
      return;
    }

    updateMutation.mutate({
      id: post._id,
      postData: {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Blog Post</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Category</label>
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
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Content</label>
              <textarea
                className="form-textarea"
                rows="5"
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
