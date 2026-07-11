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
import { QuestionDetailPage } from '@/pages/app/QuestionDetailPage'
import { SalaryPage } from '@/pages/app/SalaryPage'
import { MapPage } from '@/pages/app/MapPage'
import { CareerPage } from '@/pages/app/CareerPage'
import { MessagesPage } from '@/pages/app/MessagesPage'
import { NotificationsPage } from '@/pages/app/NotificationsPage'
import { SubscriptionPage } from '@/pages/app/SubscriptionPage'
import { ProfilePage } from '@/pages/app/ProfilePage'
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

        {/* Authenticated member app */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<FeedPage />} />
          <Route path="alumni" element={<AlumniDirectoryPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="forum" element={<ForumPage />} />
          <Route path="forum/:id" element={<QuestionDetailPage />} />
          <Route path="salary" element={<SalaryPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="career" element={<CareerPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
