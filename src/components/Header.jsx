// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaSearch, FaBell, FaUserCircle, FaSignOutAlt,
    FaWallet, FaRupeeSign, FaBars, FaTimes, FaStore, FaSignInAlt
} from 'react-icons/fa';
import { Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { fetchMywalletTransactions } from '../pages/wallets/mywalletApi';
import './Header.css';

const Header = ({ onLogout, toggleSidebar, sidebarCollapsed, mobileSidebarOpen, userType, isLoggedIn }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [myWalletBalance, setMyWalletBalance] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [user, setUser] = useState(null);
    const [walletLoading, setWalletLoading] = useState(false);

    const notificationsRef = useRef(null);
    const walletRef = useRef(null);

    // Auth pages where header is hidden
    const isAuthPage = location.pathname === '/login' ||
        location.pathname === '/signup' ||
        location.pathname === '/forgot-password';

    // Pages that show pre-login header
    const isPublicPage = location.pathname === '/' ||
        location.pathname === '/home' ||
        location.pathname === '/vendor-seller' ||
        location.pathname === '/vendor-register';

    const hideBecomeVendor = location.pathname === '/vendor-seller' ||
        location.pathname === '/vendor-register';

    // Load user data
    useEffect(() => {
        if (isLoggedIn) {
            const userDataString = localStorage.getItem('user_data');
            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    setUser({
                        id: localStorage.getItem('user_id'),
                        user_type: localStorage.getItem('user_type'),
                        first_name: userData.first_name || "",
                        last_name: userData.last_name || "",
                        email: userData.email || "",
                        phone: userData.phone_number || "",
                        avatar: userData.profileImage || null
                    });
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
    }, [isLoggedIn]);

    // Load wallet balance
    useEffect(() => {
    if (!isLoggedIn) return;

    // Load wallet when page loads
    loadWalletBalance();

    // Listen for wallet update events
    const handleWalletUpdate = () => {
        loadWalletBalance();
        // fallback from localStorage
    const savedWallets = localStorage.getItem('flh_wallets');
    if (savedWallets) {
        const wallets = JSON.parse(savedWallets);
        if (wallets.myWallet !== undefined) {
            setMyWalletBalance(wallets.myWallet);
        }
    }
    };

    window.addEventListener("wallet-updated", handleWalletUpdate);

    return () => {
        window.removeEventListener("wallet-updated", handleWalletUpdate);
    };
}, [isLoggedIn]);

    const loadWalletBalance = async () => {
        if (!isLoggedIn) return;

        setWalletLoading(true);
        try {
            const response = await fetchMywalletTransactions();
            let balance = 0;

            if (response && response.success && response.data?.summary?.current_balance) {
                balance = parseFloat(response.data.summary.current_balance) || 0;
            } else if (response && response.data?.summary?.current_balance) {
                balance = parseFloat(response.data.summary.current_balance) || 0;
            } else if (response && response.balance) {
                balance = parseFloat(response.balance) || 0;
            }

            setMyWalletBalance(balance);
        } catch (error) {
            console.error('Error loading wallet:', error);
            // Try localStorage fallback
            try {
                const savedWallets = localStorage.getItem('flh_wallets');
                if (savedWallets) {
                    const wallets = JSON.parse(savedWallets);
                    if (wallets.myWallet !== undefined) {
                        setMyWalletBalance(wallets.myWallet);
                    }
                }
            } catch (e) { }
        } finally {
            setWalletLoading(false);
        }
    };

    //   const handleLogout = () => {
    //     localStorage.removeItem('user_id');
    //     localStorage.removeItem('user_type');
    //     localStorage.removeItem('user_data');
    //     localStorage.removeItem('access_token');
    //     localStorage.removeItem('flh_wallets');

    //     if (onLogout) onLogout();
    //     navigate('/');
    //   };


    // src/components/Header.jsx - Update handleLogout function
    const handleLogout = () => {
        // Clear all localStorage items
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token');
        localStorage.removeItem('flh_wallets');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('is_authenticated');
        localStorage.removeItem('userCart');
        window.dispatchEvent(new CustomEvent('user-logout'));
        if (onLogout) onLogout();
        navigate('/login');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // Handle search
    };

    const handleWalletClick = () => {
        navigate('/wallet/my');
    };

    const getUserInitials = () => {
        if (!user) return "U";
        const first = user.first_name?.charAt(0) || "";
        const last = user.last_name?.charAt(0) || "";
        return (first + last).toUpperCase() || "U";
    };

    const getDisplayName = () => {
        if (!user) return "User";
        return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    };

    const getUserRoleDisplay = () => {
        if (!user || !user.user_type) return 'Customer';
        return user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1).replace(/_/g, ' ');
    };

    // Hide header on auth pages
    if (isAuthPage) return null;

    // Pre-login header
    if (!isLoggedIn && isPublicPage) {
        return (
            <header className="header header-pre-login">
                <div className="header-container">
                    <div className="header-left">
                        <img
                            src={'image.png'}
                            alt="Logo"
                            className="header-logo"
                            onClick={() => navigate('/')}
                        />
                    </div>

                    {/* <div className="header-center d-none d-md-block">
                        <form onSubmit={handleSearchSubmit} className="search-form">
                            <input
                                type="text"
                                placeholder="Search products, schemes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-button">
                                <FaSearch />
                            </button>
                        </form>
                    </div> */}

                    <div className="header-right">
                        {/* {!hideBecomeVendor && (
                            <Button
                                variant="warning"
                                className="btn-become-vendor"
                                onClick={() => navigate("/vendor-seller")}
                            >
                                <FaStore /> Become a Vendor
                            </Button>
                        )} */}
                        <Button
                            variant="light"
                            className="btn-login"
                            onClick={() => navigate('/login')}
                        >
                            <FaSignInAlt /> Login / Signup
                        </Button>
                    </div>
                </div>
            </header>
        );
    }

    // Logged-in header
    return (
        <header className="header header-logged-in">
            <div className="header-container">
                <div className="header-left">
                    <Button
                        variant="outline-light"
                        className="btn-menu-toggle"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {/* Show bars when collapsed, times when expanded */}
                        {sidebarCollapsed ? <FaBars /> : <FaTimes />}
                    </Button>

                    <img
                        src={'image.png'}
                        alt="Logo"
                        className="header-logo"
                        onClick={() => navigate('/home')}
                    />
                </div>

                {/* <div className="header-center d-none d-md-block">
                    <form onSubmit={handleSearchSubmit} className="search-form">
                        <input
                            type="text"
                            placeholder={
                                userType?.toLowerCase().includes('vendor') ? "Search products, orders..." :
                                    userType?.toLowerCase().includes('agent') ? "Search users, vendors, orders..." :
                                        "Search schemes, products, draws..."
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="search-button">
                            <FaSearch />
                        </button>
                    </form>
                </div> */}

                <div className="header-right">
                    {/* Wallet */}
                    <Button
                        variant="light"
                        className="btn-wallet"
                        onClick={handleWalletClick}
                        disabled={walletLoading}
                    >
                        <FaWallet />
                        <div className="wallet-balance">
                            <FaRupeeSign />
                            {walletLoading ? '...' : myWalletBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </div>
                    </Button>

                    {/* Notifications */}
                    {/* <div className="notification-wrapper">
                        <Button
                            variant="outline-light"
                            className="btn-notification"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <FaBell />
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </Button>
                    </div> */}

                    {/* Profile */}
                    <Dropdown show={showProfile} onToggle={(show) => setShowProfile(show)} align="end">
                        <Dropdown.Toggle variant="light" className="btn-profile">
                            <div className="profile-info">
                                <div className="profile-name">{getDisplayName()}</div>
                                <div className="profile-role">{getUserRoleDisplay()}</div>
                            </div>
                            <div className="profile-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={getDisplayName()} />
                                ) : (
                                    <span>{getUserInitials()}</span>
                                )}
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="profile-menu">
                            <Dropdown.Item onClick={() => navigate('/profile')}>
                                <FaUserCircle /> My Profile
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="text-danger">
                                <FaSignOutAlt /> Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
};

export default Header;