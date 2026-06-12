import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../ui/Spinner';

export function DashLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dash-layout">
      <Sidebar />
      <div className="dash-main">
        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
