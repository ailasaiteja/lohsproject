// src/App.jsx (Updated)
import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';

import Layout from './components/Layout/Layout';
import { ToastProvider } from './pages/toast/ToastContext';
import LoadingToast from './pages/loading/LoadingToast';

// Pages
import Home from './pages/HomePage/Home';
import Profile from './pages/HomePage/Profile';
import LoginPage from './pages/Auths/LoginPage';
import SignupPage from './pages/Auths/SignupPage';
import CashbackPage from './pages/Cashbacks/Cashbackpage';
import LuckyDrawsPage from './pages/LuckyProduct/LuckyDrawspage';
import CustomerSignup from './pages/MyCustomers/CustomerSignup';
import CustomerActivities from './pages/MyCustomers/CustomerActivities';
import ProductPage from './pages/Products/ProductPage';
import SchemsPage from './pages/Schemes/SchemsPage';
import Dashboard from './pages/Dashboard/Dashboard';
import MyProducts from './pages/MyProducts/MyProducts';
import MyOrders from './pages/MyOrders/MyOrders';
import HelpSupport from './pages/HelpSupport/HelpSupport';
import AcceptedOrdersPage from './pages/MyOrders/AcceptedOrders';
import AssignedOrders from './pages/MyOrders/AssignedOrders';
import DeliveredOrders from './pages/MyOrders/DeliveredOrders';
import RejectedOrders from './pages/MyOrders/RejectedOrders';
import CancelledOrders from './pages/MyOrders/CancelledOrders';
import VendorSeller from './pages/VendorSeller/VendorSeller';
import MyCashback from './pages/MyEntries/MyCashback';
import MySchemes from './pages/MyEntries/MySchemes';
import MyOrder from './pages/MyEntries/MyOrder';
import MyLuckyDraw from './pages/MyEntries/MyLuckydraw';
import MyWallet from './pages/Wallets/MyWallet';
import CommissionWallet from './pages/Wallets/CommissionWallet';
import WithdrawWallet from './pages/Wallets/WithdrawWallet';
import CashbackWallet from './pages/Wallets/CashbackWallet';
import SchemeWallet from './pages/Wallets/SchemesWallet';
import CustomerCashback from './pages/MyCustomers/CustomerCashback';
import CustomerLottery from './pages/MyCustomers/CustomerLottery';
import CustomerProducts from './pages/MyCustomers/CustomerProducts';
import CustomerSchemes from './pages/MyCustomers/CustomerSchemes';
import NotificationsPage from './pages/Notifications/Notifications';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return children;
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
    localStorage.removeItem('flh_wallets');
    navigate('/login');
  };

  return (
    <ToastProvider>
      <Layout onLogout={handleLogout}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />
          } />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/vendor-seller" element={<VendorSeller />} />

          {/* Public Pages */}
          <Route path="/home" element={<Home />} />
          <Route path="/lucky-draw" element={<LuckyDrawsPage />} />
          <Route path="/cashback" element={<CashbackPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/schemes" element={<SchemsPage />} />
          {/* <Route path="/Help&Support" element={<HelpSupport />} /> */}

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/my-products" element={
            <ProtectedRoute><MyProducts /></ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute><MyOrders /></ProtectedRoute>
          } />
          <Route path="/accepted-orders" element={
            <ProtectedRoute><AcceptedOrdersPage /></ProtectedRoute>
          } />
          <Route path="/assigned-orders" element={
            <ProtectedRoute><AssignedOrders /></ProtectedRoute>
          } />
          <Route path="/delivered-orders" element={
            <ProtectedRoute><DeliveredOrders /></ProtectedRoute>
          } />
          <Route path="/rejected-orders" element={
            <ProtectedRoute><RejectedOrders /></ProtectedRoute>
          } />
          <Route path="/cancelled-orders" element={
            <ProtectedRoute><CancelledOrders /></ProtectedRoute>
          } />
          <Route path="/my-cashback" element={
            <ProtectedRoute><MyCashback /></ProtectedRoute>
          } />
          <Route path="/my-luckydraw" element={
            <ProtectedRoute><MyLuckyDraw /></ProtectedRoute>
          } />
          <Route path="/my-schemes" element={
            <ProtectedRoute><MySchemes /></ProtectedRoute>
          } />
          <Route path="/my-order" element={
            <ProtectedRoute><MyOrder /></ProtectedRoute>
          } />
          <Route path="/customer-activities" element={
            <ProtectedRoute><CustomerActivities /></ProtectedRoute>
          } />
          <Route path="/customer-signup" element={
            <ProtectedRoute><CustomerSignup /></ProtectedRoute>
          } />
          <Route path="/customer-lottery" element={
            <ProtectedRoute><CustomerLottery /></ProtectedRoute>
          } />
          <Route path="/customer-schemes" element={
            <ProtectedRoute><CustomerSchemes /></ProtectedRoute>
          } />
          <Route path="/customer-products" element={
            <ProtectedRoute><CustomerProducts /></ProtectedRoute>
          } />
          <Route path="/customer-cashback" element={
            <ProtectedRoute><CustomerCashback /></ProtectedRoute>
          } />
          <Route path="/wallet/my" element={
            <ProtectedRoute><MyWallet /></ProtectedRoute>
          } />
          <Route path="/wallet/commission" element={
            <ProtectedRoute><CommissionWallet /></ProtectedRoute>
          } />
          <Route path="/wallet/withdraw" element={
            <ProtectedRoute><WithdrawWallet /></ProtectedRoute>
          } />
          <Route path="/wallet/cashback" element={
            <ProtectedRoute><CashbackWallet /></ProtectedRoute>
          } />
          <Route path="/wallet/scheme" element={
            <ProtectedRoute><SchemeWallet /></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><NotificationsPage /></ProtectedRoute>
          } />
          <Route path="/help-support" element={
            <ProtectedRoute><HelpSupport /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}

export default App;