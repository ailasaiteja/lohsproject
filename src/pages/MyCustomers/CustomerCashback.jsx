import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaMoneyBillWave, FaPlus, FaClock,
    FaCheckCircle, FaEye, FaCoins,
    FaRupeeSign, FaExclamationTriangle, FaCreditCard,
    FaGift, FaTimesCircle, FaCalendarAlt, FaCheck,
    FaUser, FaPhone, FaTicketAlt, FaUserPlus,
    FaSpinner, FaMinus, FaWallet,
    FaMobile, FaSync
} from 'react-icons/fa';
import { customerCashbackApi } from './customerCashbackApi';

const CustomerCashback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customer, cashbacks, selectedCashback } = location.state || {};
    
    const [loading, setLoading] = useState(true);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [cashbackList, setCashbackList] = useState([]);
    const [selectedCb, setSelectedCb] = useState(null);
    const [showCashbackDetails, setShowCashbackDetails] = useState(false);
    const [activeTab, setActiveTab] = useState('current');
    const [showBuyMoreForm, setShowBuyMoreForm] = useState(false);
    const [ticketCount, setTicketCount] = useState(1);
    const [selectedCashbackToJoin, setSelectedCashbackToJoin] = useState(null);
    
    // Wallet state
    const [walletBalance, setWalletBalance] = useState(0);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    // Initialize storage and load wallet balance
    useEffect(() => {
        if (!localStorage.getItem('flh_cashbacks')) {
            localStorage.setItem('flh_cashbacks', JSON.stringify([]));
        }
        if (!localStorage.getItem('flh_transactions')) {
            localStorage.setItem('flh_transactions', JSON.stringify([]));
        }
        
        // Load wallet balance
        loadWalletBalance();
    }, []);

    // Load data when customer is available
    useEffect(() => {
        if (customer && customer.id) {
            fetchCashbacksFromAPI();
        } else {
            setLoading(false);
        }
    }, [customer]);

    // Fetch cashbacks from API
    const fetchCashbacksFromAPI = async () => {
        console.log('Fetching cashbacks from API for customer:', customer?.id);
        setApiLoading(true);
        setApiError(null);
        setDebugInfo('Fetching cashbacks from API...');
        
        try {
            if (!customer || !customer.id) {
                setDebugInfo('No customer ID available');
                setApiError('Customer ID is required');
                setApiLoading(false);
                setLoading(false);
                return;
            }

            // Pass the customer ID to the API
            const response = await customerCashbackApi.getAgentReferredECBs(customer.id);
            console.log('API Response in component:', response);
            
            // Check if response has success and ecbs array
            if (response && response.success === true) {
                if (Array.isArray(response.ecbs) && response.ecbs.length > 0) {
                    setDebugInfo(`Received ${response.ecbs.length} cashbacks from API`);
                    
                    // Transform API data to match your component's format
                    const transformedCashbacks = transformAPICashbacks(response.ecbs);
                    setCashbackList(transformedCashbacks);
                } else {
                    // No cashbacks found for this customer
                    console.log('No cashbacks found from API');
                    setDebugInfo('No cashbacks found from API');
                    setCashbackList([]);
                }
            } else {
                console.log('API returned unsuccessful response');
                setDebugInfo('API returned unsuccessful response');
                setApiError('Failed to fetch cashbacks');
                setCashbackList([]);
            }
        } catch (error) {
            console.error('Error fetching from API:', error);
            setApiError(`Failed to fetch cashbacks: ${error.message}`);
            setDebugInfo(`Error: ${error.message}`);
            setCashbackList([]);
        } finally {
            setApiLoading(false);
            setLoading(false);
        }
    };

    // Transform API cashbacks to component format
    const transformAPICashbacks = (apiCashbacks) => {
        if (!apiCashbacks || !Array.isArray(apiCashbacks)) {
            return [];
        }
        
        return apiCashbacks.map(cb => {
            // Get all tickets for this cashback
            const tickets = cb.tickets || [];
            const totalTickets = tickets.length;
            
            // Calculate total amount based on ticket prices
            const totalAmount = tickets.reduce((sum, ticket) => {
                return sum + (parseFloat(ticket.bill_price) || 0);
            }, 0);
            
            // Ticket price from the draw
            const ticketPrice = parseFloat(cb.ticket_price) || 0;
            
            // Parse dates
            const purchaseDate = new Date(cb.start_date || cb.created_at);
            const endDate = new Date(cb.end_date);
            const announceDate = new Date(cb.announcement_date);
            
            // Calculate expiry (30 days from end date or announce date)
            const expiryDate = new Date(announceDate);
            expiryDate.setDate(expiryDate.getDate() + 30);
            
            const today = new Date();
            const isExpired = expiryDate < today;

            return {
                id: cb.id,
                title: cb.title || 'Saturday Cashback',
                description: cb.description || '',
                drawName: cb.title || 'Saturday Cashback',
                baseType: cb.title || 'Saturday Cashback',
                ticketPrice: ticketPrice,
                totalTickets: totalTickets,
                totalAmount: totalAmount,
                startDate: purchaseDate.toISOString(),
                endDate: endDate.toISOString(),
                announceDate: announceDate.toISOString(),
                expiryDate: expiryDate.toISOString(),
                isExpired: isExpired,
                status: isExpired ? 'completed' : 'current',
                tickets: tickets.map(ticket => ({
                    id: ticket.id,
                    ticketNumber: ticket.ticket_number,
                    billPrice: parseFloat(ticket.bill_price) || 0,
                    purchaseTime: ticket.purchase_time
                })),
                displayTitle: cb.title || 'Saturday Cashback'
            };
        });
    };

    // Load wallet balance
    const loadWalletBalance = () => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            if (savedWallets) {
                const wallets = JSON.parse(savedWallets);
                setWalletBalance(wallets.myWallet || 0);
            }
        } catch (error) {
            console.error('Error loading wallet balance:', error);
        }
    };

    // Handle back to activities
    const handleBackToActivities = useCallback(() => {
        navigate('/customer-activities', { 
            state: { 
                customer,
                cashbacks: cashbackList
            } 
        });
    }, [navigate, customer, cashbackList]);

    // Handle buying more tickets (to be implemented based on your business logic)
    const handleBuyMoreTickets = () => {
        alert('Buy more tickets functionality to be implemented');
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const filteredCashbacks = useMemo(() => {
        return cashbackList.filter(cb => {
            if (activeTab === 'current') return !cb.isExpired;
            if (activeTab === 'completed') return cb.isExpired;
            return true;
        });
    }, [cashbackList, activeTab]);

    if (!customer) {
        return (
            <div className="container-fluid bg-light min-vh-100 p-3 d-flex align-items-center justify-content-center">
                <div className="text-center py-5">
                    <FaTimesCircle className="text-danger mb-3" size={60} />
                    <h3>Customer Not Found</h3>
                    <button className="btn btn-primary mt-3" onClick={() => navigate('/customer-activities')}>
                        Go to Customer List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light p-3 min-vh-100">
            
            

            {/* Header */}
            <div className="mb-4">
                <div className="mb-3">
                    <button
                        onClick={handleBackToActivities}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                    >
                        <FaArrowLeft className="me-2" />
                        Back to Activities
                    </button>
                </div>
                
                <div className="card">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                    <FaMoneyBillWave className="text-white" size={20} />
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h3 className="h4 fw-bold mb-1">
                                    My Electronic Cashback
                                </h3>
                                {customer && (
                                    <div className="text-muted small">
                                        <FaUser className="me-1" />
                                        {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()} • 
                                        <FaMobile className="ms-2 me-1" />
                                        {customer.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex gap-2">
                        <button
                            className={`btn ${activeTab === 'current' ? 'btn-success' : 'btn-outline-success'} d-flex align-items-center`}
                            onClick={() => setActiveTab('current')}
                        >
                            <FaClock className="me-2" />
                            Current ({cashbackList.filter(cb => !cb.isExpired).length})
                        </button>
                        <button
                            className={`btn ${activeTab === 'completed' ? 'btn-success' : 'btn-outline-success'} d-flex align-items-center`}
                            onClick={() => setActiveTab('completed')}
                        >
                            <FaCheckCircle className="me-2" />
                            Completed ({cashbackList.filter(cb => cb.isExpired).length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Cashback List */}
            {loading || apiLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-success mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading your cashbacks...</p>
                </div>
            ) : filteredCashbacks.length === 0 ? (
                <div className="text-center py-5">
                    <FaMoneyBillWave className="text-muted mb-3" size={48} />
                    <h5>No {activeTab === 'current' ? 'active' : 'completed'} cashbacks found</h5>
                    <p className="text-muted">
                        {activeTab === 'current' 
                            ? "You don't have any active cashbacks yet."
                            : "You don't have any completed cashbacks yet."}
                    </p>
                </div>
            ) : (
                <div className="row">
                    {filteredCashbacks.map((cashback, index) => (
                        <div key={cashback.id || index} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-header text-white" style={{ backgroundColor: '#28a745' }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-0">
                                                <FaMoneyBillWave className="me-2" />
                                                {cashback.displayTitle}
                                            </h6>
                                            <small className="opacity-75">
                                                Electronic Cashback
                                            </small>
                                        </div>
                                        <span className={`badge bg-${cashback.isExpired ? 'secondary' : 'light text-dark'}`}>
                                            {cashback.isExpired ? 'EXPIRED' : 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* Cashback Info */}
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Ticket Price:</div>
                                            <div className="fw-bold text-primary">
                                                <FaRupeeSign className="me-1" />
                                                {cashback.ticketPrice.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Total Tickets:</div>
                                            <div className="fw-bold">
                                                <FaTicketAlt className="me-1" />
                                                {cashback.totalTickets}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Total Amount:</div>
                                            <div className="fw-bold text-success">
                                                <FaRupeeSign className="me-1" />
                                                {cashback.totalAmount.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Expiry Date:</div>
                                            <div className="fw-bold">
                                                <FaCalendarAlt className="me-1" />
                                                {formatDate(cashback.expiryDate)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-outline-success flex-fill"
                                            onClick={() => {
                                                setSelectedCb(cashback);
                                                setShowCashbackDetails(true);
                                            }}
                                        >
                                            <FaEye className="me-1" />
                                            View Details
                                        </button>
                                        
                                        {!cashback.isExpired && (
                                            <button 
                                                className="btn btn-sm btn-success flex-fill"
                                                onClick={() => {
                                                    setSelectedCashbackToJoin(cashback);
                                                    setShowBuyMoreForm(true);
                                                }}
                                            >
                                                <FaPlus className="me-1" />
                                                Buy More
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Cashback Details Modal */}
            {showCashbackDetails && selectedCb && (
                <div className="modal show d-block" style={{ 
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1050 
                }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <div className="d-flex justify-content-between align-items-center w-100">
                                    <div>
                                        <h5 className="modal-title mb-1">
                                            <FaMoneyBillWave className="me-2" />
                                            {selectedCb.displayTitle}
                                        </h5>
                                        <div className="small">
                                            <FaUser className="me-1" />
                                            {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()}
                                            <FaPhone className="ms-3 me-1" />
                                            {customer.phone}
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowCashbackDetails(false)}
                                    ></button>
                                </div>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="text-center mb-4">
                                    <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                         style={{ width: '80px', height: '80px' }}>
                                        <FaMoneyBillWave size={32} />
                                    </div>
                                    <h4 className="fw-bold">{selectedCb.displayTitle}</h4>
                                    <div className={`badge bg-${selectedCb.isExpired ? 'secondary' : 'success'} fs-6`}>
                                        {selectedCb.isExpired ? 'EXPIRED' : 'ACTIVE'}
                                    </div>
                                </div>

                                {/* Cashback Summary */}
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <h6 className="card-title text-success mb-3">
                                            <FaMoneyBillWave className="me-2" />
                                            Cashback Summary
                                        </h6>
                                        <div className="row text-center">
                                            <div className="col-md-4 mb-3">
                                                <div className="border rounded p-3">
                                                    <div className="text-muted small">Ticket Price</div>
                                                    <div className="fw-bold fs-4 text-primary">
                                                        ₹{selectedCb.ticketPrice.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <div className="border rounded p-3">
                                                    <div className="text-muted small">Total Tickets</div>
                                                    <div className="fw-bold fs-4">
                                                        {selectedCb.totalTickets}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <div className="border rounded p-3">
                                                    <div className="text-muted small">Total Amount</div>
                                                    <div className="fw-bold fs-4 text-primary">
                                                        ₹{selectedCb.totalAmount.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row text-center">
                                            <div className="col-md-6 mb-3">
                                                <div className="border rounded p-3">
                                                    <div className="text-muted small">Start Date</div>
                                                    <div className="fw-bold">
                                                        <FaCalendarAlt className="me-2 text-muted" />
                                                        {formatDate(selectedCb.startDate)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <div className="border rounded p-3">
                                                    <div className="text-muted small">Expiry Date</div>
                                                    <div className="fw-bold">
                                                        <FaCalendarAlt className="me-2 text-muted" />
                                                        {formatDate(selectedCb.expiryDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase History */}
                                {selectedCb.tickets && selectedCb.tickets.length > 0 && (
                                    <div className="card mb-4">
                                        <div className="card-body">
                                            <h6 className="card-title text-success mb-3">
                                                <FaCalendarAlt className="me-2" />
                                                Purchase History
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-sm mb-0">
                                                    <thead className="bg-light">
                                                        <tr>
                                                            <th>Purchase Type</th>
                                                            <th>Date</th>
                                                            <th>Tickets</th>
                                                            <th>Ticket Price</th>
                                                            <th>Amount (₹)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Group tickets by purchase date */}
                                                        {Object.entries(
                                                            selectedCb.tickets.reduce((groups, ticket) => {
                                                                const date = new Date(ticket.purchaseTime).toLocaleDateString();
                                                                if (!groups[date]) {
                                                                    groups[date] = [];
                                                                }
                                                                groups[date].push(ticket);
                                                                return groups;
                                                            }, {})
                                                        ).map(([date, tickets], index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <span className="badge bg-primary">Initial</span>
                                                                </td>
                                                                <td>
                                                                    <FaCalendarAlt className="me-2 text-muted" />
                                                                    {date}
                                                                </td>
                                                                <td className="fw-bold">{tickets.length} tickets</td>
                                                                <td className="text-muted">₹{selectedCb.ticketPrice.toFixed(2)}</td>
                                                                <td className="fw-bold text-primary">
                                                                    ₹{tickets.reduce((sum, t) => sum + t.billPrice, 0).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Total Row */}
                                                        <tr className="table-warning">
                                                            <td className="fw-bold" colSpan="2">TOTAL</td>
                                                            <td className="fw-bold">
                                                                {selectedCb.totalTickets} tickets
                                                            </td>
                                                            <td className="fw-bold">₹{selectedCb.ticketPrice.toFixed(2)}</td>
                                                            <td className="fw-bold text-primary">
                                                                ₹{selectedCb.totalAmount.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowCashbackDetails(false)}
                                >
                                    Close
                                </button>
                                {!selectedCb.isExpired && (
                                    <button 
                                        className="btn btn-success"
                                        onClick={() => {
                                            setSelectedCashbackToJoin(selectedCb);
                                            setShowBuyMoreForm(true);
                                            setShowCashbackDetails(false);
                                        }}
                                    >
                                        <FaPlus className="me-1" />
                                        Buy More Tickets
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Buy More Form Modal */}
            {showBuyMoreForm && selectedCashbackToJoin && (
                <div className="modal show d-block" style={{ 
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1060
                }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    <FaPlus className="me-2" />
                                    Buy More Tickets
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowBuyMoreForm(false);
                                        setSelectedCashbackToJoin(null);
                                        setTicketCount(1);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info mb-3">
                                    <FaExclamationTriangle className="me-2" />
                                    This feature is coming soon.
                                </div>
                                
                                <div className="text-center mb-4">
                                    <h5>{selectedCashbackToJoin.displayTitle}</h5>
                                    <p className="text-muted">Ticket Price: ₹{selectedCashbackToJoin.ticketPrice.toFixed(2)}</p>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="form-label fw-bold mb-3">Select Additional Tickets</label>
                                    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                                        <button 
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                if (ticketCount > 1) {
                                                    setTicketCount(ticketCount - 1);
                                                }
                                            }}
                                            disabled={ticketCount <= 1}
                                        >
                                            <FaMinus />
                                        </button>
                                        <div className="text-center">
                                            <div className="display-4 fw-bold text-primary">
                                                {ticketCount}
                                            </div>
                                            <div className="text-muted">additional tickets</div>
                                        </div>
                                        <button 
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                if (ticketCount < 20) {
                                                    setTicketCount(ticketCount + 1);
                                                }
                                            }}
                                            disabled={ticketCount >= 20}
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="card border-success mb-4">
                                    <div className="card-body">
                                        <h6 className="card-title text-success d-flex align-items-center">
                                            <FaUser className="me-2" />
                                            Summary
                                        </h6>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Current Tickets:</span>
                                            <span className="fw-bold">{selectedCashbackToJoin.totalTickets} tickets</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Additional Tickets:</span>
                                            <span>{ticketCount} × ₹{selectedCashbackToJoin.ticketPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Additional Amount:</span>
                                            <span className="fw-bold text-primary">₹{(ticketCount * selectedCashbackToJoin.ticketPrice).toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-bold">Total After Purchase:</span>
                                            <span className="fw-bold text-success">{selectedCashbackToJoin.totalTickets + ticketCount} tickets</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowBuyMoreForm(false);
                                        setSelectedCashbackToJoin(null);
                                        setTicketCount(1);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-success" 
                                    onClick={handleBuyMoreTickets}
                                >
                                    <FaCheck className="me-2" />
                                    Confirm Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerCashback;