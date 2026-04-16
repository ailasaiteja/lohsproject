import { getCall } from "../../services/api";
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaTrophy, FaRupeeSign, FaCalendarAlt,
    FaCheckCircle, FaTimesCircle, FaSpinner,
    FaClock, FaCheck, FaExclamationTriangle, FaPlus,
    FaEye, FaTicketAlt, FaUser, FaPhone, FaMinus,
    FaWallet, FaMoneyBillWave, FaHistory, FaMedal,
    FaCrown, FaAward, FaInfoCircle, FaTimes,
    FaMobile
} from 'react-icons/fa';

const CustomerLottery = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customer } = location.state || {};
    
    const [loading, setLoading] = useState(true);
    const [lotteryList, setLotteryList] = useState([]);
    const [activeTab, setActiveTab] = useState('current');
    const [selectedDraw, setSelectedDraw] = useState(null);
    const [showDrawDetails, setShowDrawDetails] = useState(false);
    const [ticketCount, setTicketCount] = useState(1);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [activeDraws, setActiveDraws] = useState([]);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        if (customer) {
            loadCustomerLotteries();
            loadWalletBalance();
            loadActiveDraws();
        } else {
            navigate('/customer-signup');
        }
    }, [customer, navigate]);

    const loadWalletBalance = () => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            if (savedWallets) {
                const wallets = JSON.parse(savedWallets);
                setWalletBalance(wallets.myWallet || 0);
            } else {
                setWalletBalance(0);
            }
        } catch (error) {
            console.error('Error loading wallet balance:', error);
            setWalletBalance(0);
        }
    };

    const loadActiveDraws = async () => {
        try {
            // Try to fetch from API first
            const response = await getCall('/lucky-draws/active');
            if (response && response.data) {
                setActiveDraws(response.data);
                // Cache in localStorage as backup
                localStorage.setItem('flh_activedraws', JSON.stringify(response.data));
                return response.data;
            }
        } catch (error) {
            console.error('Error fetching active draws from API:', error);
            // Fallback to localStorage
            const savedDraws = localStorage.getItem('flh_activedraws');
            if (savedDraws) {
                const draws = JSON.parse(savedDraws);
                setActiveDraws(draws);
                return draws;
            }
        }
        return [];
    };

    const loadCustomerLotteries = async () => {
        setLoading(true);
        setApiError(null);
        
        try {
            // Fetch customer lottery data from API
            const response = await getCustomerLottery(customer.id);
            
            if (response && response.data) {
                // Process API response
                const processedLotteries = processLotteryData(response.data);
                setLotteryList(processedLotteries);
            } else {
                // Fallback to localStorage if API fails
                console.log('API returned no data, falling back to localStorage');
                const savedLotteryPurchases = JSON.parse(localStorage.getItem('flh_lottery') || '[]');
                const customerPurchases = savedLotteryPurchases.filter(purchase => 
                    purchase.customerPhone === customer.phone ||
                    purchase.customerId === customer.id ||
                    purchase.customerName === customer.name
                );
                
                const activeDrawsData = await loadActiveDraws();
                const lotteryMap = new Map();
                
                customerPurchases.forEach(purchase => {
                    const drawId = purchase.drawId;
                    const draw = activeDrawsData.find(d => d.id === drawId);
                    
                    if (!draw) return;
                    
                    if (!lotteryMap.has(drawId)) {
                        const now = new Date();
                        const announceDate = new Date(draw.Announcedate);
                        const isCompleted = announceDate < now;
                        
                        lotteryMap.set(drawId, {
                            id: drawId,
                            drawId: drawId,
                            drawName: draw.name,
                            type: draw.type,
                            color: draw.color || '#c42b2b',
                            ticketPrice: draw.price,
                            totalTickets: 0,
                            totalAmount: 0,
                            announceDate: draw.Announcedate,
                            endDate: draw.EndDate,
                            isCompleted: isCompleted,
                            customerId: customer.id,
                            customerName: customer.name,
                            purchases: [],
                            lastPurchaseDate: purchase.purchaseDate || purchase.date
                        });
                    }
                    
                    const lottery = lotteryMap.get(drawId);
                    const ticketCount = purchase.tickets || 1;
                    const amount = purchase.amount || (ticketCount * draw.price);
                    
                    lottery.purchases.push({
                        id: purchase.transactionId || purchase.id,
                        date: purchase.purchaseDate || purchase.date,
                        ticketCount: ticketCount,
                        amount: amount,
                        ticketNumbers: purchase.ticketNumbers || []
                    });
                    
                    lottery.totalTickets += ticketCount;
                    lottery.totalAmount += amount;
                    
                    const purchaseDate = new Date(purchase.purchaseDate || purchase.date);
                    const currentLastDate = new Date(lottery.lastPurchaseDate || 0);
                    if (purchaseDate > currentLastDate) {
                        lottery.lastPurchaseDate = purchase.purchaseDate || purchase.date;
                    }
                });
                
                const processedLotteries = Array.from(lotteryMap.values());
                setLotteryList(processedLotteries);
            }
        } catch (error) {
            console.error('Error loading customer lotteries:', error);
            setApiError('Failed to load lottery data. Please try again.');
            setLotteryList([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to process API response data
    const processLotteryData = (apiData) => {
        if (!apiData || !Array.isArray(apiData)) return [];
        
        return apiData.map(item => ({
            id: item.id,
            drawId: item.drawId,
            drawName: item.drawName,
            type: item.type || 'daily',
            color: item.color || '#c42b2b',
            ticketPrice: item.ticketPrice || 0,
            totalTickets: item.totalTickets || item.ticketsPurchased || 0,
            totalAmount: item.totalAmount || (item.ticketsPurchased * item.ticketPrice) || 0,
            announceDate: item.announceDate,
            endDate: item.endDate,
            isCompleted: item.status === 'completed' || new Date(item.announceDate) < new Date(),
            customerId: item.customerId,
            customerName: item.customerName,
            purchases: item.purchases || [{
                id: item.transactionId,
                date: item.purchaseDate,
                ticketCount: item.ticketsPurchased,
                amount: item.totalAmount,
                ticketNumbers: item.ticketNumbers || []
            }],
            lastPurchaseDate: item.lastPurchaseDate || item.purchaseDate
        }));
    };

    const handleJoinDraw = (draw) => {
        setSelectedDraw(draw);
        setTicketCount(1);
        setShowJoinModal(true);
    };

    const handleConfirmJoin = async () => {
        if (!selectedDraw || !customer) return;
        
        const totalAmount = selectedDraw.ticketPrice * ticketCount;
        
        // Check wallet balance
        if (walletBalance < totalAmount) {
            alert(`Insufficient wallet balance! 
                   Wallet Balance: ₹${walletBalance.toFixed(2)}
                   Required Amount: ₹${totalAmount.toFixed(2)}
                   Short by: ₹${(totalAmount - walletBalance).toFixed(2)}`);
            return;
        }
        
        setProcessing(true);
        
        try {
            // Generate ticket numbers
            const ticketNumbers = generateTicketNumbers(ticketCount);
            const transactionId = `LD${Date.now().toString().slice(-8)}`;
            
            // Create purchase record
            const purchaseRecord = {
                id: Date.now(),
                transactionId: transactionId,
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                drawId: selectedDraw.id,
                drawName: selectedDraw.drawName || selectedDraw.name,
                ticketPrice: selectedDraw.ticketPrice || selectedDraw.price,
                tickets: ticketCount,
                amount: totalAmount,
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                status: 'active',
                drawDate: selectedDraw.drawDate,
                announceDate: selectedDraw.announceDate || selectedDraw.Announcedate,
                endDate: selectedDraw.endDate || selectedDraw.EndDate,
                purchaseDate: new Date().toISOString(),
                ticketNumbers: ticketNumbers,
                walletBalanceBefore: walletBalance,
                walletBalanceAfter: walletBalance - totalAmount,
                type: 'lottery_purchase'
            };
            
            // Save to localStorage (as backup)
            const savedLottery = JSON.parse(localStorage.getItem('flh_lottery') || '[]');
            savedLottery.push(purchaseRecord);
            localStorage.setItem('flh_lottery', JSON.stringify(savedLottery));
            
            // Update wallet balance
            const walletUpdateSuccess = updateWalletBalance(totalAmount);
            
            if (!walletUpdateSuccess) {
                alert('Error updating wallet balance. Please try again.');
                setProcessing(false);
                return;
            }
            
            // Update customer data in localStorage
            const customers = JSON.parse(localStorage.getItem('flh_customers') || '[]');
            const updatedCustomers = customers.map(c => {
                if (c.id === customer.id || c.phone === customer.phone) {
                    return {
                        ...c,
                        lotteryTickets: (c.lotteryTickets || 0) + ticketCount,
                        totalLotterySpent: (c.totalLotterySpent || 0) + totalAmount,
                        lastPurchase: new Date().toISOString(),
                        lotteryHistory: [
                            ...(c.lotteryHistory || []),
                            {
                                transactionId,
                                drawName: selectedDraw.drawName || selectedDraw.name,
                                tickets: ticketCount,
                                amount: totalAmount,
                                date: new Date().toISOString(),
                                ticketNumbers: ticketNumbers
                            }
                        ]
                    };
                }
                return c;
            });
            
            localStorage.setItem('flh_customers', JSON.stringify(updatedCustomers));
            
            // Update active draws tickets sold in localStorage
            const updatedDraws = activeDraws.map(draw => {
                if (draw.id === selectedDraw.id) {
                    return {
                        ...draw,
                        ticketsSold: (draw.ticketsSold || 0) + ticketCount
                    };
                }
                return draw;
            });
            localStorage.setItem('flh_activedraws', JSON.stringify(updatedDraws));
            setActiveDraws(updatedDraws);
            
            // Create transaction record
            const transactions = JSON.parse(localStorage.getItem('flh_transactions') || '[]');
            transactions.unshift({
                id: `TXN-${Date.now()}`,
                type: 'debit',
                amount: totalAmount,
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                description: `Purchased ${ticketCount} ticket(s) for ${selectedDraw.drawName || selectedDraw.name}`,
                category: 'lottery_purchase',
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                paymentMethod: 'wallet',
                ticketCount: ticketCount,
                lotteryId: selectedDraw.id,
                ticketNumbers: ticketNumbers,
                status: 'completed',
                balance: walletBalance - totalAmount
            });
            localStorage.setItem('flh_transactions', JSON.stringify(transactions));
            
            // Show success message
            alert(`✅ Successfully purchased ${ticketCount} ticket(s) for ${selectedDraw.drawName || selectedDraw.name}!
            
Transaction Details:
• Transaction ID: ${transactionId}
• Amount: ₹${totalAmount}
• Tickets: ${ticketCount}
• Ticket Numbers: ${ticketNumbers.join(', ')}
• New Wallet Balance: ₹${(walletBalance - totalAmount).toFixed(2)}
            
The amount has been debited from your wallet.`);
            
            // Close modal and reset
            setShowJoinModal(false);
            setSelectedDraw(null);
            
            // Refresh data
            await loadCustomerLotteries();
            loadWalletBalance();
            
        } catch (error) {
            console.error('Error processing purchase:', error);
            alert('Error processing purchase. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const generateTicketNumbers = (count) => {
        const numbers = [];
        const timestamp = Date.now().toString().slice(-6);
        for (let i = 0; i < count; i++) {
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const ticketNum = (i + 1).toString().padStart(2, '0');
            numbers.push(`TKT${timestamp}${randomNum}${ticketNum}`);
        }
        return numbers;
    };

    const updateWalletBalance = (amount) => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            let wallets = savedWallets ? JSON.parse(savedWallets) : {
                myWallet: 0,
                commissionWallet: 0,
                withdrawWallet: 0,
                cashbackWallet: 0,
                schemeWallet: 0
            };

            const currentBalance = wallets.myWallet || 0;
            
            if (currentBalance < amount) {
                return false;
            }

            // Debit the amount
            wallets.myWallet = currentBalance - amount;
            localStorage.setItem('flh_wallets', JSON.stringify(wallets));
            
            // Update state
            setWalletBalance(wallets.myWallet);
            
            return true;
        } catch (error) {
            console.error('Error updating wallet:', error);
            return false;
        }
    };

    const handleViewDrawDetails = (drawId) => {
        const draw = activeDraws.find(d => d.id === drawId);
        
        if (draw) {
            setSelectedDraw(draw);
            setShowDrawDetails(true);
        } else {
            alert('Draw details not found. Please try again.');
        }
    };

    const getDrawTypeIcon = (type) => {
        switch(type) {
            case 'daily': return '📅';
            case 'weekly': return '📆';
            case 'monthly': return '🗓️';
            case 'special': return '🎁';
            default: return '🎯';
        }
    };

    const getStatusBadge = (isCompleted) => {
        if (isCompleted) {
            return <span className="badge bg-secondary">COMPLETED</span>;
        } else {
            return <span className="badge bg-success">ACTIVE</span>;
        }
    };

    const filteredLotteries = lotteryList.filter(lottery => {
        if (activeTab === 'current') return !lottery.isCompleted;
        if (activeTab === 'completed') return lottery.isCompleted;
        return true;
    });

    if (!customer) {
        return (
            <div className="container-fluid bg-light min-vh-100 p-3 d-flex align-items-center justify-content-center">
                <div className="text-center py-5">
                    <FaTimesCircle className="text-danger mb-3" size={60} />
                    <h3>Customer Not Found</h3>
                    <button className="btn btn-primary mt-3" onClick={() => navigate('/customer-signup')}>
                        Go to Customer List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light p-3" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div className="mb-4">
                <div className="mb-1">
                    <div className="card-body p-3">
                        <button
                            onClick={() => navigate('/customer-activities', { state: { customer } })}
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                        >
                            <FaArrowLeft className="me-2" />
                            Back to Activities
                        </button>
                    </div>
                </div>
                
                <div className="card">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                                <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                    <FaTrophy className="text-white" size={20} />
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h3 className="h1 fw-bold mb-1">
                                    My Lucky Draws
                                </h3>
                                {customer && (
                                    <div className="text-muted small">
                                        <FaUser className="me-1" />
                                        {customer.name} • 
                                        <FaMobile className="ms-2 me-1" />
                                        {customer.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {apiError && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <FaExclamationTriangle className="me-2" />
                    {apiError}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setApiError(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Tabs */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex gap-2">
                        <button
                            className={`btn ${activeTab === 'current' ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center`}
                            onClick={() => setActiveTab('current')}
                        >
                            <FaClock className="me-2" />
                            Current ({lotteryList.filter(l => !l.isCompleted).length})
                        </button>
                        <button
                            className={`btn ${activeTab === 'completed' ? 'btn-warning' : 'btn-outline-warning'} d-flex align-items-center`}
                            onClick={() => setActiveTab('completed')}
                        >
                            <FaCheckCircle className="me-2" />
                            Completed ({lotteryList.filter(l => l.isCompleted).length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Lottery List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading your lucky draws...</p>
                </div>
            ) : filteredLotteries.length === 0 ? (
                <div className="text-center py-5">
                    <FaTrophy className="text-muted mb-3" size={48} />
                    <h5>No {activeTab === 'current' ? 'active' : 'completed'} draws found</h5>
                    <p className="text-muted">
                        {activeTab === 'current' 
                            ? "You haven't joined any active lucky draws yet."
                            : "You don't have any completed lucky draws yet."}
                    </p>
                    <button 
                        className="btn btn-warning mt-2"
                        onClick={() => navigate('/lucky-draw', { state: { customer } })}
                    >
                        <FaTrophy className="me-2" />
                        Join a Lucky Draw
                    </button>
                </div>
            ) : (
                <div className="row">
                    {filteredLotteries.map((lottery, index) => (
                        <div key={index} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div 
                                    className="card-header text-white"
                                    style={{ backgroundColor: lottery.color || '#c42b2b' }}
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="mb-0">
                                                <FaTrophy className="me-2" />
                                                {lottery.drawName}
                                            </h6>
                                            <small className="opacity-75">
                                                {getDrawTypeIcon(lottery.type)} {lottery.type?.charAt(0).toUpperCase() + lottery.type?.slice(1) || 'Regular'} Draw
                                            </small>
                                        </div>
                                        {getStatusBadge(lottery.isCompleted)}
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* Draw Info */}
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Ticket Price:</div>
                                            <div className="fw-bold text-primary">
                                                <FaRupeeSign className="me-1" />
                                                {lottery.ticketPrice}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Your Tickets:</div>
                                            <div className="fw-bold">
                                                <FaTicketAlt className="me-1" />
                                                {lottery.totalTickets}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Total Spent:</div>
                                            <div className="fw-bold text-success">
                                                <FaRupeeSign className="me-1" />
                                                {lottery.totalAmount?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">End Date:</div>
                                            <div className="fw-bold">
                                                <FaCalendarAlt className="me-1" />
                                                {lottery.endDate || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="text-muted">Announce Date:</div>
                                            <div className="fw-bold">
                                                <FaCalendarAlt className="me-1" />
                                                {lottery.announceDate || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-sm btn-outline-primary flex-fill"
                                            onClick={() => handleViewDrawDetails(lottery.drawId)}
                                        >
                                            <FaEye className="me-1" />
                                            View Draw
                                        </button>
                                    
                                        {!lottery.isCompleted && (
                                            <button 
                                                className="btn btn-sm btn-warning flex-fill"
                                                onClick={() => {
                                                    const draw = activeDraws.find(d => d.id === lottery.drawId);
                                                    if (draw) {
                                                        handleJoinDraw(draw);
                                                    } else {
                                                        alert('Draw details not available. Please try again.');
                                                    }
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

            {/* Draw Details Modal */}
            {showDrawDetails && selectedDraw && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: selectedDraw.color || '#c42b2b', color: 'white' }}>
                                <h5 className="modal-title d-flex align-items-center">
                                    <div className="rounded p-2 me-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                        <FaTrophy />
                                    </div>
                                    <div>
                                        <div className="fw-bold">{selectedDraw.name || selectedDraw.drawName}</div>
                                        <small>{selectedDraw.type?.charAt(0).toUpperCase() + selectedDraw.type?.slice(1) || 'Regular'} Draw</small>
                                    </div>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowDrawDetails(false);
                                        setSelectedDraw(null);
                                    }}
                                    aria-label="Close"
                                ></button>
                            </div>
                            
                            <div className="modal-body">
                                {/* Quick Stats */}
                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body text-center">
                                                <FaRupeeSign className="text-primary fs-3 mb-2" />
                                                <div className="text-muted">Ticket Price</div>
                                                <div className="fw-bold fs-5" style={{ color: selectedDraw.color || '#c42b2b' }}>
                                                    ₹{selectedDraw.ticketPrice || selectedDraw.price || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body text-center">
                                                <FaCalendarAlt className="text-info fs-3 mb-2" />
                                                <div className="text-muted">Announce Date</div>
                                                <div className="fw-bold fs-5">{selectedDraw.announceDate || selectedDraw.Announcedate || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body text-center">
                                                <FaCalendarAlt className="text-danger fs-3 mb-2" />
                                                <div className="text-muted">End Date</div>
                                                <div className="fw-bold fs-5">{selectedDraw.endDate || selectedDraw.EndDate || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body text-center">
                                                <FaTrophy className="text-warning fs-3 mb-2" />
                                                <div className="text-muted">Winners</div>
                                                <div className="fw-bold fs-4">{selectedDraw.numberOfWinners || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedDraw.detailedDescription && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3">
                                            <FaInfoCircle className="me-2 text-primary" />
                                            Description
                                        </h6>
                                        <div className="bg-light rounded p-3">
                                            <p className="mb-0">{selectedDraw.detailedDescription}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Winner prizes */}
                                {selectedDraw.winnerprices && selectedDraw.winnerprices.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3">
                                            <FaMedal className="me-2 text-warning" />
                                            Winner Prizes
                                        </h6>
                                        <div className="row g-3">
                                            {selectedDraw.winnerprices.map((prize, index) => (
                                                <div key={index} className="col-md-6 col-lg-4">
                                                    <div className="card h-100 border-0 shadow-sm">
                                                        <div className="card-body text-center">
                                                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${prize.position <= 3 ? 'bg-warning' : 'bg-secondary'}`}
                                                                style={{ width: '60px', height: '60px', color: 'white' }}>
                                                                {prize.position === 1 && <FaCrown size={24} />}
                                                                {prize.position === 2 && <FaMedal size={24} />}
                                                                {prize.position === 3 && <FaMedal size={24} />}
                                                                {prize.position > 3 && <FaAward size={24} />}
                                                            </div>
                                                            <div className="fw-bold fs-5 mb-1">
                                                                {prize.position === 1 ? '1st' : 
                                                                prize.position === 2 ? '2nd' : 
                                                                prize.position === 3 ? '3rd' : 
                                                                `${prize.position}th`} Prize
                                                            </div>
                                                            <div className={`fw-bold ${prize.type === 'cash' ? 'text-success' : 'text-primary'}`}>
                                                                {prize.price}
                                                            </div>
                                                            <div className="small text-muted mt-2">
                                                                {prize.type === 'cash' ? 'Cash Prize' : 'Product Prize'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Terms and Conditions */}
                                {selectedDraw.terms && selectedDraw.terms.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3">
                                            <FaExclamationTriangle className="me-2 text-danger" />
                                            How it works
                                        </h6>
                                        <div className="bg-light rounded p-3">
                                            <ul className="mb-0">
                                                {selectedDraw.terms.map((term, index) => (
                                                    <li key={index} className="mb-1">
                                                        <small>{term}</small>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowDrawDetails(false);
                                        setSelectedDraw(null);
                                    }}
                                >
                                    Close
                                </button>
                                <button
                                    className="btn btn-warning"
                                    onClick={() => {
                                        setShowDrawDetails(false);
                                        handleJoinDraw(selectedDraw);
                                    }}
                                >
                                    <FaTicketAlt className="me-2" />
                                    Buy Tickets
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Draw Modal */}
            {showJoinModal && selectedDraw && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: selectedDraw.color || '#c42b2b', color: 'white' }}>
                                <h5 className="modal-title">
                                    <FaTicketAlt className="me-2" />
                                    Join {selectedDraw.name || selectedDraw.drawName}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setSelectedDraw(null);
                                        setProcessing(false);
                                    }}
                                    disabled={processing}
                                ></button>
                            </div>
                            
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <div className="fs-1 mb-2" style={{ color: selectedDraw.color || '#c42b2b' }}>
                                        <FaTrophy />
                                    </div>
                                    <h5>{selectedDraw.name || selectedDraw.drawName}</h5>
                                    <p className="text-muted">Ticket Price: ₹{selectedDraw.ticketPrice || selectedDraw.price || 0}</p>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold">Select Number of Tickets</label>
                                    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => ticketCount > 1 && setTicketCount(ticketCount - 1)}
                                            disabled={ticketCount <= 1 || processing}
                                        >
                                            <FaMinus />
                                        </button>
                                        <div className="text-center">
                                            <div className="display-4 fw-bold" style={{ color: selectedDraw.color || '#c42b2b' }}>
                                                {ticketCount}
                                            </div>
                                            <div className="text-muted">tickets</div>
                                        </div>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => ticketCount < 10 && setTicketCount(ticketCount + 1)}
                                            disabled={ticketCount >= 10 || processing}
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>

                                <div className="card border-primary mb-4">
                                    <div className="card-body">
                                        <h6 className="card-title text-primary">
                                            <FaRupeeSign className="me-2" />
                                            Payment Summary
                                        </h6>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Ticket Price:</span>
                                            <span>₹{selectedDraw.ticketPrice || selectedDraw.price || 0} × {ticketCount}</span>
                                        </div>
                                        <div className="d-flex justify-content-between fw-bold fs-5">
                                            <span>Total Amount:</span>
                                            <span style={{ color: selectedDraw.color || '#c42b2b' }}>
                                                ₹{(selectedDraw.ticketPrice || selectedDraw.price || 0) * ticketCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {walletBalance < ((selectedDraw.ticketPrice || selectedDraw.price || 0) * ticketCount) && (
                                    <div className="alert alert-danger">
                                        <FaExclamationTriangle className="me-2" />
                                        Insufficient wallet balance! Please add funds to your wallet.
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setSelectedDraw(null);
                                        setProcessing(false);
                                    }}
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-warning"
                                    onClick={handleConfirmJoin}
                                    disabled={processing || walletBalance < ((selectedDraw.ticketPrice || selectedDraw.price || 0) * ticketCount)}
                                >
                                    {processing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck className="me-2" />
                                            Confirm Purchase
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerLottery;