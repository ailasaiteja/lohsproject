import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserPlus, FaUsers, FaPhone,
    FaCheckCircle, FaArrowLeft,
    FaSearch, FaBox, FaChartLine, FaGift, FaTrophy,
    FaEye, FaSync
} from 'react-icons/fa';
import { customerApi } from './customerApi';
import LoadingToast from '../loading/LoadingToast';

const CustomerSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        gender: '', state: '', district: '', dob: '',
        password: '', confirmPassword: '', agreed: false
    });

    const [customers, setCustomers] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');

    // Fetch customers from API on component mount
    useEffect(() => {
        console.log('Component mounted, fetching customers...');
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('Auth check:', {
            hasToken: !!token,
            user: user,
            agentId: user?.id
        });
        
        if (!token) {
            setApiError('Please login to view customers');
            setDebugInfo('No authentication token found');
        } else {
            fetchCustomers();
        }
    }, []);

    // Filter customers based on search term
    useEffect(() => {
        console.log('Search term changed:', searchTerm);
        console.log('Current customers count:', customers.length);
        
        if (searchTerm.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(customer => {
                if (!customer) return false;

                const searchLower = searchTerm.toLowerCase();
                const firstName = (customer.firstName || customer.first_name || '').toLowerCase();
                const lastName = (customer.lastName || customer.last_name || '').toLowerCase();
                const fullName = `${firstName} ${lastName}`.toLowerCase();
                const phone = customer.phone || customer.phone_number || '';

                return (
                    firstName.includes(searchLower) ||
                    lastName.includes(searchLower) ||
                    fullName.includes(searchLower) ||
                    phone.includes(searchTerm)
                );
            });
            console.log('Filtered customers count:', filtered.length);
            setFilteredCustomers(filtered);
        }
    }, [searchTerm, customers]);

    const fetchCustomers = async () => {
        console.log('fetchCustomers function called');
        setApiLoading(true);
        setApiError(null);
        setDebugInfo('Fetching customers...');
        
        try {
            // Get authentication data
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            console.log('Auth data for API call:', {
                hasToken: !!token,
                userData: userData,
                agentId: userData?.id
            });

            if (!token) {
                throw new Error('No authentication token found');
            }

            // Try different possible agent ID sources
            const agentId = userData?.id || localStorage.getItem('agent_id') || '';
            
            console.log('Using agentId:', agentId);
            
            const response = await customerApi.getCustomers(agentId);
            
            console.log('Response from customerApi:', response);
            console.log('Response type:', typeof response);
            console.log('Is array?', Array.isArray(response));
            
            if (response && Array.isArray(response)) {
                console.log('Response is array with length:', response.length);
                
                if (response.length > 0) {
                    console.log('First customer raw data:', response[0]);
                    
                    // Transform API data
                    const transformedCustomers = response.map((customer, index) => {
                        console.log(`Transforming customer ${index}:`, customer);
                        
                        const transformed = {
                            id: customer.id,
                            firstName: customer.first_name || '',
                            lastName: customer.last_name || '',
                            email: customer.email || '',
                            phone: customer.phone_number || customer.phone || '',
                            gender: customer.gender || '',
                            state: customer.state || '',
                            district: customer.city || customer.district || '',
                            city: customer.city || '',
                            dob: customer.date_of_birth || customer.dob || '',
                            registrationDate: customer.created_at ? 
                                new Date(customer.created_at).toLocaleDateString('en-IN') : '',
                            status: customer.is_active ? 'Active' : 'Inactive',
                            is_active: customer.is_active,
                            user_type: customer.user_type,
                            tagged_agent: customer.tagged_agent,
                            avatar: `${(customer.first_name?.charAt(0) || 'C')}${(customer.last_name?.charAt(0) || 'U')}`.toUpperCase(),
                            purchases: 0,
                            cashbackPurchases: 0,
                            schemePurchases: 0,
                            lotteryTickets: 0,
                            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
                        };
                        
                        console.log(`Transformed customer ${index}:`, transformed);
                        return transformed;
                    });
                    
                    console.log('All transformed customers:', transformedCustomers);
                    console.log('Transformed customers count:', transformedCustomers.length);
                    
                    setCustomers(transformedCustomers);
                    setFilteredCustomers(transformedCustomers);
                    setDebugInfo(`Loaded ${transformedCustomers.length} customers successfully`);
                    setApiError(null);
                } else {
                    console.log('API returned empty array');
                    setCustomers([]);
                    setFilteredCustomers([]);
                    setDebugInfo('No customers found');
                }
            } else {
                console.error('Invalid response format - not an array:', response);
                setApiError('Received invalid data format from server');
                setDebugInfo('Error: Invalid response format');
                setCustomers([]);
                setFilteredCustomers([]);
            }
        } catch (error) {
            console.error('Error in fetchCustomers:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            // Handle specific error types
            if (error.message === 'No authentication token found') {
                setApiError('Please login to view customers');
            } else if (error.response?.status === 401) {
                setApiError('Session expired. Please login again');
            } else if (error.response?.status === 403) {
                setApiError('You do not have permission to view customers');
            } else {
                setApiError(`Failed to load customers: ${error.message}`);
            }
            
            setDebugInfo(`Error: ${error.message}`);
            setCustomers([]);
            setFilteredCustomers([]);
        } finally {
            setApiLoading(false);
            console.log('fetchCustomers completed');
        }
    };

    // Load customer activities from localStorage
    const updateCustomerStats = () => {
        console.log('Updating customer stats from localStorage');
        try {
            const purchases = JSON.parse(localStorage.getItem('product_purchases') || '[]');
            const allTransactions = JSON.parse(localStorage.getItem('flh_transactions') || '[]');
            const schemePurchases = JSON.parse(localStorage.getItem('flh_schemes') || '[]');
            const lotteryPurchases = JSON.parse(localStorage.getItem('flh_lottery') || '[]');

            console.log('LocalStorage data:', {
                purchases: purchases.length,
                transactions: allTransactions.length,
                schemes: schemePurchases.length,
                lottery: lotteryPurchases.length
            });

            const updatedCustomers = customers.map(customer => {
                if (!customer) return customer;

                const customerFullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
                const customerPhone = customer.phone || '';
                
                let customerPurchases = 0;
                let customerCashbacks = 0;
                let customerSchemes = 0;
                let customerLottery = 0;

                // Count product purchases
                purchases.forEach(purchase => {
                    const purchaseCustomerName = purchase.customerName || 
                        `${purchase.firstName || ''} ${purchase.lastName || ''}`.trim();
                    if (purchase.customerId === customer.id || 
                        purchaseCustomerName === customerFullName ||
                        purchase.customerPhone === customerPhone) {
                        customerPurchases++;
                    }
                });

                // Count cashback transactions
                allTransactions.forEach(transaction => {
                    if ((transaction.type === 'cashback' || transaction.category === 'cashback') &&
                        (transaction.customer === customer.id || 
                         transaction.customer === customerFullName ||
                         transaction.customerPhone === customerPhone ||
                         transaction.customerId === customer.id)) {
                        customerCashbacks++;
                    }
                });

                // Count scheme purchases
                schemePurchases.forEach(scheme => {
                    const schemeCustomerName = scheme.customerName || 
                        `${scheme.firstName || ''} ${scheme.lastName || ''}`.trim();
                    if (scheme.customerId === customer.id || 
                        schemeCustomerName === customerFullName ||
                        scheme.customerPhone === customerPhone) {
                        customerSchemes++;
                    }
                });

                // Count lottery purchases
                lotteryPurchases.forEach(lottery => {
                    const lotteryCustomerName = lottery.customerName || 
                        `${lottery.firstName || ''} ${lottery.lastName || ''}`.trim();
                    if (lottery.customerId === customer.id || 
                        lotteryCustomerName === customerFullName ||
                        lottery.customerPhone === customerPhone) {
                        customerLottery++;
                    }
                });

                return {
                    ...customer,
                    purchases: customerPurchases,
                    cashbackPurchases: customerCashbacks,
                    schemePurchases: customerSchemes,
                    lotteryTickets: customerLottery
                };
            });

            console.log('Updated customers with stats:', updatedCustomers);
            setCustomers(updatedCustomers);
        } catch (error) {
            console.error('Error updating customer stats:', error);
        }
    };

    // Load activities when customers change
    useEffect(() => {
        if (customers.length > 0) {
            console.log('Customers updated, updating stats...');
            updateCustomerStats();
        }
    }, [customers.length]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // ... your existing submit logic
    };

    const handleViewActivities = (customer) => {
        navigate('/customer-activities', { state: { customer } });
    };

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    const states = [
        { value: 'AP', label: 'Andhra Pradesh', districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Anakapalle', 'Annavaram', 'Tuni', 'Narsipatnam', 'Yelemanchali'] },
        { value: 'TS', label: 'Telangana', districts: ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'] },
        { value: 'KA', label: 'Karnataka', districts: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'] },
        { value: 'TN', label: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'] },
        { value: 'MH', label: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'] },
        { value: 'DL', label: 'Delhi', districts: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi'] }
    ];

    const getDistricts = () => {
        const selectedState = states.find(state => state.value === formData.state);
        return selectedState ? selectedState.districts : [];
    };

    const getTotalStats = () => {
        return {
            totalCustomers: customers.length,
            activeBuyers: customers.filter(c => (c.purchases || 0) > 0).length,
            cashbackCustomers: customers.filter(c => (c.cashbackPurchases || 0) > 0).length,
            schemeCustomers: customers.filter(c => (c.schemePurchases || 0) > 0).length,
            lotteryCustomers: customers.filter(c => (c.lotteryTickets || 0) > 0).length
        };
    };

    const stats = getTotalStats();

    const styles = `
        .customer-container { position: relative; z-index: 1; }
        .table-responsive { position: relative; z-index: 1; }
        .sticky-header { position: sticky; top: 0; background: white; z-index: 2; }
        .alert-success { z-index: 1000; }
        .customer-management-container { min-height: 100vh; position: relative; overflow-x: hidden; }
        .customer-table-container { position: relative; z-index: 10; }
        .container-fluid { position: relative; z-index: 10; }
        .customer-name-cell { max-width: 200px; }
        .customer-avatar { width: 40px; height: 40px; font-weight: bold; font-size: 16px; }
        .activities-compact { display: flex; flex-wrap: wrap; gap: 4px; }
        .activity-item-compact { display: flex; flex-direction: column; align-items: center; padding: 3px 6px; border-radius: 4px; min-width: 65px; }
        .activity-count-compact { font-size: 14px; font-weight: bold; line-height: 1; }
        .activity-label-compact { font-size: 9px; color: #6c757d; text-align: center; line-height: 1.1; }
        .table th, .table td { padding: 8px 12px; vertical-align: middle; }
        .customer-row { height: 60px; }
        .view-btn { padding: 4px 8px; font-size: 12px; white-space: nowrap; }
        .debug-info { background: #f8f9fa; padding: 10px; margin-bottom: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; border-left: 3px solid #17a2b8; }
    `;

    const renderCustomerList = () => (
        <div className="container-fluid bg-light min-vh-100 p-3 customer-management-container">
            <style>{styles}</style>
            
            
            
            {showSuccess && (
                <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 9999 }}>
                    <div className="alert alert-success d-flex align-items-center shadow">
                        <FaCheckCircle className="me-2" />
                        Customer registered successfully!
                    </div>
                </div>
            )}

            {apiError && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                    <span>{apiError}</span>
                    {apiError.includes('login') ? (
                        <button 
                            className="btn btn-sm btn-primary ms-3"
                            onClick={handleLoginRedirect}
                        >
                            Go to Login
                        </button>
                    ) : (
                        <button 
                            className="btn btn-sm btn-outline-danger ms-3"
                            onClick={fetchCustomers}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="mb-4">
                <div className="mb-3">
                    <div className="p-3">
                        <button
                            onClick={() => navigate('/home')}
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                        >
                            <FaArrowLeft className="me-2" />
                            Back to Home
                        </button>
                    </div>
                </div>
                
                <div className="card">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                                     style={{ width: '50px', height: '50px' }}>
                                    <FaUsers className="text-white" size={20} />
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h3 className="h1 fw-bold mb-1">
                                    Customer Management
                                </h3>
                                <div className="text-muted small">
                                    Manage customer registrations and view activities
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={() => setViewMode('form')}
                                    className="btn btn-danger d-flex align-items-center"
                                >
                                    <FaUserPlus className="me-2" />
                                    Add New Customer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Stats */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-primary border-start border-4">
                        <div className="card-body text-center py-2">
                            <h2 className="card-title text-primary mb-1">{stats.totalCustomers}</h2>
                            <p className="card-text text-muted mb-0 small">Total Customers</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-success border-start border-4">
                        <div className="card-body text-center py-2">
                            <h2 className="card-title text-success mb-1">{stats.activeBuyers}</h2>
                            <p className="card-text text-muted mb-0 small">Active Buyers</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-info border-start border-4">
                        <div className="card-body text-center py-2">
                            <h2 className="card-title text-info mb-1">{stats.schemeCustomers}</h2>
                            <p className="card-text text-muted mb-0 small">Scheme Customers</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-warning border-start border-4">
                        <div className="card-body text-center py-2">
                            <h2 className="card-title text-warning mb-1">{stats.cashbackCustomers}</h2>
                            <p className="card-text text-muted mb-0 small">Cashback Customers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="card shadow-sm mb-4">
                <div className="card-body py-2">
                    <div className="d-flex align-items-center">
                        <div className="input-group flex-grow-1">
                            <span className="input-group-text bg-white border-end-0 py-1">
                                <FaSearch className="text-muted" size={14} />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 py-1"
                                placeholder="Search customers by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={apiError && apiError.includes('login')}
                            />
                        </div>
                        
                        <button
                            className="btn btn-outline-secondary btn-sm ms-2 d-flex align-items-center"
                            onClick={fetchCustomers}
                        >
                            <FaSync />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Customer List Table */}
            <div className="card shadow-sm customer-table-container">
                <div className="card-body p-2">
                    <div className="d-flex justify-content-between align-items-center mb-2 sticky-header">
                        <h5 className="card-title mb-2">Customer List</h5>
                        <div className="text-muted small">
                            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {apiLoading ? (
                        <LoadingToast show={apiLoading} />
                    ) : filteredCustomers.length > 0 ? (
                        <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                            <table className="table table-hover mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th width="25%">Customer</th>
                                        <th width="25%">Phone</th>
                                        <th width="30%">Activities Count</th>
                                        <th width="20%">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="customer-row">
                                            <td className="customer-name-cell">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 customer-avatar">
                                                        {customer.avatar || 
                                                         `${(customer.firstName || 'C').charAt(0)}${(customer.lastName || 'U').charAt(0)}`.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold fs-6">
                                                            {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()}
                                                        </div>
                                                        <small className="text-muted">{customer.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <FaPhone className="text-muted me-1" size={12} />
                                                    <span className="fw-medium small">{customer.phone || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="activities-compact">
                                                    <div className="activity-item-compact bg-warning bg-opacity-10">
                                                        <div className="activity-count-compact text-warning">{customer.purchases || 0}</div>
                                                        <div className="activity-label-compact">Orders</div>
                                                    </div>
                                                    <div className="activity-item-compact bg-success bg-opacity-10">
                                                        <div className="activity-count-compact text-success">{customer.cashbackPurchases || 0}</div>
                                                        <div className="activity-label-compact">Cashback</div>
                                                    </div>
                                                    <div className="activity-item-compact bg-primary bg-opacity-10">
                                                        <div className="activity-count-compact text-primary">{customer.schemePurchases || 0}</div>
                                                        <div className="activity-label-compact">Schemes</div>
                                                    </div>
                                                    <div className="activity-item-compact bg-info bg-opacity-10">
                                                        <div className="activity-count-compact text-info">{customer.lotteryTickets || 0}</div>
                                                        <div className="activity-label-compact">ELP</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => handleViewActivities(customer)}
                                                    className="btn btn-primary btn-sm view-btn d-flex align-items-center justify-content-center"
                                                    style={{ width: 'fit-content' }}
                                                >
                                                    <FaEye className="me-1" size={12} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <FaUsers className="text-muted mb-2" size={50} />
                            <h5 className="text-muted mb-2">
                                {searchTerm ? 'No customers found' : 'No Customers Yet'}
                            </h5>
                            <p className="text-muted mb-3 small">
                                {searchTerm
                                    ? 'Try a different search term'
                                    : 'You haven\'t registered any customers yet. Start by adding your first customer.'}
                            </p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFormData({
                                        firstName: '', lastName: '', email: '', phone: '',
                                        gender: '', state: '', district: '', dob: '',
                                        password: '', confirmPassword: '', agreed: false
                                    });
                                    setViewMode('form');
                                }}
                                className="btn btn-danger btn-sm d-inline-flex align-items-center"
                                disabled={apiError && apiError.includes('login')}
                            >
                                <FaUserPlus className="me-2" />
                                {searchTerm ? 'Add New Customer' : 'Register First Customer'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSignupForm = () => (
        <div className="container-fluid bg-light min-vh-100 p-3">
            <style>{styles}</style>
            
            <div className="container" style={{ maxWidth: '600px' }}>
                {showSuccess && (
                    <div className="alert alert-success d-flex align-items-center mb-3">
                        <FaCheckCircle className="me-2" />
                        Customer registered successfully!
                    </div>
                )}

                <div className="mb-4">
                    <div className="mb-3">
                        <div className="p-3">
                            <button
                                onClick={() => setViewMode('list')}
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                            >
                                <FaArrowLeft className="me-2" />
                                Back to Customer List
                            </button>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 me-3">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                                         style={{ width: '50px', height: '50px' }}>
                                        <FaUserPlus className="text-white" size={20} />
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h3 className="h1 fw-bold mb-1">
                                        Register Customer
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm mb-4">
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                            {/* Your form fields */}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        className="form-control"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        className="form-control"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-control"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Gender</label>
                                    <select
                                        name="gender"
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        className="form-control"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">State</label>
                                    <select
                                        name="state"
                                        className="form-select"
                                        value={formData.state}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {states.map(state => (
                                            <option key={state.value} value={state.value}>{state.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    {formData.state && (
                                        <>
                                            <label className="form-label">District/City</label>
                                            <select
                                                name="district"
                                                className="form-select"
                                                value={formData.district}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select District</option>
                                                {getDistricts().map(district => (
                                                    <option key={district} value={district}>{district}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-control"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-check mb-4">
                                <input
                                    type="checkbox"
                                    name="agreed"
                                    className="form-check-input"
                                    checked={formData.agreed}
                                    onChange={handleChange}
                                    required
                                    id="termsCheck"
                                />
                                <label className="form-check-label" htmlFor="termsCheck">
                                    I agree to Terms & Conditions
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-danger w-100 py-2"
                            >
                                {isLoading ? 'Registering...' : 'Register Customer'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

    return viewMode === 'list' ? renderCustomerList() : renderSignupForm();
};

export default CustomerSignup;