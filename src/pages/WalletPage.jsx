// src/pages/WalletPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaWallet, FaRupeeSign, FaDownload, FaCoins,
    FaHistory, FaArrowUp, FaArrowDown, FaFilter,
    FaExchangeAlt, FaPlus, FaCreditCard, FaChartLine
} from 'react-icons/fa';
import {
    Container, Row, Col, Card, Button, Table, Badge,
    Tabs, Tab, Modal, Form, InputGroup, Alert
} from 'react-bootstrap';

const WalletPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') || 'myWallet';
    
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferData, setTransferData] = useState({
        from: 'myWallet',
        to: 'commissionWallet',
        amount: ''
    });
    const [filterType, setFilterType] = useState('all');
    const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

    // Wallet state
    const [walletState, setWalletState] = useState({
        myWallet: 0,
        commissionWallet: 0,
        withdrawWallet: 0,
        transactions: []
    });

    // Load wallet data on component mount
    useEffect(() => {
        loadWalletData();
    }, []);

    // Update active tab when URL changes
    useEffect(() => {
        const tab = queryParams.get('tab') || 'myWallet';
        setActiveTab(tab);
    }, [location.search]);

    const loadWalletData = () => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            const savedTransactions = localStorage.getItem('flh_transactions');

            if (savedWallets) {
                const wallets = JSON.parse(savedWallets);
                setWalletState(prev => ({
                    ...prev,
                    myWallet: wallets.myWallet || 12500,
                    commissionWallet: wallets.commissionWallet || 3200,
                    withdrawWallet: wallets.withdrawWallet || 0
                }));
            } else {
                // Initialize wallet if not exists
                const initialWallets = {
                    myWallet: 12500,
                    commissionWallet: 3200,
                    withdrawWallet: 0
                };
                localStorage.setItem('flh_wallets', JSON.stringify(initialWallets));
                setWalletState(prev => ({
                    ...prev,
                    ...initialWallets
                }));
            }

            if (savedTransactions) {
                const transactions = JSON.parse(savedTransactions);
                setWalletState(prev => ({
                    ...prev,
                    transactions: transactions || []
                }));
            }
        } catch (error) {
            console.error('Error loading wallet data:', error);
        }
    };

    // Save transaction
    const saveTransaction = (transaction) => {
        const savedTransactions = localStorage.getItem('flh_transactions');
        const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        transactions.unshift(transaction);
        localStorage.setItem('flh_transactions', JSON.stringify(transactions));
        
        setWalletState(prev => ({
            ...prev,
            transactions: [transaction, ...prev.transactions]
        }));
    };

    // Handle add money
    const handleAddMoney = () => {
        if (!addAmount || addAmount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            const wallets = savedWallets ? JSON.parse(savedWallets) : {
                myWallet: 12500,
                commissionWallet: 3200,
                withdrawWallet: 0
            };

            const newBalance = wallets.myWallet + parseFloat(addAmount);
            const updatedWallets = {
                ...wallets,
                myWallet: newBalance
            };

            localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));

            const newTransaction = {
                id: Date.now(),
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                type: 'credit',
                amount: parseFloat(addAmount),
                category: 'recharge',
                description: 'Added money to wallet',
                balance: newBalance,
                status: 'completed'
            };

            saveTransaction(newTransaction);

            setWalletState(prev => ({
                ...prev,
                myWallet: newBalance
            }));

            setAlertMessage({ type: 'success', text: `Successfully added ₹${addAmount} to your wallet!` });
            setShowAddMoney(false);
            setAddAmount('');
        } catch (error) {
            console.error('Error adding money:', error);
            setAlertMessage({ type: 'danger', text: 'Error adding money. Please try again.' });
        }
    };

    // Handle withdraw
    const handleWithdraw = () => {
        if (!withdrawAmount || withdrawAmount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        const amountNum = parseFloat(withdrawAmount);
        const walletBalance = walletState[activeTab];

        if (walletBalance < amountNum) {
            setAlertMessage({ type: 'danger', text: `Insufficient balance. Available: ₹${walletBalance}` });
            return;
        }

        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            const wallets = savedWallets ? JSON.parse(savedWallets) : {
                myWallet: 12500,
                commissionWallet: 3200,
                withdrawWallet: 0
            };

            const newBalance = wallets[activeTab] - amountNum;
            const updatedWallets = {
                ...wallets,
                [activeTab]: newBalance
            };

            localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));

            const newTransaction = {
                id: Date.now(),
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                type: 'debit',
                amount: amountNum,
                category: 'withdrawal',
                description: `Withdrawal from ${getWalletName(activeTab)}`,
                balance: newBalance,
                status: 'pending',
                wallet: activeTab
            };

            saveTransaction(newTransaction);

            setWalletState(prev => ({
                ...prev,
                [activeTab]: newBalance
            }));

            setAlertMessage({ type: 'success', text: `Withdrawal request of ₹${withdrawAmount} submitted successfully!` });
            setShowWithdraw(false);
            setWithdrawAmount('');
        } catch (error) {
            console.error('Error withdrawing money:', error);
            setAlertMessage({ type: 'danger', text: 'Error withdrawing money. Please try again.' });
        }
    };

    // Handle transfer
    const handleTransfer = () => {
        if (!transferData.amount || transferData.amount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        if (transferData.from === transferData.to) {
            setAlertMessage({ type: 'danger', text: 'Cannot transfer to same wallet' });
            return;
        }

        const amountNum = parseFloat(transferData.amount);
        const fromBalance = walletState[transferData.from];

        if (fromBalance < amountNum) {
            setAlertMessage({ type: 'danger', text: `Insufficient balance in ${getWalletName(transferData.from)}` });
            return;
        }

        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            const wallets = savedWallets ? JSON.parse(savedWallets) : {
                myWallet: 12500,
                commissionWallet: 3200,
                withdrawWallet: 0
            };

            const newFromBalance = wallets[transferData.from] - amountNum;
            const newToBalance = wallets[transferData.to] + amountNum;
            const updatedWallets = {
                ...wallets,
                [transferData.from]: newFromBalance,
                [transferData.to]: newToBalance
            };

            localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));

            const newTransaction = {
                id: Date.now(),
                date: new Date().toLocaleDateString('en-IN'),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                type: 'transfer',
                amount: amountNum,
                category: 'wallet_transfer',
                description: `Transfer from ${getWalletName(transferData.from)} to ${getWalletName(transferData.to)}`,
                from: transferData.from,
                to: transferData.to,
                balance: newToBalance,
                status: 'completed'
            };

            saveTransaction(newTransaction);

            setWalletState(prev => ({
                ...prev,
                [transferData.from]: newFromBalance,
                [transferData.to]: newToBalance
            }));

            setAlertMessage({ type: 'success', text: `Successfully transferred ₹${transferData.amount}!` });
            setShowTransfer(false);
            setTransferData({
                from: 'myWallet',
                to: 'commissionWallet',
                amount: ''
            });
        } catch (error) {
            console.error('Error transferring money:', error);
            setAlertMessage({ type: 'danger', text: 'Error transferring money. Please try again.' });
        }
    };

    const getWalletName = (walletType) => {
        switch(walletType) {
            case 'myWallet': return 'My Wallet';
            case 'commissionWallet': return 'Commission Wallet';
            case 'withdrawWallet': return 'Withdraw Wallet';
            default: return walletType;
        }
    };

    const getWalletColor = (walletType) => {
        switch(walletType) {
            case 'myWallet': return '#4CAF50';
            case 'commissionWallet': return '#FF9800';
            case 'withdrawWallet': return '#2196F3';
            default: return '#6c757d';
        }
    };

    const getWalletIcon = (walletType) => {
        switch(walletType) {
            case 'myWallet': return <FaWallet />;
            case 'commissionWallet': return <FaCoins />;
            case 'withdrawWallet': return <FaDownload />;
            default: return <FaWallet />;
        }
    };

    // Get transactions for active wallet
    const getWalletTransactions = () => {
        return walletState.transactions.filter(t => 
            t.wallet === activeTab || 
            (t.type === 'transfer' && (t.from === activeTab || t.to === activeTab))
        );
    };

    const filteredTransactions = getWalletTransactions().filter(transaction => {
        if (filterType === 'all') return true;
        if (filterType === 'credit') return transaction.type === 'credit';
        if (filterType === 'debit') return transaction.type === 'debit';
        if (filterType === 'transfer') return transaction.type === 'transfer';
        return true;
    });

    // Calculate statistics
    const getStatistics = () => {
        const transactions = getWalletTransactions();
        
        const totalCredit = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalDebit = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalTransferIn = transactions
            .filter(t => t.type === 'transfer' && t.to === activeTab)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalTransferOut = transactions
            .filter(t => t.type === 'transfer' && t.from === activeTab)
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
            totalCredit,
            totalDebit,
            totalTransferIn,
            totalTransferOut,
            netChange: totalCredit + totalTransferIn - totalDebit - totalTransferOut,
            transactionCount: transactions.length
        };
    };

    const statistics = getStatistics();

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
                    <h2 className="fw-bold">Wallet Management</h2>
                    <p className="text-muted">Manage your wallet balances and transactions</p>
                </Col>
            </Row>

            {/* Wallet Tabs */}
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => {
                    setActiveTab(k);
                    navigate(`/wallet?tab=${k}`);
                }}
                className="mb-4"
                fill
            >
                <Tab eventKey="myWallet" title={
                    <div className="d-flex align-items-center">
                        <FaWallet className="me-2" />
                        My Wallet
                    </div>
                }>
                    <WalletContent 
                        walletType="myWallet"
                        walletState={walletState}
                        statistics={statistics}
                        filteredTransactions={filteredTransactions}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        onAddMoney={() => setShowAddMoney(true)}
                        onWithdraw={() => setShowWithdraw(true)}
                        onTransfer={() => setShowTransfer(true)}
                    />
                </Tab>

                <Tab eventKey="commissionWallet" title={
                    <div className="d-flex align-items-center">
                        <FaCoins className="me-2" />
                        Commission Wallet
                    </div>
                }>
                    <WalletContent 
                        walletType="commissionWallet"
                        walletState={walletState}
                        statistics={statistics}
                        filteredTransactions={filteredTransactions}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        onAddMoney={() => setShowAddMoney(true)}
                        onWithdraw={() => setShowWithdraw(true)}
                        onTransfer={() => setShowTransfer(true)}
                    />
                </Tab>

                <Tab eventKey="withdrawWallet" title={
                    <div className="d-flex align-items-center">
                        <FaDownload className="me-2" />
                        Withdraw Wallet
                    </div>
                }>
                    <WalletContent 
                        walletType="withdrawWallet"
                        walletState={walletState}
                        statistics={statistics}
                        filteredTransactions={filteredTransactions}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        onAddMoney={() => setShowAddMoney(true)}
                        onWithdraw={() => setShowWithdraw(true)}
                        onTransfer={() => setShowTransfer(true)}
                    />
                </Tab>
            </Tabs>

            {/* Add Money Modal */}
            <Modal show={showAddMoney} onHide={() => setShowAddMoney(false)} centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>Add Money to {getWalletName(activeTab)}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Enter Amount (₹)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={addAmount}
                                    onChange={(e) => setAddAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="1"
                                />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Quick Add</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {[100, 500, 1000, 2000, 5000].map(amount => (
                                    <Button
                                        key={amount}
                                        variant="outline-primary"
                                        className="rounded-pill"
                                        onClick={() => setAddAmount(amount)}
                                    >
                                        ₹{amount}
                                    </Button>
                                ))}
                            </div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddMoney(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddMoney}
                        disabled={!addAmount || addAmount <= 0}
                    >
                        <FaCreditCard className="me-2" /> Add Money
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Withdraw Modal */}
            <Modal show={showWithdraw} onHide={() => setShowWithdraw(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>Withdraw from {getWalletName(activeTab)}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Enter Amount (₹)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="1"
                                    max={walletState[activeTab]}
                                />
                            </InputGroup>
                            <Form.Text className="text-muted">
                                Available balance: ₹{walletState[activeTab].toLocaleString()}
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowWithdraw(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || withdrawAmount <= 0}
                    >
                        <FaDownload className="me-2" /> Withdraw
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Transfer Modal */}
            <Modal show={showTransfer} onHide={() => setShowTransfer(false)} centered>
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title>Transfer Funds</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>From Wallet</Form.Label>
                            <Form.Select
                                value={transferData.from}
                                onChange={(e) => setTransferData({...transferData, from: e.target.value})}
                            >
                                <option value="myWallet">My Wallet</option>
                                <option value="commissionWallet">Commission Wallet</option>
                                <option value="withdrawWallet">Withdraw Wallet</option>
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>To Wallet</Form.Label>
                            <Form.Select
                                value={transferData.to}
                                onChange={(e) => setTransferData({...transferData, to: e.target.value})}
                            >
                                <option value="myWallet">My Wallet</option>
                                <option value="commissionWallet">Commission Wallet</option>
                                <option value="withdrawWallet">Withdraw Wallet</option>
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Amount (₹)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    min="1"
                                    max={walletState[transferData.from]}
                                />
                            </InputGroup>
                            <Form.Text className="text-muted">
                                Available in {getWalletName(transferData.from)}: ₹{walletState[transferData.from].toLocaleString()}
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTransfer(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="info"
                        onClick={handleTransfer}
                        disabled={!transferData.amount || transferData.amount <= 0}
                    >
                        <FaExchangeAlt className="me-2" /> Transfer
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

// Wallet Content Component
const WalletContent = ({ 
    walletType, 
    walletState, 
    statistics, 
    filteredTransactions, 
    filterType, 
    setFilterType,
    onAddMoney, 
    onWithdraw, 
    onTransfer 
}) => {
    const getWalletColor = (type) => {
        switch(type) {
            case 'myWallet': return '#4CAF50';
            case 'commissionWallet': return '#FF9800';
            case 'withdrawWallet': return '#2196F3';
            default: return '#6c757d';
        }
    };

    const getWalletIcon = (type) => {
        switch(type) {
            case 'myWallet': return <FaWallet />;
            case 'commissionWallet': return <FaCoins />;
            case 'withdrawWallet': return <FaDownload />;
            default: return <FaWallet />;
        }
    };

    const getWalletName = (type) => {
        switch(type) {
            case 'myWallet': return 'My Wallet';
            case 'commissionWallet': return 'Commission Wallet';
            case 'withdrawWallet': return 'Withdraw Wallet';
            default: return type;
        }
    };

    const color = getWalletColor(walletType);

    return (
        <>
            {/* Wallet Balance Card */}
            <Row className="mb-4">
                <Col>
                    <Card className="border-0 shadow" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
                        <Card.Body className="text-white p-4">
                            <Row className="align-items-center">
                                <Col md={6}>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-white bg-opacity-20 p-3 me-3">
                                            {getWalletIcon(walletType)}
                                        </div>
                                        <div>
                                            <h2 className="fw-bold mb-1">{getWalletName(walletType)}</h2>
                                            <p className="mb-0 opacity-75">
                                                {walletType === 'myWallet' && 'Main wallet for all transactions'}
                                                {walletType === 'commissionWallet' && 'Incentives and referral earnings'}
                                                {walletType === 'withdrawWallet' && 'Amount available for withdrawal'}
                                            </p>
                                        </div>
                                    </div>
                                    <h1 className="display-4 fw-bold">
                                        <FaRupeeSign className="me-2" />
                                        {walletState[walletType].toLocaleString()}
                                    </h1>
                                </Col>
                                <Col md={6} className="text-end">
                                    <div className="d-flex gap-3 justify-content-end">
                                        <Button
                                            variant="light"
                                            size="lg"
                                            onClick={onAddMoney}
                                            className="px-4 d-flex align-items-center"
                                        >
                                            <FaPlus className="me-2" /> Add Money
                                        </Button>
                                        <Button
                                            variant="outline-light"
                                            size="lg"
                                            onClick={onWithdraw}
                                            className="px-4 d-flex align-items-center"
                                        >
                                            <FaDownload className="me-2" /> Withdraw
                                        </Button>
                                        <Button
                                            variant="outline-light"
                                            size="lg"
                                            onClick={onTransfer}
                                            className="px-4 d-flex align-items-center"
                                        >
                                            <FaExchangeAlt className="me-2" /> Transfer
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Statistics */}
            <Row className="g-4 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center p-3">
                            <FaArrowUp className="text-success fs-3 mb-2" />
                            <div className="text-muted small">Total Added</div>
                            <div className="fs-4 fw-bold text-success">
                                ₹{statistics.totalCredit.toLocaleString()}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center p-3">
                            <FaArrowDown className="text-danger fs-3 mb-2" />
                            <div className="text-muted small">Total Withdrawn</div>
                            <div className="fs-4 fw-bold text-danger">
                                ₹{statistics.totalDebit.toLocaleString()}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center p-3">
                            <FaExchangeAlt className="text-info fs-3 mb-2" />
                            <div className="text-muted small">Net Transfers</div>
                            <div className="fs-4 fw-bold text-info">
                                ₹{(statistics.totalTransferIn - statistics.totalTransferOut).toLocaleString()}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center p-3">
                            <FaHistory className="text-primary fs-3 mb-2" />
                            <div className="text-muted small">Transactions</div>
                            <div className="fs-4 fw-bold text-primary">
                                {statistics.transactionCount}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Transactions */}
            <Card className="border-0 shadow">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">
                            <FaHistory className="me-2" />
                            Transaction History
                        </h4>
                        <div className="d-flex gap-2">
                            {['all', 'credit', 'debit', 'transfer'].map(filter => (
                                <Button
                                    key={filter}
                                    variant={filterType === filter ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={() => setFilterType(filter)}
                                    className="rounded-pill"
                                >
                                    {filter === 'all' && 'All'}
                                    {filter === 'credit' && <><FaArrowUp /> Added</>}
                                    {filter === 'debit' && <><FaArrowDown /> Withdrawn</>}
                                    {filter === 'transfer' && <><FaExchangeAlt /> Transfers</>}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-5">
                            <FaHistory className="text-muted mb-3" size={48} />
                            <h5 className="text-muted">No transactions found</h5>
                            <p className="text-muted">Start by adding money to your wallet</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Description</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Balance</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction, index) => (
                                        <tr key={transaction.id || index}>
                                            <td>
                                                <div className="fw-medium">{transaction.date}</div>
                                                <small className="text-muted">{transaction.time}</small>
                                            </td>
                                            <td>{transaction.description}</td>
                                            <td>
                                                <Badge 
                                                    bg={transaction.type === 'credit' ? 'success' : 
                                                        transaction.type === 'debit' ? 'danger' : 'info'}
                                                    className="px-3 py-1"
                                                >
                                                    {transaction.type === 'credit' ? 'ADDED' : 
                                                     transaction.type === 'debit' ? 'WITHDRAWN' : 'TRANSFER'}
                                                </Badge>
                                            </td>
                                            <td className={`fw-bold ${
                                                transaction.type === 'credit' ? 'text-success' : 
                                                transaction.type === 'debit' ? 'text-danger' : 'text-info'
                                            }`}>
                                                {transaction.type === 'credit' ? '+' : 
                                                 transaction.type === 'debit' ? '-' : '↔'}
                                                ₹{transaction.amount?.toLocaleString() || '0'}
                                            </td>
                                            <td className="fw-medium">
                                                ₹{transaction.balance?.toLocaleString() || '0'}
                                            </td>
                                            <td>
                                                <Badge bg={transaction.status === 'completed' ? 'success' : 'warning'}>
                                                    {transaction.status?.toUpperCase() || 'PENDING'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </>
    );
};

export default WalletPage;