import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashLayout } from './components/layout/DashLayout';
import { useAuth } from './hooks/useAuth';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { CatalogPage } from './pages/public/CatalogPage';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { CategoryPage } from './pages/public/CategoryPage';
import { FactoryPage } from './pages/public/FactoryPage';
import { ConsultantsPage } from './pages/public/ConsultantsPage';
import { ConsultantPage } from './pages/public/ConsultantPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RegisterCustomerPage } from './pages/auth/RegisterCustomerPage';
import { ApplyConsultantPage } from './pages/auth/ApplyConsultantPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { InvitePage } from './pages/auth/InvitePage';

// Shared dashboard
import { MessagesPage } from './pages/dashboard/shared/MessagesPage';
import { ProfilePage } from './pages/dashboard/shared/ProfilePage';

// Client dashboard
import { ClientOverviewPage } from './pages/dashboard/client/ClientOverviewPage';
import { ClientRequestsPage } from './pages/dashboard/client/ClientRequestsPage';
import { NewRequestPage } from './pages/dashboard/client/NewRequestPage';
import { RequestDetailPage } from './pages/dashboard/client/RequestDetailPage';
import { ClientOffersPage } from './pages/dashboard/client/ClientOffersPage';
import { OfferDetailPage } from './pages/dashboard/client/OfferDetailPage';
import { ClientOrdersPage } from './pages/dashboard/client/ClientOrdersPage';
import { OrderDetailPage } from './pages/dashboard/client/OrderDetailPage';

// Consultant dashboard
import { ConsultantOverviewPage } from './pages/dashboard/consultant/ConsultantOverviewPage';
import { ConsultantRequestsPage } from './pages/dashboard/consultant/ConsultantRequestsPage';
import { ConsultantOffersPage } from './pages/dashboard/consultant/ConsultantOffersPage';
import { ConsultantOrdersPage } from './pages/dashboard/consultant/ConsultantOrdersPage';
import { ConsultantFactoriesPage } from './pages/dashboard/consultant/ConsultantFactoriesPage';

// Factory dashboard
import { FactoryOverviewPage } from './pages/dashboard/factory/FactoryOverviewPage';
import { FactoryOrdersPage } from './pages/dashboard/factory/FactoryOrdersPage';
import { FactoryProductsPage } from './pages/dashboard/factory/FactoryProductsPage';
import { FactoryCertsPage } from './pages/dashboard/factory/FactoryCertsPage';
import { FactoryConsultantsPage } from './pages/dashboard/factory/FactoryConsultantsPage';
import { FactoryProfilePage } from './pages/dashboard/factory/FactoryProfilePage';

// Admin dashboard
import { AdminOverviewPage } from './pages/dashboard/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/dashboard/admin/AdminUsersPage';
import { AdminFactoriesPage } from './pages/dashboard/admin/AdminFactoriesPage';
import { AdminConsultantAppsPage } from './pages/dashboard/admin/AdminConsultantAppsPage';
import { AdminInvitesPage } from './pages/dashboard/admin/AdminInvitesPage';
import { AdminReviewsPage } from './pages/dashboard/admin/AdminReviewsPage';
import { AdminAuditPage } from './pages/dashboard/admin/AdminAuditPage';
import { AdminSettingsPage } from './pages/dashboard/admin/AdminSettingsPage';

function DashboardIndex() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Redirect to role-based overview
  return <Navigate to="/dashboard" replace />;
}

function RoleDashRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role;

  return (
    <Routes>
      {/* Overview */}
      <Route
        index
        element={
          role === 'client' ? <ClientOverviewPage /> :
          role === 'consultant' ? <ConsultantOverviewPage /> :
          role === 'factory_admin' ? <FactoryOverviewPage /> :
          role === 'platform_admin' ? <AdminOverviewPage /> :
          <Navigate to="/login" replace />
        }
      />

      {/* Shared */}
      <Route path="messages" element={<MessagesPage />} />
      <Route path="profile" element={<ProfilePage />} />

      {/* Client routes */}
      {role === 'client' && <>
        <Route path="requests" element={<ClientRequestsPage />} />
        <Route path="requests/new" element={<NewRequestPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="offers" element={<ClientOffersPage />} />
        <Route path="offers/:id" element={<OfferDetailPage />} />
        <Route path="orders" element={<ClientOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
      </>}

      {/* Consultant routes */}
      {role === 'consultant' && <>
        <Route path="requests" element={<ConsultantRequestsPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="offers" element={<ConsultantOffersPage />} />
        <Route path="offers/:id" element={<OfferDetailPage />} />
        <Route path="orders" element={<ConsultantOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="factories" element={<ConsultantFactoriesPage />} />
      </>}

      {/* Factory routes */}
      {role === 'factory_admin' && <>
        <Route path="orders" element={<FactoryOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="products" element={<FactoryProductsPage />} />
        <Route path="certs" element={<FactoryCertsPage />} />
        <Route path="consultants" element={<FactoryConsultantsPage />} />
        <Route path="profile" element={<FactoryProfilePage />} />
      </>}

      {/* Admin routes */}
      {role === 'platform_admin' && <>
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="factories" element={<AdminFactoriesPage />} />
        <Route path="consultant-applications" element={<AdminConsultantAppsPage />} />
        <Route path="invites" element={<AdminInvitesPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </>}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/factory/:id" element={<FactoryPage />} />
            <Route path="/consultants" element={<ConsultantsPage />} />
            <Route path="/consultant/:id" element={<ConsultantPage />} />
          </Route>

          {/* Auth routes (no layout shell) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/customer" element={<RegisterCustomerPage />} />
          <Route path="/register/consultant" element={<ApplyConsultantPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<DashLayout />}>
            <Route path="*" element={<RoleDashRoutes />} />
            <Route index element={<RoleDashRoutes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
