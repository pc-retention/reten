import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SegmentsPage = lazy(() => import('./pages/SegmentsPage'));
const AutomationsPage = lazy(() => import('./pages/AutomationsPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const SourcesPage = lazy(() => import('./pages/SourcesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SyncPage = lazy(() => import('./pages/SyncPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const StatusesPage = lazy(() => import('./pages/StatusesPage'));

function App() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/segments" element={<SegmentsPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/statuses" element={<StatusesPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
