import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaChartLine, FaRupeeSign, FaCalendarAlt,
    FaCheckCircle, FaTimesCircle, FaSpinner, FaListOl,
    FaStar, FaCoins, FaCreditCard, FaPrint,
    FaClock, FaCheck, FaCalendarCheck, FaPercentage,
    FaChartBar, FaEye, FaMoneyBillWave, FaWallet, FaExclamationTriangle,
    FaUser, FaMobile
} from 'react-icons/fa';

const CustomerSchemes = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customer } = location.state || {};
    
    const [loading, setLoading] = useState(true);
    const [schemeList, setSchemeList] = useState([]);
    const [selectedSch, setSelectedSch] = useState(null);
    const [showSchemeDetails, setShowSchemeDetails] = useState(false);
    const [schemeTerms, setSchemeTerms] = useState([]);
    const [activeTab, setActiveTab] = useState('current');
    const [payingTerm, setPayingTerm] = useState(null);
    const [showMoreTerms, setShowMoreTerms] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [termToPay, setTermToPay] = useState(null);
    
    // Wallet states
    const [walletBalance, setWalletBalance] = useState(12500);
    const [insufficientBalance, setInsufficientBalance] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    useEffect(() => {
        const initializeData = () => {
            if (!customer) {
                setLoading(false);
                return;
            }

            // Load schemes from the SAME source as SchemesPage
            const savedSchemes = JSON.parse(localStorage.getItem('flh_schemes') || '[]');
            
            // Filter schemes for this specific customer
            const customerSchemes = savedSchemes.filter(scheme => 
                scheme.customerId === customer.id
            );

            // Transform data to match the structure used in CustomerSchemes
            const transformedSchemes = customerSchemes.map(scheme => ({
                id: scheme.id,
                customerId: scheme.customerId,
                schemeName: scheme.schemeName,
                investment: scheme.totalAmount, // Use totalAmount from main data
                amountPerTerm: scheme.perTerm, // Use perTerm from main data
                numberOfTerms: scheme.totalTerms, // Use totalTerms from main data
                totalSaved: scheme.amountPaid || scheme.perTerm, // Use amountPaid if exists
                maturityAmount: scheme.maturityAmount,
                startDate: scheme.enrolledDate || new Date().toLocaleDateString('en-IN'),
                paidTerms: scheme.paymentHistory ? scheme.paymentHistory.map(p => p.termNumber) : [1],
                paidTermsCount: scheme.paidTerms || 1, // Use paidTerms from main data
                currentTerm: scheme.currentTerm || 2, // Use currentTerm from main data
                type: scheme.type, // Keep scheme type
                remainingTerms: scheme.remainingTerms,
                totalAmount: scheme.totalAmount,
                perTerm: scheme.perTerm, // Keep original perTerm
                isExpired: false // You can add logic to check if scheme is completed
            }));

            setSchemeList(transformedSchemes);
            
            // Load wallet balance from localStorage
            loadWalletBalance();
            
            setLoading(false);
        };

        initializeData();
    }, [customer]);

    // Load wallet balance from localStorage
    const loadWalletBalance = () => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            if (savedWallets) {
                const wallets = JSON.parse(savedWallets);
                setWalletBalance(wallets.myWallet || 12500);
            } else {
                // Initialize wallet if not exists
                const initialWallets = {
                    myWallet: 12500,
                    commissionWallet: 3200,
                    withdrawWallet: 0,
                    cashbackWallet: 500,
                    schemeWallet: 1500
                };
                localStorage.setItem('flh_wallets', JSON.stringify(initialWallets));
                setWalletBalance(initialWallets.myWallet);
            }
        } catch (error) {
            console.error('Error loading wallet balance:', error);
        }
    };

    // Generate scheme terms using data from main source
    const generateSchemeTerms = (scheme) => {
        if (!scheme) return;
        
        const terms = [];
        const startDate = new Date(scheme.enrolledDate || scheme.startDate || '2026-02-02');
        const totalTerms = scheme.totalTerms || scheme.numberOfTerms || 102;
        const amountPerTerm = scheme.perTerm || scheme.amountPerTerm || 100;
        const paidTerms = scheme.paidTerms || [1];
        
        // Calculate current term (next term to pay)
        const maxPaidTerm = Math.max(...(paidTerms || [1]));
        const currentTerm = maxPaidTerm + 1;

        for (let i = 1; i <= totalTerms; i++) {
            const termDate = new Date(startDate);
            
            // Calculate date based on scheme type
            if (scheme.type === 'daily') {
                termDate.setDate(termDate.getDate() + (i - 1));
            } else if (scheme.type === 'weekly') {
                termDate.setDate(termDate.getDate() + ((i - 1) * 7));
            } else if (scheme.type === 'monthly') {
                termDate.setMonth(termDate.getMonth() + (i - 1));
            } else {
                termDate.setDate(termDate.getDate() + (i - 1));
            }
            
            const isPaid = paidTerms.includes(i);
            const isCurrent = i === currentTerm;
            
            // Format date as DD-MM-YYYY
            const formattedDate = termDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');

            let status = 'pending';
            let statusText = 'Pay';
            
            if (isPaid) {
                status = 'completed';
                statusText = 'Paid';
            } else if (isCurrent) {
                status = 'current';
                statusText = 'Pay';
            } else if (i < currentTerm) {
                status = 'overdue';
                statusText = 'Overdue';
            } else {
                status = 'upcoming';
                statusText = 'Upcoming';
            }

            terms.push({
                termNumber: i,
                termLabel: `Term ${i}`,
                amount: amountPerTerm,
                dueDate: formattedDate,
                status,
                statusText,
                canPay: !isPaid && (isCurrent || i < currentTerm)
            });
        }

        setSchemeTerms(terms);
    };

    const handlePayTerm = (termNumber) => {
        if (!selectedSch) return;

        // Check if wallet has sufficient balance
        const amountToPay = selectedSch.perTerm || selectedSch.amountPerTerm || 100;
        
        if (walletBalance < amountToPay) {
            setInsufficientBalance(true);
            
            setTimeout(() => {
                setInsufficientBalance(false);
            }, 3000);
            
            return;
        }

        setTermToPay(termNumber);
        setShowConfirmModal(true);
    };

    const confirmPayment = () => {
        if (!selectedSch || !termToPay) return;

        setShowConfirmModal(false);
        setPaymentProcessing(true);
        setPayingTerm(termToPay);
        
        const amountToPay = selectedSch.perTerm || selectedSch.amountPerTerm || 100;
        
        // Simulate payment processing
        setTimeout(() => {
            // 1. Update wallet balance in localStorage
            updateWalletBalance(amountToPay);
            
            // 2. Update scheme with paid term
            const savedSchemes = JSON.parse(localStorage.getItem('flh_schemes') || '[]');
            const updatedSchemes = savedSchemes.map(scheme => {
                if (scheme.id === selectedSch.id) {
                    const paidTerms = [...new Set([...(scheme.paidTerms || [1]), termToPay])];
                    const paidTermsCount = paidTerms.length;
                    const maxPaidTerm = Math.max(...paidTerms);
                    const currentTerm = maxPaidTerm + 1;
                    const totalPaid = scheme.amountPaid || 0;
                    
                    return {
                        ...scheme,
                        paidTerms,
                        paidTermsCount,
                        currentTerm,
                        amountPaid: totalPaid + amountToPay,
                        totalPaidTerms: paidTermsCount,
                        remainingTerms: scheme.totalTerms - paidTermsCount,
                        paymentHistory: [
                            ...(scheme.paymentHistory || []),
                            {
                                termNumber: termToPay,
                                amount: amountToPay,
                                date: new Date().toLocaleDateString('en-IN'),
                                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                                transactionId: `SCH-PAY-${Date.now()}`
                            }
                        ]
                    };
                }
                return scheme;
            });

            // Update localStorage
            localStorage.setItem('flh_schemes', JSON.stringify(updatedSchemes));
            
            // 3. Update local state
            const paidTermsArray = [...new Set([...(selectedSch.paidTerms || [1]), termToPay])];
            const maxPaidTerm = Math.max(...paidTermsArray);
            const currentTerm = maxPaidTerm + 1;
            const totalPaid = selectedSch.amountPaid || 0;
            
            const updatedSelectedScheme = {
                ...selectedSch,
                paidTerms: paidTermsArray,
                paidTermsCount: paidTermsArray.length,
                currentTerm: currentTerm,
                amountPaid: totalPaid + amountToPay,
                totalSaved: (selectedSch.totalSaved || selectedSch.perTerm) + amountToPay,
                lastPaymentDate: new Date().toLocaleDateString('en-IN')
            };
            setSelectedSch(updatedSelectedScheme);

            // 4. Update scheme list
            const updatedList = schemeList.map(scheme => {
                if (scheme.id === selectedSch.id) {
                    return updatedSelectedScheme;
                }
                return scheme;
            });
            setSchemeList(updatedList);

            // 5. Update terms display
            generateSchemeTerms(updatedSelectedScheme);
            
            // 6. Update customer data
            const customers = JSON.parse(localStorage.getItem('flh_customers') || '[]');
            const updatedCustomers = customers.map(cust => {
                if (cust.id === customer.id) {
                    const elpGained = Math.max(1, Math.floor(amountToPay / 100));
                    const ecbGained = Math.floor(amountToPay * 0.01);
                    
                    return {
                        ...cust,
                        totalELP: (cust.totalELP || 0) + elpGained,
                        totalECB: (cust.totalECB || 0) + ecbGained,
                        lastPaymentDate: new Date().toLocaleDateString('en-IN'),
                        lastPaymentAmount: amountToPay,
                        totalInvestment: (cust.totalInvestment || 0) + amountToPay
                    };
                }
                return cust;
            });
            localStorage.setItem('flh_customers', JSON.stringify(updatedCustomers));
            
            // 7. Create transaction record
            createTransactionRecord(amountToPay);
            
            setPayingTerm(null);
            setTermToPay(null);
            setPaymentProcessing(false);
            
            // Show success message
            showPaymentSuccess(amountToPay, termToPay);
        }, 800);
    };

    // Update wallet balance in localStorage
    const updateWalletBalance = (amount) => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            const wallets = savedWallets ? JSON.parse(savedWallets) : {
                myWallet: 12500,
                commissionWallet: 3200,
                withdrawWallet: 0,
                cashbackWallet: 500,
                schemeWallet: 1500
            };

            const newBalance = wallets.myWallet - amount;
            const updatedWallets = {
                ...wallets,
                myWallet: newBalance
            };

            localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));
            setWalletBalance(newBalance);
            
            return newBalance;
        } catch (error) {
            console.error('Error updating wallet balance:', error);
            return walletBalance;
        }
    };

    // Create transaction record
    const createTransactionRecord = (amount) => {
        try {
            const savedTransactions = localStorage.getItem('flh_transactions');
            const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

            const newTransaction = {
                id: Date.now(),
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                type: 'debit',
                amount: amount,
                category: 'scheme_payment',
                description: `Scheme payment - ${selectedSch.schemeName} - Term ${termToPay} for ${customer.firstName} ${customer.lastName}`,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerId: customer.id,
                schemeName: selectedSch.schemeName,
                termNumber: termToPay,
                balance: walletBalance - amount,
                status: 'completed',
                timestamp: new Date().toISOString()
            };

            transactions.unshift(newTransaction);
            localStorage.setItem('flh_transactions', JSON.stringify(transactions));
        } catch (error) {
            console.error('Error creating transaction record:', error);
        }
    };

    // Show payment success notification
    const showPaymentSuccess = (amount, termNumber) => {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg';
        successDiv.style.zIndex = '9999';
        successDiv.style.minWidth = '400px';
        successDiv.style.textAlign = 'center';
        successDiv.style.animation = 'slideDown 0.5s ease-out';
        successDiv.innerHTML = `
            <div class="d-flex align-items-center justify-content-center">
                <div class="me-2">
                    <FaCheckCircle style="font-size: 24px;" />
                </div>
                <div>
                    <h6 class="mb-0">Payment Successful!</h6>
                    <small>₹${amount} deducted from wallet for Term ${termNumber}</small>
                </div>
            </div>
            <div class="mt-2">
                <small>New wallet balance: ₹${walletBalance - amount}</small>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translate(-50%, -100%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideUp 0.5s ease-in';
            setTimeout(() => {
                document.body.removeChild(successDiv);
            }, 500);
        }, 5000);
    };

    const cancelPayment = () => {
        setShowConfirmModal(false);
        setTermToPay(null);
        setInsufficientBalance(false);
    };

    const handleCloseModal = () => {
        setShowSchemeDetails(false);
        setSelectedSch(null);
        setSchemeTerms([]);
        setShowMoreTerms(false);
        setInsufficientBalance(false);
    };

    if (!customer) {
        return (
            <div className="container-fluid bg-light min-vh-100 p-3 d-flex align-items-center justify-content-center">
                <div className="text-center py-5">
                    <FaTimesCircle className="text-danger mb-3" size={60} />
                    <h3>Customer Not Found</h3>
                    <p className="text-muted mb-4">Please select a customer first</p>
                    <button 
                        className="btn btn-primary mt-3" 
                        onClick={() => navigate('/customer-activities')}
                    >
                        Go to Customer List
                    </button>
                </div>
            </div>
        );
    }

    const filteredSchemes = schemeList.filter(scheme => {
        if (activeTab === 'current') return !scheme.isExpired;
        if (activeTab === 'completed') return scheme.isExpired;
        return true;
    });

    const termsToShow = showMoreTerms ? schemeTerms : schemeTerms.slice(0, 8);

    return (
        <div className="container-fluid bg-light p-3 min-vh-100">
            {/* Insufficient Balance Alert */}
            {insufficientBalance && (
                <div className="alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-5 shadow-lg"
                    style={{ zIndex: 1000, minWidth: '300px', animation: 'fadeIn 0.3s' }}>
                    <div className="d-flex align-items-center">
                        <FaExclamationTriangle className="me-2" />
                        <div>
                            <strong>Insufficient Balance!</strong>
                            <small className="d-block">Add money to wallet to make payment</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Header - Two containers like the example */}
            <div className="">
                {/* Container for Back Button */}
                <div className="mb-3">
                    <div className=" ">
                        <button
                            onClick={() => navigate('/customer-activities', { state: { customer } })}
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                        >
                            <FaArrowLeft className="me-2" />
                            Back to Activities
                        </button>
                    </div>
                </div>
                
                {/* Container for Title */}
                <div className="card">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                                <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center" 
                                     style={{ width: '50px', height: '50px' }}>
                                    <FaChartLine className="text-white" size={20} />
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h3 className="h1 fw-bold mb-1">
                                    My Schemes
                                </h3>
                                {customer && (
                                    <div className="text-muted small">
                                        <FaUser className="me-1" />
                                        {customer.name}  
                                        <FaMobile className="ms-2 me-1" />
                                        {customer.mobile || '09160998084'}
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
                            className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('current')}
                        >
                            <FaClock className="me-2" />
                            Current
                        </button>
                        <button
                            className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            <FaCheckCircle className="me-2" />
                            Completed
                        </button>
                    </div>
                </div>
            </div>

            {/* Schemes List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading schemes...</p>
                </div>
            ) : filteredSchemes.length === 0 ? (
                <div className="text-center py-5">
                    <FaChartLine className="text-muted mb-3" size={48} />
                    <h5>No schemes found</h5>
                    
                </div>
            ) : (
                <div className="row">
                    {filteredSchemes.map((scheme, index) => (
                        <div key={index} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 className="card-title text-primary">
                                                <FaChartLine className="me-2" />
                                                {scheme.schemeName}
                                            </h6>
                                            <div className="text-muted small">
                                                <FaCalendarAlt className="me-1" />
                                                Started: {scheme.startDate}
                                            </div>
                                        </div>
                                        <span className={`badge bg-${scheme.isExpired ? 'success' : 'primary'}`}>
                                            {scheme.isExpired ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <div className="text-muted">
                                                <FaRupeeSign className="me-1" />
                                                Per Term
                                            </div>
                                            <div className="fw-bold text-primary">₹{scheme.perTerm || scheme.amountPerTerm}</div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <div className="text-muted">Terms Paid</div>
                                            <div>
                                                <span className="fw-bold">{scheme.paidTermsCount}</span>
                                                <span className="text-muted">/{scheme.totalTerms || scheme.numberOfTerms}</span>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <div className="text-muted">Total Amount</div>
                                            <div className="fw-bold">₹{scheme.totalAmount || scheme.investment}</div>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <div className="text-muted">Status</div>
                                            <div className={`text-${scheme.isExpired ? 'success' : 'primary'}`}>
                                                {scheme.isExpired ? 'Completed' : 'Active'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="progress mb-3" style={{ height: '8px' }}>
                                        <div 
                                            className="progress-bar bg-success" 
                                            style={{ width: `${(scheme.paidTermsCount / (scheme.totalTerms || scheme.numberOfTerms)) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                setSelectedSch(scheme);
                                                generateSchemeTerms(scheme);
                                                setShowSchemeDetails(true);
                                            }}
                                        >
                                            <FaEye className="me-1" />
                                            View Details
                                        </button>
                                        <div className="text-muted small">
                                            Term {scheme.paidTermsCount} of {scheme.totalTerms || scheme.numberOfTerms}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Scheme Details Modal */}
            {showSchemeDetails && selectedSch && (
                <div className="modal fade show d-block" style={{ 
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1050 
                }}>
                    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: '90vh', margin: 'auto' }}>
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <FaChartLine className="me-2" />
                                    {selectedSch.schemeName} - Terms Details
                                </h5>
                                
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white"
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Scheme Summary - Use data from main source */}
                                <div className="card mb-4 border-primary">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary mb-4">
                                            <FaChartLine className="me-2" />
                                            {selectedSch.schemeName}
                                        </h5>
                                        
                                        <div className="row">
                                            <div className="col-md-3 mb-3">
                                                <div className="border rounded p-3 text-center bg-light">
                                                    <div className="text-muted small mb-1">Amount per Term</div>
                                                    <div className="fw-bold fs-5 text-primary">
                                                        <FaRupeeSign className="me-1" />
                                                        {selectedSch.perTerm || selectedSch.amountPerTerm}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="col-md-3 mb-3">
                                                <div className="border rounded p-3 text-center bg-light">
                                                    <div className="text-muted small mb-1">Number of Terms</div>
                                                    <div className="fw-bold fs-5">
                                                        {selectedSch.totalTerms || selectedSch.numberOfTerms}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            
                                            <div className="col-md-3 mb-3">
                                                <div className="border rounded p-3 text-center bg-light">
                                                    <div className="text-muted small mb-1">Maturity Amount</div>
                                                    <div className="fw-bold fs-5 text-warning">
                                                        <FaRupeeSign className="me-1" />
                                                        {selectedSch.maturityAmount}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Progress bar */}
                                        <div className="mt-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted small">
                                                    Progress: {selectedSch.paidTermsCount} of {selectedSch.totalTerms || selectedSch.numberOfTerms} terms
                                                </span>
                                                <span className="text-primary small fw-bold">
                                                    {Math.round((selectedSch.paidTermsCount / (selectedSch.totalTerms || selectedSch.numberOfTerms)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '10px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ 
                                                        width: `${(selectedSch.paidTermsCount / (selectedSch.totalTerms || selectedSch.numberOfTerms)) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms List - Like Image Format */}
                                <div className="card">
                                    <div className="card-header bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">
                                                <FaListOl className="me-2" />
                                                Payment Schedule
                                            </h6>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => setShowMoreTerms(!showMoreTerms)}
                                                >
                                                    {showMoreTerms ? 'Show Less' : 'Show More'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-center">Term</th>
                                                        <th className="text-center">Amount</th>
                                                        <th className="text-center">Due Date</th>
                                                        <th className="text-center">Status/Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {termsToShow.map(term => (
                                                        <tr key={term.termNumber} className="align-middle">
                                                            <td className="text-center fw-bold">
                                                                {term.termLabel}
                                                            </td>
                                                            <td className="text-center">
                                                                <span style={{ 
                                                                    fontSize: '14px',
                                                                    fontWeight: 'bold',
                                                                    color: '#333'
                                                                }}>
                                                                    ₹{term.amount}
                                                                </span>
                                                            </td>
                                                            <td className="text-center" style={{ color: '#666' }}>
                                                                <FaCalendarAlt className="me-1" />
                                                                {term.dueDate}
                                                            </td>
                                                            <td className="text-center">
                                                                {term.canPay ? (
                                                                    <button
                                                                        className="btn btn-sm px-3"
                                                                        onClick={() => handlePayTerm(term.termNumber)}
                                                                        disabled={payingTerm === term.termNumber || paymentProcessing}
                                                                        style={{
                                                                            backgroundColor: term.status === 'overdue' ? '#dc3545' : '#ffc107',
                                                                            color: term.status === 'overdue' ? 'white' : '#212529',
                                                                            border: 'none',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        {payingTerm === term.termNumber ? (
                                                                            <>
                                                                                <span className="spinner-border spinner-border-sm me-1"></span>
                                                                                Processing...
                                                                            </>
                                                                        ) : (
                                                                            term.statusText
                                                                        )}
                                                                    </button>
                                                                ) : term.status === 'completed' ? (
                                                                    <span style={{
                                                                        backgroundColor: '#d4edda',
                                                                        color: '#155724',
                                                                        padding: '5px 12px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '14px',
                                                                        fontWeight: 'bold',
                                                                        border: '1px solid #c3e6cb'
                                                                    }}>
                                                                        <FaCheckCircle className="me-1" />
                                                                        Paid
                                                                    </span>
                                                                ) : (
                                                                    <span style={{
                                                                        backgroundColor: '#e2e3e5',
                                                                        color: '#383d41',
                                                                        padding: '5px 12px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '14px',
                                                                        fontWeight: 'bold',
                                                                        border: '1px solid #d6d8db'
                                                                    }}>
                                                                        Upcoming
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            
                                            {schemeTerms.length > 8 && !showMoreTerms && (
                                                <div className="text-center py-3 border-top">
                                                    <button 
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => setShowMoreTerms(true)}
                                                    >
                                                        Show More Terms ({schemeTerms.length - 8} remaining)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Close
                                </button>
                                
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal fade show d-block" style={{ 
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1060 
                }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ margin: 'auto', maxWidth: '500px' }}>
                        <div className="modal-content border-primary">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <FaExclamationTriangle className="me-2" />
                                    Confirm Payment from Wallet
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white"
                                    onClick={cancelPayment}
                                ></button>
                            </div>
                            <div className="modal-body text-center py-4">
                                <div className="mb-4">
                                    <FaWallet className="text-primary mb-3" size={48} />
                                    <h5>Pay Term {termToPay} from Wallet</h5>
                                </div>
                                
                                <div className="card border-primary mb-4">
                                    <div className="card-body">     
                                        <div className="row mb-3">
                                            <div className="col-6 text-end">
                                                <div className="text-muted small">Amount to Pay:</div>
                                            </div>
                                            <div className="col-6 text-start">
                                                <div className="fw-bold fs-5 text-danger">
                                                    ₹{selectedSch?.perTerm || selectedSch?.amountPerTerm || 100}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer justify-content-center">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary px-4"
                                    onClick={cancelPayment}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning px-4"
                                    onClick={confirmPayment}
                                    style={{ backgroundColor: '#ffc107', color: '#212529', border: 'none', fontWeight: 'bold' }}
                                >
                                    <FaWallet className="me-2" />
                                    Pay from Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSchemes;