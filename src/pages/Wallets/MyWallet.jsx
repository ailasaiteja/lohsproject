import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRazorpay } from "react-razorpay";
import {
    FaWallet, FaRupeeSign, FaCreditCard, FaDownload,
    FaHistory, FaShoppingCart,
    FaPlus, FaHome, FaReceipt, FaMoneyBillWave,
    FaGift, FaStar, FaTicketAlt
} from 'react-icons/fa';
import {
    Container, Row, Col, Card, Button, Table,
    Modal, Form, InputGroup, Alert, Badge
} from 'react-bootstrap';
import { 
    fetchMywalletTransactions, 
    fetchMywalletAddcash, 
    createRazorpayOrder,
    withdrawrequest
} from '../wallets/mywalletApi';
import LoadingToast from '../loading/LoadingToast';

const MyWalletPage = ({ user }) => {
    const navigate = useNavigate();
    const { Razorpay } = useRazorpay();
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawWalletType, setWithdrawWalletType] = useState('personal');
    const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // Wallet state
    const [walletState, setWalletState] = useState({
        balance: 0,
        transactions: []
    });
    const storedUser = JSON.parse(localStorage.getItem("user_data"));
    
    // Load wallet data on component mount
    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        setLoading(true);
        setAlertMessage({ type: '', text: '' });

        try {
            // Fetch wallet transactions using the provided API function
            const response = await fetchMywalletTransactions();

            let balance = 0;
            let transactions = [];

            // Handle the API response structure - response is the direct API response
            if (response && response.success) {
                // Get balance from summary.current_balance
                if (response.data?.summary?.current_balance) {
                    balance = parseFloat(response.data.summary.current_balance) || 0;
                }
                // If balance is directly in response
                else if (response.data?.balance) {
                    balance = parseFloat(response.data.balance) || 0;
                }
                // If balance is in response directly (not nested)
                else if (response.balance !== undefined) {
                    balance = parseFloat(response.balance) || 0;
                }

                // Get transactions
                if (response.data?.summary?.transactions) {
                    transactions = response.data.summary.transactions || [];
                }
                else if (response.data?.transactions) {
                    transactions = response.data.transactions || [];
                }
                else if (response.transactions) {
                    transactions = response.transactions || [];
                }
            }

            setWalletState({
                balance: isNaN(balance) ? 0 : balance,
                transactions: transactions.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.date || 0);
                    const dateB = new Date(b.created_at || b.date || 0);
                    return dateB - dateA;
                })
            });

        } catch (error) {
            console.error('Error loading wallet data:', error);
            setAlertMessage({
                type: 'danger',
                text: error.response?.data?.message || error.message || 'Failed to load wallet data. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Add money to wallet after payment success
    const addMoneyToWallet = async (razorpayResponse) => {
        try {
            const response = await fetchMywalletAddcash({
                amount: parseFloat(razorpayResponse.amount / 100), // Convert paise to rupees
                payment_mode: razorpayResponse.payment_mode,
                transaction_id: razorpayResponse.transaction_id,
                gateway_payment_id: razorpayResponse.gateway_payment_id,
                gateway_order_id: razorpayResponse.gateway_order_id,
            });

            console.log('Add money response:', response);

            if (response && response.status === 200 && response.success) {
                await loadWalletData();
                // Dispatch event to update header
                window.dispatchEvent(new Event("wallet-updated"));

                // Also update localStorage for consistency
                const wallets = JSON.parse(localStorage.getItem('flh_wallets') || '{}');
                wallets.myWallet = walletState.balance;
                localStorage.setItem('flh_wallets', JSON.stringify(wallets));

                setAlertMessage({
                    type: 'success',
                    text: `₹${razorpayResponse.amount / 100} added successfully to your wallet!`
                });
                setShowAddMoney(false);
                setAddAmount('');
            } else {
                setAlertMessage({
                    type: 'danger',
                    text: response?.data?.message || response?.message || 'Failed to add money. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error adding money:', error);
            if (error.response) {
                const errorMessage = error.response.data?.message ||
                    error.response.data?.detail ||
                    error.response.data?.error ||
                    'Error adding money. Please try again.';
                setAlertMessage({
                    type: 'danger',
                    text: errorMessage
                });
            } else {
                setAlertMessage({
                    type: 'danger',
                    text: 'Error adding money. Please try again.'
                });
            }
            throw error;
        }
    };

    // Handle add money
    const handleAddMoney = async () => {
        if (!addAmount || addAmount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        setLoading(true);
        try {
            // Create Razorpay order via API
            const orderResponse = await createRazorpayOrder({
                amount: parseFloat(addAmount)
            });
            
            if (orderResponse.status !== 200 || !orderResponse.data) {
                throw new Error(orderResponse.data?.message || 'Failed to create payment order. Please try again.');
            }

            const order = orderResponse.data;

            const options = {
                key: 'rzp_test_Rn1OrUUKqSjTxN', // Replace with your Razorpay key
                amount: Math.round(order.amount * 100),
                currency: order.currency || 'INR',
                name: 'FLH',
                description: 'Add Money to Wallet',
                order_id: order.order_id,
                handler: async function (response) {
                    console.log('Payment success:', response);

                    const razorpayResponse = {
                        amount: order.amount * 100,
                        payment_mode: response.razorpay_payment_method || 'card',
                        transaction_id: response.razorpay_payment_id,
                        gateway_payment_id: response.razorpay_payment_id,
                        gateway_order_id: order.order_id,
                    };
                    
                    console.log('Razorpay Response Data:', razorpayResponse);
                    
                    try {
                        await addMoneyToWallet(razorpayResponse);
                        window.dispatchEvent(new Event("wallet-updated"));
                        navigate('/wallet/my');
                    } catch (error) {
                        console.error('Error in payment handler:', error);
                    }
                },
                prefill: {
                    name: storedUser?.first_name ? `${storedUser.first_name} ${storedUser.last_name || ''}`.trim() : 'FLH User',
                    email: storedUser?.email || '',
                    contact: storedUser?.phone_number || ''
                },
                theme: {
                    color: '#dc3545'
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.log('Payment failed:', response);
                setAlertMessage({ type: 'danger', text: response.error?.description || 'Payment failed. Please try again.' });
            });
            rzp.open();
        } catch (error) {
            console.error('Error creating order or initiating payment:', error);
            if (error.response) {
                const errorMessage = error.response.data?.message ||
                    error.response.data?.detail ||
                    'Error creating payment order. Please try again.';
                setAlertMessage({ type: 'danger', text: errorMessage });
            } else {
                setAlertMessage({ type: 'danger', text: error.message || 'Error initiating payment. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle withdraw - using withdrawrequest API
    const handleWithdraw = async () => {
        if (!withdrawAmount || withdrawAmount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        const amountNum = parseFloat(withdrawAmount);

        if (walletState.balance < amountNum) {
            setAlertMessage({
                type: 'danger',
                text: `Insufficient balance. Available: ₹${walletState.balance.toFixed(2)}`
            });
            return;
        }

        setLoading(true);
        try {
            // Using the withdrawrequest API function with wallet_type
            const response = await withdrawrequest({
                amount: amountNum,
                wallet_type: withdrawWalletType
            });

            console.log('Withdraw response:', response);

            if (response && response.success && response.status === 200) {
                await loadWalletData();
                window.dispatchEvent(new Event("wallet-updated"));

                setAlertMessage({
                    type: 'success',
                    text: `Withdrawal request of ₹${withdrawAmount} submitted successfully!`
                });
                setShowWithdraw(false);
                setWithdrawAmount('');
                setWithdrawWalletType('personal');
            } else {
                setAlertMessage({
                    type: 'danger',
                    text: response?.data?.message || response?.message || 'Failed to withdraw money. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error withdrawing money:', error);

            // Handle different error scenarios
            if (error.response) {
                // Handle API error response
                let errorMessage = '';
                
                if (error.response.data?.details) {
                    // Handle validation errors
                    const details = error.response.data.details;
                    errorMessage = Object.values(details).flat().join(', ');
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                } else {
                    errorMessage = 'Error withdrawing money. Please try again.';
                }
                
                setAlertMessage({
                    type: 'danger',
                    text: errorMessage
                });
            } else if (error.message) {
                setAlertMessage({
                    type: 'danger',
                    text: error.message
                });
            } else {
                setAlertMessage({
                    type: 'danger',
                    text: 'Error withdrawing money. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Get transaction stats
    const getTransactionStats = () => {
        const transactions = walletState.transactions;

        const totalAdded = transactions
            .filter(t => t.type?.toLowerCase() === 'credit' || t.transaction_type?.toLowerCase() === 'credit')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0);

        const totalPurchases = transactions
            .filter(t => t.type?.toLowerCase() === 'debit' || t.transaction_type?.toLowerCase() === 'debit')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0);

        return {
            totalAdded,
            totalPurchases,
            transactionCount: transactions.length
        };
    };

    const transactionStats = getTransactionStats();

    // Format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return (
                <div>
                    <div className="fw-medium">
                        {date.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </div>
                    <small className="text-muted">
                        {date.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        })}
                    </small>
                </div>
            );
        } catch (e) {
            return dateString;
        }
    };

    // Get transaction icon and color based on type
    const getTransactionIcon = (transaction) => {
        const type = (transaction.type || transaction.transaction_type || '').toLowerCase();
        const description = (transaction.description || transaction.remarks || '').toLowerCase();

        if (type === 'credit') {
            return { icon: <FaPlus className="text-success" />, color: 'success' };
        } else if (type === 'debit') {
            if (description.includes('cashback') || description.includes('cash back')) {
                return { icon: <FaGift className="text-info" />, color: 'info' };
            } else if (description.includes('lucky draw') || description.includes('ticket')) {
                return { icon: <FaTicketAlt className="text-secondary" />, color: 'secondary' };
            } else if (description.includes('scheme')) {
                return { icon: <FaStar className="text-warning" />, color: 'warning' };
            } else if (description.includes('order purchase') || description.includes('products')) {
                return { icon: <FaShoppingCart className="text-danger" />, color: 'danger' };
            }
            return { icon: <FaMoneyBillWave className="text-danger" />, color: 'danger' };
        }

        return { icon: <FaReceipt className="text-secondary" />, color: 'secondary' };
    };

    // Get transaction type text
    const getTransactionTypeText = (transaction) => {
        const type = (transaction.type || transaction.transaction_type || '').toLowerCase();
        const description = (transaction.description || transaction.remarks || '').toLowerCase();

        if (type === 'credit') {
            return 'Money Added';
        } else if (type === 'debit') {
            if (description.includes('lucky draw')) {
                return 'LuckyDraw Purchase';
            } else if (description.includes('scheme')) {
                return 'Scheme Purchase';
            } else if (description.includes('order purchase')) {
                return 'Product Purchase';
            } else if (description.includes('cashback')) {
                return 'Cashback';
            }
            return 'Debit';
        }

        return 'Transaction';
    };

    if (loading && walletState.transactions.length === 0) {
        return <LoadingToast show={loading} />;
    }

    return (
        <Container fluid className="py-4">
            {/* Alert Message */}
            {alertMessage.text && (
                <Alert
                    variant={alertMessage.type}
                    onClose={() => setAlertMessage({ type: '', text: '' })}
                    dismissible
                    className="mb-4"
                >
                    {alertMessage.text}
                </Alert>
            )}

            {/* Page Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Button
                                variant="outline-primary"
                                onClick={() => navigate('/home')}
                                className="mb-3"
                            >
                                <FaHome className="me-2" />
                                Back to Home
                            </Button>
                            <h2 className="fw-bold">
                                <FaWallet className="me-2 text-danger" />
                                My Wallet
                            </h2>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Wallet Balance Card with Add & Withdraw Buttons */}
            <Row className="mb-4">
                <Col>
                    <Card className="border-0 shadow">
                        <Card.Body className="p-4">
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                            <FaWallet size={32} className="text-danger" />
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-1">Current Wallet Balance</h3>
                                            <p className="text-muted mb-0">Available for purchases and transfers</p>
                                        </div>
                                    </div>
                                    <h1 className="display-4 fw-bold text-danger">
                                        <FaRupeeSign className="me-2" />
                                        {walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h1>
                                </Col>
                                <Col md={4} className="text-end">
                                    <div className="d-flex flex-column gap-3">
                                        <Button
                                            variant="danger"
                                            size="lg"
                                            onClick={() => setShowAddMoney(true)}
                                            className="px-4 py-3 d-flex align-items-center justify-content-center"
                                            disabled={loading}
                                        >
                                            <FaPlus className="me-2" /> Add Money
                                        </Button>
                                        <Button
                                            variant="outline-warning"
                                            size="lg"
                                            onClick={() => setShowWithdraw(true)}
                                            className="px-4 py-3 d-flex align-items-center justify-content-center"
                                            disabled={walletState.balance === 0 || loading}
                                        >
                                            <FaDownload className="me-2" /> Withdraw
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={6}>
                   
                </Col>
                <Col md={6}>
                    
                </Col>
            </Row>

            {/* Transactions Table */}
            <Card className="border-0 shadow">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">
                            <FaHistory className="me-2" />
                            My Wallet Transactions
                        </h4>
                        <Badge bg="secondary" className="px-3 py-2">
                            Total: {walletState.transactions.length} transactions
                        </Badge>
                    </div>

                    {walletState.transactions.length === 0 ? (
                        <div className="text-center py-5">
                            <FaMoneyBillWave className="text-muted mb-3" size={48} />
                            <h5 className="text-muted">No wallet transactions yet</h5>
                            <p className="text-muted">Start by adding money to your wallet or making purchases</p>
                            <div className="d-flex gap-2 justify-content-center mt-3">
                                <Button
                                    variant="danger"
                                    onClick={() => setShowAddMoney(true)}
                                    className="mt-2"
                                >
                                    <FaPlus className="me-2" /> Add Money
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => navigate('/products')}
                                    className="mt-2"
                                >
                                    <FaShoppingCart className="me-2" /> Browse Products
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Date & Time</th>
                                        <th>Type & Details</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {walletState.transactions.map((transaction, index) => {
                                        const { color } = getTransactionIcon(transaction);
                                        const transactionType = getTransactionTypeText(transaction);
                                        const amount = Math.abs(parseFloat(transaction.amount || 0));
                                        const isCredit = (transaction.type || transaction.transaction_type || '').toLowerCase() === 'credit';

                                        return (
                                            <tr key={transaction.id || transaction.transaction_id || index}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <code className="text-primary">
                                                            {transaction.id || transaction.transaction_id || `TXN-${index + 1}`}
                                                        </code>
                                                    </div>
                                                </td>
                                                <td>
                                                    {formatDateTime(transaction.created_at || transaction.date)}
                                                </td>
                                                <td>
                                                    <div>
                                                        <Badge bg={color} className="mb-1">
                                                            {transactionType}
                                                        </Badge>
                                                        <div className="small text-muted">
                                                            {transaction.description || transaction.remarks || 'Transaction'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                                                    <div className="d-flex align-items-center">
                                                        {isCredit ? (
                                                            <>
                                                                + ₹{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </>
                                                        ) : (
                                                            <>
                                                                - ₹{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Add Money Modal */}
            <Modal show={showAddMoney} onHide={() => {
                setShowAddMoney(false);
                setAddAmount('');
            }} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>
                        <FaPlus className="me-2" />
                        Add Money
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-4">
                        <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-4 mb-3">
                            <FaCreditCard size={40} className="text-danger" />
                        </div>
                        <h5>Add Money to Your Wallet</h5>
                        <p className="text-muted">Securely top up your wallet to make quick and easy payments anytime.</p>
                    </div>

                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label>Amount (₹)</Form.Label>
                            <InputGroup size="lg">
                                <InputGroup.Text className="bg-danger text-white">₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={addAmount}
                                    onChange={(e) => setAddAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="1"
                                    step="0.01"
                                    className="py-3"
                                    disabled={loading}
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="mb-2">Quick Select</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {[100, 500, 1000, 2000, 5000].map(amount => (
                                    <Button
                                        key={amount}
                                        variant={parseFloat(addAmount) === amount ? "danger" : "outline-danger"}
                                        className="rounded-pill"
                                        onClick={() => setAddAmount(amount.toString())}
                                        disabled={loading}
                                    >
                                        ₹{amount}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => {
                        setShowAddMoney(false);
                        setAddAmount('');
                    }} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleAddMoney}
                        disabled={!addAmount || parseFloat(addAmount) <= 0 || loading}
                        className="px-4"
                    >
                        <FaCreditCard className="me-2" /> Add ₹{parseFloat(addAmount || 0).toFixed(2)}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Withdraw Modal */}
            <Modal show={showWithdraw} onHide={() => {
                setShowWithdraw(false);
                setWithdrawAmount('');
                setWithdrawWalletType('personal');
            }} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>
                        <FaDownload className="me-2" />
                        Withdraw from Wallet
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-4">
                        <div className="rounded-circle bg-warning bg-opacity-10 d-inline-flex p-4 mb-3">
                            <FaDownload size={40} className="text-warning" />
                        </div>
                        <h5>Withdraw Money to Bank Account</h5>
                        <p className="text-muted">Available balance: ₹{walletState.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>

                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label>Wallet Type</Form.Label>
                            <Form.Select 
                                value={withdrawWalletType}
                                onChange={(e) => setWithdrawWalletType(e.target.value)}
                                disabled={loading}
                                className="py-2"
                            >
                                <option value="personal">Personal Wallet</option>
                                <option value="bonus">Bonus Wallet</option>
                                <option value="user_wallet">User Wallet</option>
                                <option value="cashback">Cashback Wallet</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Select which wallet you want to withdraw from
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Withdrawal Amount (₹)</Form.Label>
                            <InputGroup size="lg">
                                <InputGroup.Text className="bg-warning text-white">₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="1"
                                    max={walletState.balance}
                                    step="0.01"
                                    className="py-3"
                                    disabled={loading}
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="mb-2">Quick Select</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {[500, 1000, 2000, 5000].map(amount => (
                                    <Button
                                        key={amount}
                                        variant={parseFloat(withdrawAmount) === amount ? "warning" : "outline-warning"}
                                        className="rounded-pill"
                                        onClick={() => setWithdrawAmount(amount.toString())}
                                        disabled={walletState.balance < amount || loading}
                                    >
                                        ₹{amount}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>

                        <Alert variant="info" className="mt-3">
                            <small>
                                <strong>Note:</strong> Withdrawal requests are processed within 2-3 business days. 
                                Minimum withdrawal amount is ₹500. Bank account details must be verified.
                            </small>
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => {
                        setShowWithdraw(false);
                        setWithdrawAmount('');
                        setWithdrawWalletType('personal');
                    }} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="warning"
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletState.balance || loading}
                        className="px-4"
                    >
                        <FaDownload className="me-2" /> Withdraw ₹{parseFloat(withdrawAmount || 0).toFixed(2)}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MyWalletPage;