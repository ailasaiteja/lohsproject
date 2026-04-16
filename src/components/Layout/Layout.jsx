// src/components/Layout/Layout.jsx (Updated - sidebar collapsed by default)
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Layout.css';

const Layout = ({ children, onLogout }) => {
  const location = useLocation();
  // Set sidebarCollapsed to true by default (closed/icon only mode)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth pages where layout should be hidden completely
  const isAuthPage = location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password';

  // Function to check login status
  const checkLoginStatus = () => {
    const userId = localStorage.getItem('user_id');
    const userTypeStorage = localStorage.getItem('user_type');
    const isLoggedInStorage = !!userId;
    
    setIsLoggedIn(isLoggedInStorage);
    setUserType(userTypeStorage);
    setIsLoading(false);
    
    return isLoggedInStorage;
  };

  // Initial check
  useEffect(() => {
    checkLoginStatus();
    
    // Listen for login success event
    const handleLoginSuccess = () => {
      console.log('Login success event received, updating layout...');
      checkLoginStatus();
      // Keep sidebar collapsed on login
      setSidebarCollapsed(true);
      setMobileSidebarOpen(false);
    };
    
    // Listen for storage changes (for logout)
    const handleStorageChange = (e) => {
      if (e.key === 'user_id' || e.key === 'user_type' || e.key === null) {
        console.log('Storage changed, updating layout...');
        checkLoginStatus();
      }
    };
    
    window.addEventListener('user-login-success', handleLoginSuccess);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('user-login-success', handleLoginSuccess);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close mobile sidebar on route change and collapse desktop sidebar
  useEffect(() => {
    setMobileSidebarOpen(false);
    // On route change, collapse sidebar to icon-only mode
    if (window.innerWidth > 768) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSidebarOpen(false);
        // On desktop, keep collapsed state when resizing
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      // On desktop, toggle between collapsed (icon-only) and expanded (full)
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Don't show layout on auth pages (login, signup, etc.)
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For non-logged-in users: only show header, no sidebar
  if (!isLoggedIn) {
    return (
      <>
        <Header 
          onLogout={onLogout} 
          toggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          userType={userType}
          isLoggedIn={isLoggedIn}
        />
        <div className="main-content-wrapper">
          <div className="content-area-full">
            {children}
          </div>
        </div>
      </>
    );
  }

  // For logged-in users: show header + sidebar (collapsed by default)
  return (
    <div className="app-layout">
      <Header 
        onLogout={onLogout}
        toggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        userType={userType}
        isLoggedIn={isLoggedIn}
      />
      
      <div className="main-layout">
        <Sidebar 
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onNavigate={() => {
            // Close sidebar after navigation on desktop
            if (window.innerWidth > 768) {
              setSidebarCollapsed(true);
            }
          }}
          userType={userType}
          onLogout={onLogout}
        />
        
        <div className={`content-area-with-sidebar ${sidebarCollapsed && window.innerWidth > 768 ? 'sidebar-collapsed' : ''}`}>
          {children}
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;