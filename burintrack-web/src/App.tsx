import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientFormPage from './pages/ClientFormPage';
import ClientDetailPage from './pages/ClientDetailPage';
import CopieursPage from './pages/CopieursPage';
import CopieurFormPage from './pages/CopieurFormPage';
import CopieurDetailPage from './pages/CopieurDetailPage';
import InterventionsPage from './pages/InterventionsPage';
import InterventionFormPage from './pages/InterventionFormPage';
import CartePage from './pages/CartePage';
import CompteursPage from './pages/CompteursPage';
import RapportsPage from './pages/RapportsPage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';
import ProfilePage from './pages/ProfilePage';
import AttributionPage from './pages/AttributionPage';
import AttributionFormPage from './pages/AttributionFormPage';
import ParametresPage from './pages/ParametresPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={<RequireAuth><AdminLayout /></RequireAuth>}
          >
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/nouveau" element={<ClientFormPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="clients/:id/modifier" element={<ClientFormPage />} />
            <Route path="copieurs" element={<CopieursPage />} />
            <Route path="copieurs/nouveau" element={<CopieurFormPage />} />
            <Route path="copieurs/:id" element={<CopieurDetailPage />} />
            <Route path="copieurs/:id/modifier" element={<CopieurFormPage />} />
            <Route path="attributions" element={<AttributionPage />} />
            <Route path="attributions/:id" element={<AttributionFormPage />} />
            <Route path="interventions" element={<InterventionsPage />} />
            <Route path="interventions/nouvelle" element={<InterventionFormPage />} />
            <Route path="carte" element={<CartePage />} />
            <Route path="compteurs" element={<CompteursPage />} />
            <Route path="rapports" element={<RapportsPage />} />
            <Route path="utilisateurs" element={<UsersPage />} />
            <Route path="utilisateurs/nouveau" element={<UserFormPage />} />
            <Route path="utilisateurs/:id/modifier" element={<UserFormPage />} />
            <Route path="profil" element={<ProfilePage />} />
            <Route path="parametres" element={<ParametresPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
