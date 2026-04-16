// src/components/Sidebar.jsx (Updated - close after click)
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaUserCircle, FaTicketAlt, FaGift, FaShoppingCart, 
  FaMoneyBillWave, FaWallet, FaSignOutAlt, FaChevronDown, 
  FaChevronUp, FaClipboardList, FaRupeeSign, FaDownload, 
  FaCoins, FaInfoCircle, FaBox, FaUser, FaChartLine
} from 'react-icons/fa';
import { Nav, Button } from 'react-bootstrap';
import './Sidebar.css';

const Sidebar = ({ collapsed, mobileOpen, onClose, onNavigate, userType, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubMenus, setOpenSubMenus] = useState({});
  const isMobile = window.innerWidth <= 768;

  // Menu items based on user type
  const getMenuItems = () => {
    if (!userType) return [];

    const type = userType.toLowerCase();

    // Vendor menu
    if (type.includes('vendor')) {
      return [
        { id: 'dashboard', icon: <FaChartLine />, label: 'Dashboard', path: '/dashboard' },
        { id: 'profile', icon: <FaUserCircle />, label: 'Profile', path: '/profile' },
        { id: 'my-products', icon: <FaShoppingCart />, label: 'My Products', path: '/my-products' },
        { id: 'my-orders', icon: <FaClipboardList />, label: 'Orders', path: '/my-orders' },
        {
          id: 'wallet',
          icon: <FaWallet />,
          label: 'Wallet',
          hasSubmenu: true,
          submenuItems: [
            { id: 'myWallet', label: 'My Wallet', icon: <FaWallet />, path: '/wallet/my' },
            { id: 'withdrawWallet', label: 'Withdraw Wallet', icon: <FaDownload />, path: '/wallet/withdraw' }
          ]
        },
        { id: 'Help&Support', icon: <FaInfoCircle />, label: 'Help & Support', path: '/help-support' },
      ];
    }
    
    // Agent menu
    if (type.includes('agent')) {
      return [
        { id: 'home', icon: <FaHome />, label: 'Home', path: '/home' },
        { id: 'profile', icon: <FaUserCircle />, label: 'Profile', path: '/profile' },
        { id: 'customer-signup', icon: <FaUser />, label: 'My Customers', path: '/customer-activities' },
        { id: 'lucky-draw', icon: <FaTicketAlt />, label: 'Lucky Draws', path: '/lucky-draw' },
        { id: 'schemes', icon: <FaGift />, label: 'Schemes', path: '/schemes' },
        { id: 'products', icon: <FaBox />, label: 'Products', path: '/products' },
        { id: 'cashback', icon: <FaMoneyBillWave />, label: 'Cashback', path: '/cashback' },
        {
          id: 'wallet',
          icon: <FaWallet />,
          label: 'Wallet',
          hasSubmenu: true,
          submenuItems: [
            { id: 'myWallet', label: 'My Wallet', icon: <FaWallet />, path: '/wallet/my' },
            { id: 'withdrawWallet', label: 'Withdraw Wallet', icon: <FaDownload />, path: '/wallet/withdraw' },
            { id: 'commissionWallet', label: 'Commission Wallet', icon: <FaRupeeSign />, path: '/wallet/commission' },
          ]
        },
        { id: 'Help&Support', icon: <FaInfoCircle />, label: 'Help & Support', path: '/help-support' },
      ];
    }
    
    // Customer/Default menu
    return [
      { id: 'home', icon: <FaHome />, label: 'Home', path: '/home' },
      { id: 'profile', icon: <FaUserCircle />, label: 'Profile', path: '/profile' },
      { id: 'lucky-draw', icon: <FaTicketAlt />, label: 'Lucky Draws', path: '/lucky-draw' },
      { id: 'schemes', icon: <FaGift />, label: 'Schemes', path: '/schemes' },
      { id: 'products', icon: <FaShoppingCart />, label: 'Products', path: '/products' },
      { id: 'cashback', icon: <FaMoneyBillWave />, label: 'Earn Cashback', path: '/cashback' },
      {
        id: 'entries',
        icon: <FaClipboardList />,
        label: 'My Entries',
        hasSubmenu: true,
        submenuItems: [
          { id: 'my-luckydraw', label: 'My Lucky Draws', icon: <FaTicketAlt />, path: '/my-luckydraw' },
          { id: 'my-schemes', label: 'My Schemes', icon: <FaGift />, path: '/my-schemes' },
          { id: 'my-cashback', label: 'My Cashback', icon: <FaMoneyBillWave />, path: '/my-cashback' },
          { id: 'my-order', label: 'My Orders', icon: <FaShoppingCart />, path: '/my-order' }
        ]
      },
      {
        id: 'wallet',
        icon: <FaWallet />,
        label: 'Wallet',
        hasSubmenu: true,
        submenuItems: [
          { id: 'myWallet', label: 'My Wallet', icon: <FaWallet />, path: '/wallet/my' },
          { id: 'withdrawWallet', label: 'Withdraw Wallet', icon: <FaDownload />, path: '/wallet/withdraw' },
          { id: 'cashbackWallet', label: 'Cashback Wallet', icon: <FaGift />, path: '/wallet/cashback' },
          { id: 'schemeWallet', label: 'Scheme Wallet', icon: <FaCoins />, path: '/wallet/scheme' }
        ]
      },
      { id: 'Help&Support', icon: <FaInfoCircle />, label: 'Help & Support', path: '/help-support' },
    ];
  };

  const toggleSubMenu = (menuId) => {
    // Only allow submenu toggling when sidebar is expanded (not collapsed) OR on mobile
    if (!collapsed || isMobile) {
      setOpenSubMenus(prev => ({
        ...prev,
        [menuId]: !prev[menuId]
      }));
    }
  };

  const handleMenuItemClick = (item) => {
    if (item.hasSubmenu) {
      toggleSubMenu(item.id);
      return;
    }
    
    if (item.path) {
      navigate(item.path);
    }
    
    // Close sidebar after navigation on desktop
    if (!isMobile && onNavigate) {
      onNavigate();
    }
    
    // Close mobile sidebar if open
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleSubMenuItemClick = (subItem) => {
    if (subItem.path) {
      navigate(subItem.path);
    }
    
    // Close sidebar after navigation on desktop
    if (!isMobile && onNavigate) {
      onNavigate();
    }
    
    // Close mobile sidebar if open
    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (item) => {
    if (item.hasSubmenu && item.submenuItems) {
      return item.submenuItems.some(sub => isActivePath(sub.path));
    }
    return isActivePath(item.path);
  };

  const menuItems = getMenuItems();

  // On mobile, only render when mobileOpen is true
  if (isMobile && !mobileOpen) {
    return null;
  }

  return (
    <aside className={`sidebar ${collapsed && !isMobile ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-content">
        <Nav className="flex-column">
          {menuItems.map((item) => (
            <div key={item.id} className="sidebar-item">
              {item.hasSubmenu ? (
                <>
                  <div
                    className={`sidebar-link ${isParentActive(item) ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(item)}
                    title={collapsed && !isMobile ? item.label : ''}
                  >
                    <div className="sidebar-link-icon">{item.icon}</div>
                    {(!collapsed || isMobile) && (
                      <>
                        <span className="sidebar-link-label">{item.label}</span>
                        <span className="sidebar-link-arrow">
                          {openSubMenus[item.id] ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {(!collapsed || isMobile) && openSubMenus[item.id] && (
                    <div className="sidebar-submenu">
                      {item.submenuItems.map((subItem) => (
                        <div
                          key={subItem.id}
                          className={`sidebar-submenu-link ${isActivePath(subItem.path) ? 'active' : ''}`}
                          onClick={() => handleSubMenuItemClick(subItem)}
                        >
                          <span className="sidebar-submenu-icon">{subItem.icon}</span>
                          <span className="sidebar-submenu-label">{subItem.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className={`sidebar-link ${isActivePath(item.path) ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(item)}
                  title={collapsed && !isMobile ? item.label : ''}
                >
                  <div className="sidebar-link-icon">{item.icon}</div>
                  {(!collapsed || isMobile) && (
                    <span className="sidebar-link-label">{item.label}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </Nav>
        
        <div className="sidebar-footer">
          <Button
            variant="outline-danger"
            className="sidebar-logout-btn"
            onClick={() => {
              onLogout();
              if (!isMobile && onNavigate) {
                onNavigate();
              }
            }}
            title={collapsed && !isMobile ? "Logout" : ""}
          >
            <FaSignOutAlt />
            {(!collapsed || isMobile) && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;