import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Leads = lazy(() => import('./pages/Leads.jsx'));
const Marketing = lazy(() => import('./pages/Marketing.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const AIStudio = lazy(() => import('./pages/AIStudio.jsx'));
const Collaboration = lazy(() => import('./pages/Collaboration.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

const App = () => (
  <ErrorBoundary>
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[var(--ui-background)] text-[var(--ui-text)]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--ui-border)] border-t-[var(--ui-accent)]" /></main>}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />
        <Route path="/collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

export default App;
