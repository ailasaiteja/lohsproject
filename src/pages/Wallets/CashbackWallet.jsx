import React, { useState, useEffect } from 'react';
import {
  Container, Card, Badge, Row, Col, Button, Modal, Table
} from 'react-bootstrap';
import {
  FaWallet, FaRupeeSign, FaMoneyBillWave, FaCalendarAlt,
  FaTicketAlt, FaTrophy, FaHistory, FaFilter, FaInfoCircle,
  FaExchangeAlt, FaArrowUp, FaArrowDown, FaClock,
  FaArrowLeft, FaListAlt, FaHome
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchCashbackwalletTransactions } from './cashbackwalletApi';
import LoadingToast from '../loading/LoadingToast';

const CashbackWallet = () => {
  const navigate = useNavigate();
  
  const [walletData, setWalletData] = useState({
    balance: 0,
    totalWon: 0,
    transactions: []
  });
  const [filterType, setFilterType] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency with ₹ symbol
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.0';
    return `₹${parseFloat(amount).toFixed(1)}`;
  };

  // Format date (DD MMM YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    } catch (e) {
      return dateString;
    }
  };

  // Format time (HH:MM AM/PM)
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase();
    } catch (e) {
      return '';
    }
  };

  // Get transaction type badge
  const getTransactionTypeBadge = (type) => {
    switch(type?.toLowerCase()) {
      case 'credit':
        return <Badge bg="success" className="ms-2">Credit</Badge>;
      case 'debit':
        return <Badge bg="danger" className="ms-2">Debit</Badge>;
      default:
        return <Badge bg="secondary" className="ms-2">{type}</Badge>;
    }
  };

  // Get transaction icon based on description
  const getTransactionIcon = (type, description) => {
    if (description?.toLowerCase().includes('lucky draw')) {
      return <FaTrophy className="text-warning" />;
    } else if (type?.toLowerCase() === 'credit') {
      return <FaMoneyBillWave className="text-success" />;
    } else if (type?.toLowerCase() === 'debit') {
      return <FaExchangeAlt className="text-danger" />;
    }
    return <FaMoneyBillWave className="text-secondary" />;
  };

  // Get transaction title from description
  const getTransactionTitle = (description) => {
    if (!description) return 'Transaction';
    
    // Extract main title from description
    if (description.includes('Lucky Draw Prize')) {
      return description.split('|')[0].trim();
    } else if (description.includes('Order purchase debit')) {
      const match = description.match(/Products: \[(.*?)\]/);
      if (match && match[1]) {
        return `Purchase: ${match[1]}`;
      }
    }
    return description.substring(0, 50) + (description.length > 50 ? '...' : '');
  };

  // Load transactions from API
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchCashbackwalletTransactions();
      
      if (response && response.success) {
        // Get the transactions array from response.data
        const transactions = response.data || [];
        
        // Calculate total won from credit transactions
        const totalWon = transactions
          .filter(t => t.type?.toLowerCase() === 'credit')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        // Get current balance from the first transaction (all have same balance)
        const currentBalance = transactions.length > 0
          ? parseFloat(transactions[0].current_balance) 
          : 0;
        
        setWalletData({
          balance: currentBalance,
          totalWon: totalWon,
          transactions: transactions
        });
      } else {
        setError('Failed to load wallet data');
        setWalletData({
          balance: 0,
          totalWon: 0,
          transactions: []
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('An error occurred while loading your wallet');
      setWalletData({
        balance: 0,
        totalWon: 0,
        transactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on type
  const getFilteredTransactions = () => {
    if (filterType === 'all') return walletData.transactions;
    
    return walletData.transactions.filter(t => {
      if (filterType === 'credit') {
        return t.type?.toLowerCase() === 'credit';
      } else if (filterType === 'debit') {
        return t.type?.toLowerCase() === 'debit';
      }
      return false;
    });
  };

  // Handle transaction details view
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Handle back to home
  const handleBackToWallet = () => {
    navigate('/');
  };

  if (loading) {
    return <LoadingToast show={loading}/>
  }

  return (
    <Container fluid className="p-1 bg-light" style={{ minHeight: '100vh' }}>
      {/* Header Section */}
      <div className="bg-white border-bottom p-4">
        <Row className="align-items-center">
          <Col xs={4}>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleBackToWallet}
              className="d-flex align-items-center"
            >
              <FaHome className="me-2" />
              Back to Home
            </Button>
          </Col>
        </Row>
      </div>

      {/* Balance Card */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center">
            <FaWallet className="text-primary me-3 fs-3" />
            <div>
              <h2 className="h4 fw-bold mb-2">
                My Cashback Wallet
              </h2>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <div className="bg-primary text-white p-4">
        <div className="text-start">
          <div className="d-flex align-items-center mb-1">
            <FaWallet className="me-2" />
            <span className="fw-medium">Current Balance</span>
          </div>
          <div className="display-4 fw-bold">
            {formatCurrency(walletData.balance)}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Container className="py-2">
        {/* Error Display */}
        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-3 d-flex gap-2">
          <Button
            variant={filterType === 'all' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'credit' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setFilterType('credit')}
          >
            Credits
          </Button>
          <Button
            variant={filterType === 'debit' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setFilterType('debit')}
          >
            Debits
          </Button>
        </div>

        {/* Transactions List */}
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            {/* Table Header */}
            <div className="p-3 bg-light border-bottom">
              <Row className="align-items-center">
                <Col xs={1} className="text-center">
                  <span className="text-muted small fw-bold">Type</span>
                </Col>
                <Col xs={6}>
                  <span className="text-muted small fw-bold">Transaction Details</span>
                </Col>
                <Col xs={2} className="text-center">
                  <span className="text-muted small fw-bold">Amount</span>
                </Col>
                <Col xs={3} className="text-end">
                  <span className="text-muted small fw-bold">Date & Time</span>
                </Col>
              </Row>
            </div>

            {getFilteredTransactions().length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-4">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-3">
                    <FaHistory className="fs-1 text-muted" />
                  </div>
                  <h4 className="text-muted mb-3">
                    No Transactions Found
                  </h4>
                  <p className="text-muted mb-4">
                    {filterType === 'all'
                      ? "You don't have any transactions yet."
                      : `You don't have any ${filterType} transactions.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3">
                {getFilteredTransactions().map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="mb-3 border-0 shadow-sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetails(transaction)}
                  >
                    <Card.Body className="p-3">
                      <Row className="align-items-center">
                        <Col xs={1} className="text-center">
                          <div className="fs-5">
                            {getTransactionIcon(transaction.type, transaction.description)}
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="mb-1">
                            <span className="fw-medium">
                              {getTransactionTitle(transaction.description)}
                            </span>
                            {getTransactionTypeBadge(transaction.type)}
                          </div>
                          <small className="text-muted">
                            {transaction.description}
                          </small>
                        </Col>
                        <Col xs={2} className="text-center">
                          <div className={`fw-bold ${transaction.type?.toLowerCase() === 'credit' ? 'text-success' : 'text-danger'}`}>
                            {transaction.type?.toLowerCase() === 'credit' ? <FaArrowUp className="me-1" /> : <FaArrowDown className="me-1" />}
                            {formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                          </div>
                        </Col>
                        <Col xs={3} className="text-end">
                          <div className="text-muted fw-medium mb-1">
                            <FaCalendarAlt className="me-1" />
                            {formatDate(transaction.created_at)}
                          </div>
                          <div className="text-muted small">
                            <FaClock className="me-1" />
                            {formatTime(transaction.created_at)}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Transaction Details Modal
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
        {selectedTransaction && (
          <>
            <Modal.Header closeButton className={`bg-${selectedTransaction.type?.toLowerCase() === 'credit' ? 'success' : 'danger'} text-white`}>
              <Modal.Title className="d-flex align-items-center">
                {getTransactionIcon(selectedTransaction.type, selectedTransaction.description)}
                <span className="ms-2">Transaction Details</span>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Description:</strong></td>
                    <td>{selectedTransaction.description}</td>
                  </tr>
                  <tr>
                    <td><strong>Amount:</strong></td>
                    <td>
                      <span className={`fw-bold ${selectedTransaction.type?.toLowerCase() === 'credit' ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(Math.abs(parseFloat(selectedTransaction.amount)))}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Type:</strong></td>
                    <td>{getTransactionTypeBadge(selectedTransaction.type)}</td>
                  </tr>
                  <tr>
                    <td><strong>Date:</strong></td>
                    <td>{formatDate(selectedTransaction.created_at)}</td>
                  </tr>
                  <tr>
                    <td><strong>Time:</strong></td>
                    <td>
                      <FaClock className="me-2" />
                      {formatTime(selectedTransaction.created_at)}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>
                      <Badge bg={selectedTransaction.type?.toLowerCase() === 'credit' ? 'success' : 'danger'}>
                        {selectedTransaction.type?.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Balance after transaction:</strong></td>
                    <td>
                      <span className="fw-bold text-primary">
                        {formatCurrency(selectedTransaction.current_balance)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Transaction ID:</strong></td>
                    <td><code>{selectedTransaction.id}</code></td>
                  </tr>
                </tbody>
              </Table>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal> */}
    </Container>
  );
};

export default CashbackWallet;