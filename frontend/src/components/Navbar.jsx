import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsApi } from '../api/postsApi';
import { PlusCircle, Activity } from 'lucide-react';

export default function Navbar({ onOpenCreateModal }) {
  // TanStack Query to check backend health status every 15 seconds
  const { data: health, isSuccess, isError } = useQuery({
    queryKey: ['backendHealth'],
    queryFn: postsApi.checkBackendHealth,
    refetchInterval: 15000,
    retry: 1
  });

  return (
    <header className="navbar">
      <div className="nav-content">
        <a href="/" className="brand">
          <div className="brand-icon">🚀</div>
          <div>
            <div className="brand-title">DevLog Cloud</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              MERN • DOCKER • CLOUD RUN
            </div>
          </div>
        </a>

        <div className="nav-actions">
          <div className="health-pill" title={isSuccess ? `Backend Healthy: ${health?.service}` : 'Backend Unreachable'}>
            <span className={`status-dot ${isSuccess ? 'online' : 'offline'}`}></span>
            <Activity size={14} color={isSuccess ? 'var(--success)' : 'var(--danger)'} />
            <span>{isSuccess ? 'API Online' : isError ? 'API Offline' : 'Connecting...'}</span>
          </div>

          <button className="btn btn-primary" onClick={onOpenCreateModal}>
            <PlusCircle size={18} />
            <span>Create Post</span>
          </button>
        </div>
      </div>
    </header>
  );
}
