import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Leads = lazy(() => import('./pages/Leads.jsx'));
const Marketing = lazy(() => import('./pages/Marketing.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));
const Memory = lazy(() => import('./pages/Memory.jsx'));
const Knowledge = lazy(() => import('./pages/Knowledge.jsx'));
const PromptStudio = lazy(() => import('./pages/PromptStudio.jsx'));
const WorkflowCenter = lazy(() => import('./pages/WorkflowCenter.jsx'));
const WorkflowExecution = lazy(() => import('./pages/WorkflowExecution.jsx'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder.jsx'));
const WorkflowBuilderNoCode = lazy(() => import('./pages/WorkflowBuilderNoCode.jsx'));
const BusinessInsights = lazy(() => import('./pages/BusinessInsights.jsx'));
const Monitoring = lazy(() => import('./pages/Monitoring.jsx'));
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/memory" element={<ProtectedRoute><Memory /></ProtectedRoute>} />
        <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
        <Route path="/prompts" element={<ProtectedRoute><PromptStudio /></ProtectedRoute>} />
        <Route path="/workflow" element={<ProtectedRoute><WorkflowCenter /></ProtectedRoute>} />
        <Route path="/workflow/execution" element={<ProtectedRoute><WorkflowExecution /></ProtectedRoute>} />
        <Route path="/workflow/builder" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />
        <Route path="/workflow-builder" element={<ProtectedRoute><WorkflowBuilderNoCode /></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><BusinessInsights /></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />
        <Route path="/collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

export default App;
