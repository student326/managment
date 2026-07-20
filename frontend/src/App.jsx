import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import EditStudent from './pages/EditStudent';
import FeeManagement from './pages/FeeManagement';
import DataSync from './pages/DataSync';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import FinancialDashboard from './pages/FinancialDashboard';
import TransactionLog from './pages/TransactionLog';
import ExpenseTracking from './pages/ExpenseTracking';
import InstallmentPlans from './pages/InstallmentPlans';
import FeeReceipts from './pages/FeeReceipts';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="add-student" element={<AddStudent />} />
            <Route path="edit-student/:studentId" element={<EditStudent />} />
            <Route path="fee-management/:studentId" element={<FeeManagement />} />
            <Route path="data-sync" element={<DataSync />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="financial-dashboard" element={<FinancialDashboard />} />
            <Route path="transactions" element={<TransactionLog />} />
            <Route path="expenses" element={<ExpenseTracking />} />
            <Route path="installments" element={<InstallmentPlans />} />
            <Route path="receipts" element={<FeeReceipts />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
