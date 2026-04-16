import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Alert, ProgressBar, Tab, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaChartLine, FaEye, FaChevronLeft, FaHistory, FaFileInvoice,
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner,
  FaWallet, FaBan, FaQuestionCircle, FaExclamationCircle, FaPlus
} from 'react-icons/fa';
import { fetchUserSchemes, makePartPayment } from './myschemesApi';
import LoadingToast from '../loading/LoadingToast';
import { useToast } from '../toast/ToastContext';

const MySchemes = ({ user }) => {
  const [schemes, setSchemes] = useState([]);
  const [currentSchemes, setCurrentSchemes] = useState([]);
  const [completedSchemes, setCompletedSchemes] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedSchemePayments, setSelectedSchemePayments] = useState([]);
  const [displayedPayments, setDisplayedPayments] = useState([]);
  const [visibleTermsCount, setVisibleTermsCount] = useState(10);
  const [mainWalletBalance, setMainWalletBalance] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Load schemes and wallet balance on component mount
  useEffect(() => {
    loadSchemes();
    loadWalletBalance();
  }, [user]);

  // Filter schemes into current and completed
  useEffect(() => {
    if (schemes && schemes.length > 0) {
      const current = schemes.filter(scheme =>
        scheme.status?.toLowerCase() === 'in progress' ||
        scheme.status?.toLowerCase().includes('progress')
      );

      const completed = schemes.filter(scheme =>
        scheme.status?.toLowerCase() === 'completed'
      );

      setCurrentSchemes(current);
      setCompletedSchemes(completed);
    } else {
      setCurrentSchemes([]);
      setCompletedSchemes([]);
    }
  }, [schemes]);

  // Update displayed payments when selectedSchemePayments or visibleTermsCount changes
  useEffect(() => {
    if (selectedSchemePayments.length > 0) {
      setDisplayedPayments(selectedSchemePayments.slice(0, visibleTermsCount));
    }
  }, [selectedSchemePayments, visibleTermsCount]);

  // Load wallet balance from Header's wallet system
  const loadWalletBalance = () => {
    try {
      const savedWallets = localStorage.getItem('flh_wallets');
      if (savedWallets) {
        const wallets = JSON.parse(savedWallets);
        setMainWalletBalance(wallets.myWallet || 0);
      } else {
        const initialWallets = {
          myWallet: 12500,
          commissionWallet: 3200,
          withdrawWallet: 0
        };
        localStorage.setItem('flh_wallets', JSON.stringify(initialWallets));
        setMainWalletBalance(initialWallets.myWallet);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setMainWalletBalance(0);
    }
  };

  // Update wallet balance
  const updateWalletBalance = (amount, transactionDetails) => {
    try {
      const savedWallets = localStorage.getItem('flh_wallets');
      const wallets = savedWallets ? JSON.parse(savedWallets) : {
        myWallet: 12500,
        commissionWallet: 3200,
        withdrawWallet: 0
      };

      const newBalance = wallets.myWallet - amount;

      const updatedWallets = {
        ...wallets,
        myWallet: newBalance
      };
      localStorage.setItem('flh_wallets', JSON.stringify(updatedWallets));
      setMainWalletBalance(newBalance);

      const savedTransactions = localStorage.getItem('flh_transactions');
      const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

      const newTransaction = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: 'debit',
        amount: amount,
        category: 'scheme_payment',
        description: transactionDetails.description,
        balance: newBalance,
        status: 'completed'
      };

      transactions.unshift(newTransaction);
      localStorage.setItem('flh_transactions', JSON.stringify(transactions));

      return true;
    } catch (error) {
      console.error('Error updating wallet:', error);
      return false;
    }
  };

  // Load schemes from API
  const loadSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchUserSchemes();

      console.log('API Response:', response);

      let apiData = [];

      if (Array.isArray(response)) {
        apiData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        apiData = response.data;
      }

      if (apiData.length > 0) {
        const apiSchemes = apiData.map((item, index) => {
          console.log(`Processing scheme ${index}:`, item);

          // Extract scheme details
          const schemeDetails = item.scheme_details && item.scheme_details[0] ? item.scheme_details[0] : {};
          const schemeInfo = item.scheme && item.scheme[0] ? item.scheme[0] : {};
          const payments = item.payments || [];

          // Calculate paid terms count
          const paidTerms = payments.filter(p => p.status === 'Paid' || p.status === 'paid').length;
          const totalTerms = payments.length;
          const installmentAmount = schemeInfo.scheme_term_amount || 0;
          const totalAmount = schemeDetails.total_amount || 0;
          const amountPaid = schemeDetails.amount_paid || 0;
          let status = schemeDetails.status || 'In Progress';

          // Format enrollment date
          let enrollmentDate = new Date();
          if (payments.length > 0 && payments[0].payment_schedule_date) {
            enrollmentDate = new Date(payments[0].payment_schedule_date);
          }

          const maturityAmount = schemeInfo.scheme_maturity || totalAmount;

          return {
            id: schemeDetails.id || `scheme-${index}`,
            schemeId: schemeInfo.id,
            schemeName: schemeInfo.name || 'Scheme',
            title: schemeInfo.name || 'Scheme',
            status: status,
            schemeType: schemeInfo.type || 'daily',
            totalTerms: totalTerms,
            paidTerms: paidTerms,
            installmentAmount: installmentAmount,
            amountPaid: amountPaid,
            maturityAmount: maturityAmount,
            enrollmentDate: enrollmentDate.toISOString(),
            totalInvestment: totalAmount,
            userId: schemeDetails.user,
            customerId: schemeDetails.user,
            lastPaymentDate: schemeDetails.last_payment_date,
            payments: payments,
            schemeInfo: schemeInfo,
            schemeDetails: schemeDetails,
            description: schemeInfo.description || ''
          };
        });

        console.log('Processed schemes:', apiSchemes);
        setSchemes(apiSchemes);
        // toast.success('Schemes Loaded', `Loaded ${apiSchemes.length} schemes successfully`);
      } else {
        console.log('No API data found');
        setSchemes([]);
        toast.info('No Schemes', 'No schemes found');
      }
    } catch (error) {
      console.error('Error loading schemes from API:', error);
      setError('Failed to load schemes. Please try again later.');
      toast.error('Error', 'Failed to load schemes');
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate payment terms from scheme data
  const generatePaymentTermsFromScheme = (scheme) => {
    const terms = [];

    if (scheme.payments && scheme.payments.length > 0) {
      const sortedPayments = [...scheme.payments].sort((a, b) =>
        (a.payment_iteration_number || 0) - (b.payment_iteration_number || 0)
      );

      sortedPayments.forEach((payment) => {
        const isPaid = payment.status === 'Paid' || payment.status === 'paid';

        terms.push({
          term: payment.payment_iteration_number,
          amount: payment.amount || 0,
          date: formatDate(payment.payment_schedule_date),
          status: isPaid ? 'Paid' : 'Pending',
          paid: isPaid,
          paidDate: payment.paid_date ? formatDate(payment.paid_date) : null,
          paymentId: payment.id,
          schemeId: scheme.id,
          schemeName: scheme.schemeName || scheme.title,
          originalPayment: payment
        });
      });
    }

    return terms;
  };

  // Handle view details
  const handleViewDetails = (scheme) => {
    console.log('Viewing details for scheme:', scheme);

    // Generate payment terms from the scheme's payments data
    const paymentTerms = generatePaymentTermsFromScheme(scheme);

    setSelectedScheme(scheme);
    setSelectedSchemePayments(paymentTerms);
    setVisibleTermsCount(10); // Reset to show first 10 terms
    setShowDetailsModal(true);
    // toast.info('Scheme Details', `Viewing details for ${scheme.schemeName}`);
  };

  // Load more terms
  const handleLoadMore = () => {
    const newCount = visibleTermsCount + 10;
    setVisibleTermsCount(newCount);
    // toast.info('Loading More', `Showing up to ${newCount} terms`);
  };

  // Show payment confirmation modal
  const showPaymentConfirmation = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentConfirmModal(true);
  };

  // Process payment after confirmation
  const processPayment = async () => {
    if (!selectedScheme || !selectedPayment) return;

    setShowPaymentConfirmModal(false);
    setProcessingPayment(true);

    try {
      // Check wallet balance
      if (mainWalletBalance < selectedPayment.amount) {
        toast.error('Insufficient Balance', `Need ₹${selectedPayment.amount}, Available: ₹${mainWalletBalance}`);
        setProcessingPayment(false);
        return;
      }

      // Check if paying correct term in order
      const currentPaidTerms = selectedScheme.paidTerms || 0;
      if (selectedPayment.term !== currentPaidTerms + 1) {
        toast.warning('Invalid Payment Order', `Please pay Term ${currentPaidTerms + 1} first. Terms must be paid in order.`);
        setProcessingPayment(false);
        return;
      }

      // Get the scheme_details_id from the selected scheme
      const schemeDetailsId = selectedScheme.id;
      const paymentId = selectedPayment.paymentId;

      console.log('Making payment with:', {
        scheme_details_id: schemeDetailsId,
        payment_id: paymentId,
        amount: selectedPayment.amount,
        term: selectedPayment.term
      });

      // Prepare payment data for API
      const paymentData = {
        scheme_details_id: schemeDetailsId,
        payment_id: paymentId,
        amount: selectedPayment.amount,
        term_number: selectedPayment.term
      };

      // Call the part-payment API
      const apiResponse = await makePartPayment(paymentData);

      console.log('Payment API response:', apiResponse);

      // Check if payment was successful
      if (apiResponse && (apiResponse.transaction_id || apiResponse.amount_paid)) {

        // Update wallet balance using the new_wallet_balance from API
        let newBalance = mainWalletBalance - selectedPayment.amount;

        if (apiResponse.new_wallet_balance) {
          newBalance = parseFloat(apiResponse.new_wallet_balance);
          try {
            const savedWallets = localStorage.getItem('flh_wallets');
            if (savedWallets) {
              const wallets = JSON.parse(savedWallets);
              wallets.myWallet = newBalance;
              localStorage.setItem('flh_wallets', JSON.stringify(wallets));
              setMainWalletBalance(newBalance);
            }
          } catch (error) {
            console.error('Error updating wallet from API response:', error);
            // Fallback to manual update
            const transactionDetails = {
              description: `Scheme Payment: ${selectedScheme.schemeName} - Term ${selectedPayment.term}`
            };
            updateWalletBalance(selectedPayment.amount, transactionDetails);
          }
        } else {
          // Manual wallet update
          const transactionDetails = {
            description: `Scheme Payment: ${selectedScheme.schemeName} - Term ${selectedPayment.term}`
          };
          const walletUpdated = updateWalletBalance(selectedPayment.amount, transactionDetails);
          if (!walletUpdated) {
            throw new Error('Failed to update wallet');
          }
        }

        // Update the payments list immediately
        const updatedPayments = selectedSchemePayments.map(payment => {
          if (payment.term === selectedPayment.term) {
            return {
              ...payment,
              paid: true,
              status: 'Paid',
              paidDate: formatDate(apiResponse.paid_at || new Date().toISOString())
            };
          }
          return payment;
        });

        setSelectedSchemePayments(updatedPayments);

        // Update the selected scheme
        const updatedScheme = {
          ...selectedScheme,
          paidTerms: (selectedScheme.paidTerms || 0) + 1,
          amountPaid: parseFloat(selectedScheme.amountPaid || 0) + parseFloat(selectedPayment.amount),
          status: (selectedScheme.paidTerms || 0) + 1 >= (selectedScheme.totalTerms || 0) ? 'Completed' : 'In Progress'
        };
        setSelectedScheme(updatedScheme);

        // Update the schemes list in main state
        const updatedSchemes = schemes.map(scheme => {
          if (scheme.id === selectedScheme.id) {
            return updatedScheme;
          }
          return scheme;
        });
        setSchemes(updatedSchemes);

        // Show success toast message
        toast.success('Payment Successful',
          `₹${selectedPayment.amount} paid for ${selectedScheme.schemeName} - Term ${selectedPayment.term}}`
        );
        window.dispatchEvent(new Event("wallet-updated"));


        // Refresh wallet balance
        loadWalletBalance();

      } else {
        // Payment failed
        const errorMsg = apiResponse?.error || apiResponse?.message || 'Payment processing failed';
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment Failed', error.message || 'Please try again.');
    } finally {
      setProcessingPayment(false);
      setSelectedPayment(null);
    }
  };

  const calculateProgress = (scheme) => {
    if (!scheme.totalTerms || !scheme.paidTerms) return 0;
    return Math.round((scheme.paidTerms / scheme.totalTerms) * 100);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get current schemes based on active tab
  const getCurrentSchemes = () => {
    return activeTab === 'current' ? currentSchemes : completedSchemes;
  };

  // Show loading state
  if (loading) {
    return <LoadingToast show={loading} />;
  }

  // Show error state
  if (error) {
    return (
      <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="mb-3">
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/home')}
            className="d-flex align-items-center"
          >
            <FaChevronLeft className="me-2" />
            Back to Home
          </Button>
        </div>
        <Card className="border-0 shadow">
          <Card.Body className="text-center py-5">
            <FaExclamationCircle className="text-danger mb-3" size={50} />
            <h5 className="text-danger mb-3">Error Loading Schemes</h5>
            <p className="text-muted mb-4">{error}</p>
            <Button variant="primary" onClick={loadSchemes}>
              Try Again
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="mb-3">
        <Button
          variant="outline-secondary"
          onClick={() => navigate('/home')}
          className="d-flex align-items-center"
        >
          <FaChevronLeft className="me-2" />
          Back to Home
        </Button>
      </div>

      <Row className="mb-4">
        <Col>
          <h1 className="mb-2 d-flex align-items-center fw-bold" style={{ color: '#c42b2b' }}>
            My Schemes
          </h1>
        </Col>
      </Row>

      {/* Main Content with Tabs */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="px-3 pt-3">
              <Nav.Item>
                <Nav.Link eventKey="current" className="fw-bold">
                  <FaSpinner className="me-2" />
                  Current ({currentSchemes.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="completed" className="fw-bold">
                  <FaHistory className="me-2" />
                  Completed ({completedSchemes.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="p-3">
              {getCurrentSchemes().length === 0 ? (
                <div className="text-center py-5">
                  <FaChartLine className="fs-1 text-muted mb-3" style={{ fontSize: '4rem' }} />
                  <h4 className="text-muted mb-3">
                    {activeTab === 'current'
                      ? 'No Current Schemes Found'
                      : 'No Completed Schemes Found'}
                  </h4>
                  <p className="text-muted mb-4">
                    {activeTab === 'current'
                      ? "You don't have any current schemes. Join a new scheme to get started!"
                      : "You don't have any completed schemes yet."
                    }
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <Button
                      variant="warning"
                      size="lg"
                      onClick={() => navigate('/schemes')}
                      className="d-flex align-items-center px-4 py-2"
                    >
                      <FaChartLine className="me-2" />
                      Browse & Join Schemes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">S.No</th>
                        <th>Scheme Details</th>
                        <th>Progress</th>
                        <th>Amount</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentSchemes().map((scheme, index) => (
                        <tr key={scheme.id || index}>
                          <td className="text-center text-muted fw-bold">{index + 1}</td>
                          <td>
                            <div className="fw-bold mb-1">{scheme.schemeName || scheme.title}</div>
                            <small className="text-muted">
                              Joined: {formatDate(scheme.enrollmentDate)}
                            </small>
                          </td>
                          <td>
                            <small className="text-black d-block fw-bold">
                              {scheme.paidTerms || 0}/{scheme.totalTerms || '?'} Terms Paid
                            </small>
                          </td>
                          <td>
                            <small className="text-black fw-bold d-block">
                              Per term: {formatCurrency(scheme.installmentAmount)}
                            </small>
                            <small className="text-muted">
                              Total: {formatCurrency(scheme.totalInvestment)}
                            </small>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleViewDetails(scheme)}
                              className="d-flex align-items-center"
                            >
                              <FaEye className="me-1" />
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Scheme Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl" centered>
        {selectedScheme && (
          <>
            <Modal.Header closeButton className="bg-light">
              <Modal.Title className="d-flex align-items-center">
                <FaFileInvoice className="me-2 text-warning" />
                Scheme Overview - {selectedScheme.schemeName || selectedScheme.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <small className="text-muted d-block">Scheme Title</small>
                            <strong className="text-warning">{selectedScheme.schemeName || selectedScheme.title}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <small className="text-muted d-block">Amount per Term</small>
                            <strong className="text-warning">{formatCurrency(selectedScheme.installmentAmount)}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <small className="text-muted d-block">Number of Terms</small>
                            <strong className="text-warning">{selectedScheme.totalTerms || 0}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <small className="text-muted d-block">Total Investment</small>
                            <strong className="text-warning">{formatCurrency(selectedScheme.totalInvestment || 0)}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <small className="text-muted d-block">Amount Paid</small>
                            <strong className="text-success">{formatCurrency(selectedScheme.amountPaid || 0)}</strong>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <small className="text-muted d-block">Maturity Amount</small>
                            <strong className="text-warning">{formatCurrency(selectedScheme.maturityAmount)}</strong>
                          </div>
                        </Col>
                      </Row>

                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Payment Terms Table with Load More */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0 fw-bold">Payment Schedule</h6>
                </Card.Header>
                <Card.Body className="p-2">
                  {selectedSchemePayments.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No payment terms available</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Term No.</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Status</th>
                              <th className="text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedPayments.map((payment, index) => (
                              <tr key={index} className={payment.paid ? "table-success" : ""}>
                                <td className="fw-bold">Term {payment.term}</td>
                                <td>{formatCurrency(payment.amount)}</td>
                                <td>{payment.date}</td>
                                <td>
                                  {payment.paid ? (
                                    <Badge bg="success" className="px-3 py-2">
                                      <FaCheckCircle className="me-1" />
                                      Paid {payment.paidDate ? `on ${payment.paidDate}` : ''}
                                    </Badge>
                                  ) : (
                                    <Badge bg="warning" className="px-3 py-2">
                                      <FaClock className="me-1" />
                                      Pending
                                    </Badge>
                                  )}
                                </td>
                                <td className="text-center">
                                  {!payment.paid && payment.term === (selectedScheme.paidTerms || 0) + 1 ? (
                                    <Button
                                      variant="warning"
                                      size="sm"
                                      onClick={() => showPaymentConfirmation(payment)}
                                      disabled={processingPayment || mainWalletBalance < payment.amount}
                                      className="px-4"
                                    >
                                      {processingPayment ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <FaWallet className="me-1" />
                                          Pay Now
                                        </>
                                      )}
                                    </Button>
                                  ) : payment.paid ? (
                                    <Button variant="success" size="sm" disabled className="px-4">
                                      <FaCheckCircle className="me-1" />
                                      Paid
                                    </Button>
                                  ) : (
                                    <Button variant="secondary" size="sm" disabled className="px-4">
                                      <FaBan className="me-1" />
                                      Pay now
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      {/* Load More Button */}
                      {visibleTermsCount < selectedSchemePayments.length && (
                        <div className="mt-3 d-flex justify-content-end">
                          <Button
                            variant="outline-warning"
                            onClick={handleLoadMore}
                            className="d-flex align-items-center px-3 py-2"
                          >
                            Load More Terms
                          </Button>
                        </div>
                      )}

                      {/* Showing Info */}
                      <div className="mt-2 text-end text-muted small">
                        Showing {displayedPayments.length} of {selectedSchemePayments.length} terms
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal show={showPaymentConfirmModal} onHide={() => setShowPaymentConfirmModal(false)} centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title className="d-flex align-items-center">
            <FaQuestionCircle className="me-2" />
            Confirm Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <>
              <p>Are you sure you want to make this payment?</p>
              <div className="border rounded p-3 bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span>Scheme:</span>
                  <strong>{selectedScheme?.schemeName}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Term:</span>
                  <strong>Term {selectedPayment.term}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Amount:</span>
                  <strong className="text-warning">{formatCurrency(selectedPayment.amount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Due Date:</span>
                  <strong>{selectedPayment.date}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span>Wallet Balance:</span>
                  <strong className={mainWalletBalance >= selectedPayment.amount ? 'text-success' : 'text-danger'}>
                    {formatCurrency(mainWalletBalance)}
                  </strong>
                </div>
              </div>
              {mainWalletBalance < selectedPayment.amount && (
                <Alert variant="danger" className="mt-3">
                  <FaExclamationTriangle className="me-2" />
                  Insufficient wallet balance! Please add funds to your wallet.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={processPayment}
            disabled={processingPayment || (selectedPayment && mainWalletBalance < selectedPayment.amount)}
          >
            {processingPayment ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <FaWallet className="me-1" />
                Confirm & Pay
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MySchemes;