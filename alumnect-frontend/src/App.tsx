import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ProtectedRoute, RoleRoute } from '@/components/routing/guards'
import { MarketingLayout, AppShell, AdminShell, ScrollToTop } from '@/components/layout'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { FeedPage } from '@/pages/app/FeedPage'
import { AlumniDirectoryPage } from '@/pages/app/AlumniDirectoryPage'
import { JobsPage } from '@/pages/app/JobsPage'
import { EventsPage } from '@/pages/app/EventsPage'
import { ForumPage } from '@/pages/app/ForumPage'
import { SalaryPage } from '@/pages/app/SalaryPage'
import { MapPage } from '@/pages/app/MapPage'
import { CareerPage } from '@/pages/app/CareerPage'
import { MessagesPage } from '@/pages/app/MessagesPage'
import { NotificationsPage } from '@/pages/app/NotificationsPage'
import { SubscriptionPage } from '@/pages/app/SubscriptionPage'
import { ProfilePage } from '@/pages/app/ProfilePage'
import { ChangePasswordPage } from '@/pages/app/ChangePasswordPage'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminSectionPage } from '@/pages/admin/AdminSectionPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public marketing site */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          {/* Auth (full-screen, own scaffold) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Public profile view for sharing/guests */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="career" element={<CareerPage />} />
          {/* Authenticated member app */}
          <Route
            path="/app"
            element={<AppShell />}
          >
            <Route index element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="alumni" element={<ProtectedRoute><AlumniDirectoryPage /></ProtectedRoute>} />
            <Route path="jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
            <Route path="events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="forum" element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
            <Route path="salary" element={<ProtectedRoute><SalaryPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="career" element={<CareerPage />} />
            <Route path="change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          </Route>

          {/* Admin console */}
          <Route
            path="/admin"
            element={
              <RoleRoute role="ADMIN">
                <AdminShell />
              </RoleRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="verifications" element={<AdminSectionPage sectionKey="verifications" />} />
            <Route path="reports" element={<AdminSectionPage sectionKey="reports" />} />
            <Route path="revenue" element={<AdminSectionPage sectionKey="revenue" />} />
            <Route path="broadcast" element={<AdminSectionPage sectionKey="broadcast" />} />
            <Route path="moderation" element={<AdminSectionPage sectionKey="moderation" />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
