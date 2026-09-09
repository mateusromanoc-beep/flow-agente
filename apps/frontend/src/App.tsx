import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Inbox } from './pages/Inbox';
import { Connections } from './pages/Connections';
import { AgentConfig } from './pages/AgentConfig';
import { Contacts } from './pages/Contacts';
import { Integrations } from './pages/Integrations';
import { SuperAdmin } from './pages/SuperAdmin';
import { Billing } from './pages/Billing';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-semibold text-sm">
        Carregando Flow Agente...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden select-none">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/inbox"
            element={
              <ProtectedLayout>
                <Inbox />
              </ProtectedLayout>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedLayout>
                <Connections />
              </ProtectedLayout>
            }
          />
          <Route
            path="/agent"
            element={
              <ProtectedLayout>
                <AgentConfig />
              </ProtectedLayout>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedLayout>
                <Contacts />
              </ProtectedLayout>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedLayout>
                <Integrations />
              </ProtectedLayout>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedLayout>
                <Billing />
              </ProtectedLayout>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedLayout>
                <SuperAdmin />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
