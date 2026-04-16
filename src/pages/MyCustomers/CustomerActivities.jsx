import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaBox, FaChartLine, FaTrophy,
    FaMoneyBillWave, FaHistory, FaSpinner,
    FaTimesCircle, FaRedo, FaEye, FaShoppingCart,
    FaLayerGroup, FaCoins, FaStar, FaUser, FaMobile,
} from 'react-icons/fa';

const CustomerActivities = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customer } = location.state || {};
    
    const [activities, setActivities] = useState({
        products: [],
        cashback: [],
        schemes: [],
        lottery: []
    });
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Memoize customer to prevent unnecessary re-renders
    const memoizedCustomer = useMemo(() => customer, [customer?.id]);

    // Get customer initials for avatar
    const getCustomerInitials = useCallback(() => {
        if (!memoizedCustomer) return '';
        const firstName = memoizedCustomer.firstName || '';
        const lastName = memoizedCustomer.lastName || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }, [memoizedCustomer]);

    // Get full customer name
    const getCustomerName = useCallback(() => {
        if (!memoizedCustomer) return 'Customer';
        const firstName = memoizedCustomer.firstName || '';
        const lastName = memoizedCustomer.lastName || '';
        return `${firstName} ${lastName}`.trim();
    }, [memoizedCustomer]);

    // Get customer phone
    const getCustomerPhone = useCallback(() => {
        return memoizedCustomer?.phone || memoizedCustomer?.mobile || memoizedCustomer?.phoneNumber || 'No phone';
    }, [memoizedCustomer]);

    // Load customer activities - optimized with useCallback
    const loadCustomerActivities = useCallback(() => {
        if (!memoizedCustomer) return;
        
        console.log('Loading activities for customer:', memoizedCustomer.id);
        setLoading(true);
        
        // Use requestAnimationFrame for smoother loading
        requestAnimationFrame(() => {
            try {
                // Load product purchases
                const purchases = JSON.parse(localStorage.getItem('product_purchases') || '[]');
                const customerProducts = purchases.filter(p => 
                    p.customerId === memoizedCustomer.id || 
                    p.customerName === getCustomerName() ||
                    p.customerPhone === getCustomerPhone() ||
                    p.customer === memoizedCustomer.id
                );

                // Load cashback transactions
                const cashbackTransactions = JSON.parse(localStorage.getItem('flh_transactions') || '[]');
                const customerCashbacks = cashbackTransactions.filter(t => 
                    (t.type === 'cashback' || t.category === 'cashback') && 
                    (t.customer === memoizedCustomer.id || 
                     t.customer === getCustomerName() ||
                     t.customerPhone === getCustomerPhone() ||
                     t.customerId === memoizedCustomer.id)
                );

                // Load scheme purchases
                const schemePurchases = JSON.parse(localStorage.getItem('flh_schemes') || '[]');
                const customerSchemes = schemePurchases.filter(s => 
                    s.customerId === memoizedCustomer.id || 
                    s.customerName === getCustomerName() ||
                    s.customerPhone === getCustomerPhone() ||
                    s.customer === memoizedCustomer.id
                );

                // Load lottery purchases
                const lotteryPurchases = JSON.parse(localStorage.getItem('flh_lottery') || '[]');
                const customerLottery = lotteryPurchases.filter(l => 
                    l.customerId === memoizedCustomer.id || 
                    l.customerName === getCustomerName() ||
                    l.customerPhone === getCustomerPhone() ||
                    l.customer === memoizedCustomer.id
                );

                // Batch all state updates together
                setActivities({
                    products: customerProducts,
                    cashback: customerCashbacks,
                    schemes: customerSchemes,
                    lottery: customerLottery
                });
                
            } catch (error) {
                console.error('Error loading activities:', error);
            } finally {
                // Add a small delay to prevent flicker
                setTimeout(() => {
                    setLoading(false);
                    setIsInitialLoad(false);
                }, 100);
            }
        });
    }, [memoizedCustomer, getCustomerName, getCustomerPhone]);

    // Initial load
    useEffect(() => {
        if (memoizedCustomer && isInitialLoad) {
            loadCustomerActivities();
        }
    }, [memoizedCustomer, isInitialLoad, loadCustomerActivities]);

    // Navigation functions
    const handleViewCustomerSchemes = useCallback(() => {
        navigate('/customer-schemes', { 
            state: { 
                customer: memoizedCustomer,
                schemes: activities.schemes 
            } 
        });
    }, [navigate, memoizedCustomer, activities.schemes]);

    const handleViewCustomerProducts = useCallback(() => {
        navigate('/customer-products', { 
            state: { 
                customer: memoizedCustomer,
                products: activities.products 
            } 
        });
    }, [navigate, memoizedCustomer, activities.products]);

    const handleViewCustomerCashback = useCallback(() => {
        navigate('/customer-cashback', { 
            state: { 
                customer: memoizedCustomer,
                cashbacks: activities.cashback 
            } 
        });
    }, [navigate, memoizedCustomer, activities.cashback]);

    const handleViewCustomerLottery = useCallback(() => {
        navigate('/customer-lottery', { 
            state: { 
                customer: memoizedCustomer,
                lotteries: activities.lottery 
            } 
        });
    }, [navigate, memoizedCustomer, activities.lottery]);

    const summaryCards = [
        {
            key: 'products',
            title: 'My Orders',
            count: activities.products.length,
            icon: FaBox,
            color: 'warning',
            onClick: handleViewCustomerProducts,
            description: 'View all product purchases'
        },
        {
            key: 'cashback',
            title: 'My Cashback',
            count: activities.cashback.length,
            icon: FaMoneyBillWave,
            color: 'success',
            onClick: handleViewCustomerCashback,
            description: 'View cashback transactions'
        },
        {
            key: 'schemes',
            title: 'My Schemes',
            count: activities.schemes.length,
            icon: FaChartLine,
            color: 'primary',
            onClick: handleViewCustomerSchemes,
            description: 'View scheme investments'
        },
        {
            key: 'lottery',
            title: 'My ELP',
            count: activities.lottery.length,
            icon: FaTrophy,
            color: 'info',
            onClick: handleViewCustomerLottery,
            description: 'View lucky draw tickets'
        }
    ];

    if (!memoizedCustomer) {
        return (
            <div className="container-fluid bg-light min-vh-100 p-3 d-flex align-items-center justify-content-center">
                <div className="text-center py-5">
                    <FaTimesCircle className="text-danger mb-3" size={60} />
                    <h3>Customer Not Found</h3>
                    <p className="text-muted">No customer data available</p>
                    <button className="btn btn-primary mt-3" onClick={() => navigate('/customer-signup')}>
                        Go to Customer List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light p-0" style={{ height: '100vh', overflow: 'hidden' }}>
            <div className="container-fluid h-100 d-flex flex-column p-0">
                {/* Header - Two containers like the example */}
                <div className="p-3">
                    {/* Container 1: Back Button */}
                    <div className="mb-3">
                        <div className="p-3">
                            <button
                                onClick={() => navigate('/customer-signup')}
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                            >
                                <FaArrowLeft className="me-2" />
                                Back to Customer List
                            </button>
                        </div>
                    </div>
                    
                    {/* Container 2: Customer Activities Title */}
                    <div className="card">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 me-3">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                                         style={{ width: '50px', height: '50px' }}>
                                        <FaHistory className="text-white" size={20} />
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h3 className="h1 fw-bold mb-1">
                                        Customer Activities
                                    </h3>
                                    {memoizedCustomer && (
                                        <div className="text-muted small">
                                            <FaUser className="me-1" />
                                            {customer.name} •
                                            <FaMobile className="ms-2 me-2"/>
                                            {customer.phone}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={loadCustomerActivities}
                                        disabled={loading}
                                    >
                                        <FaRedo className={`me-1 ${loading ? 'fa-spin' : ''}`} />
                                        {loading ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
<div className="card shadow-sm mb-4">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Customer Overview</h5>
                                    <div className="row align-items-center">
                                        <div className="col-md-3 text-center">
                                            <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                                                 style={{ width: '80px', height: '80px', fontSize: '28px', fontWeight: 'bold' }}>
                                                {getCustomerInitials() || <FaUser size={24} />}
                                            </div>
                                            <h5 className="mb-1">{customer.name}</h5>
                                            <small className="text-muted">{customer.phone}</small>
                                        </div>
                                        <div className="col-md-9">
                                            <div className="row text-center">
                                                <div className="col-md-3 mb-2">
                                                    <div className="text-muted small">Total Orders</div>
                                                    <div className="fw-bold fs-4 text-warning">{activities.products.length}</div>
                                                </div>
                                                <div className="col-md-3 mb-2">
                                                    <div className="text-muted small">Active Schemes</div>
                                                    <div className="fw-bold fs-4 text-primary">{activities.schemes.length}</div>
                                                </div>
                                                <div className="col-md-3 mb-2">
                                                    <div className="text-muted small">Cashback</div>
                                                    <div className="fw-bold fs-4 text-success">{activities.cashback.length}</div>
                                                </div>
                                                <div className="col-md-3 mb-2">
                                                    <div className="text-muted small">Lucky Draws</div>
                                                    <div className="fw-bold fs-4 text-info">{activities.lottery.length}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                {/* Activity Cards Section - Scrollable content */}
                <div className="flex-grow-1 overflow-auto p-3">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary mb-3" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted">Loading activities...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="row g-3 mb-4">
                                {summaryCards.map((card) => (
                                    <div key={card.key} className="col-md-3">
                                        <div 
                                            className="card h-100 shadow-sm border-0 hover-shadow cursor-pointer"
                                            onClick={card.onClick}
                                        >
                                            <div className={`card-body text-center p-3 bg-${card.color} bg-opacity-10`}>
                                                <div className={`text-${card.color} mb-2`}>
                                                    <card.icon size={36} />
                                                </div>
                                                <h2 className={`display-6 fw-bold text-${card.color} mb-1`}>
                                                    {card.count}
                                                </h2>
                                                <h6 className={`text-${card.color} mb-2`}>
                                                    {card.title}
                                                </h6>
                                                <p className="text-muted mb-0 small">
                                                    {card.description}
                                                </p>
                                                <div className="mt-3">
                                                    <button className={`btn btn-outline-${card.color} btn-sm`}>
                                                        <FaEye className="me-1" />
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerActivities;