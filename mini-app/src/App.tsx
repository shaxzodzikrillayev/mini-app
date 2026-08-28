import { ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import Home from './pages/Home';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Calculator from './pages/Calculator';
import Orders from './pages/Orders';
import AIConsultant from './pages/AIConsultant';
import Profile from './pages/Profile';
import OrderDetail from './pages/OrderDetail';
import AuthPage from './pages/Auth';
import { useAuth } from './store/auth';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, hydrated, isTelegram } = useAuth();
  const loc = useLocation();

  // Wait for session hydration to avoid redirect flicker.
  if (!hydrated) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }
  if (!user && !isTelegram) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  return <>{children}</>;
}

function BlockAuthed({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth();
  if (hydrated && user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route
            path="/calc"
            element={
              <RequireAuth>
                <Calculator />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="/ai" element={<AIConsultant />} />
        <Route
          path="/login"
          element={
            <BlockAuthed>
              <AuthPage mode="login" />
            </BlockAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <BlockAuthed>
              <AuthPage mode="register" />
            </BlockAuthed>
          }
        />
      </Routes>
      <ToastContainer />
    </>
  );
}
