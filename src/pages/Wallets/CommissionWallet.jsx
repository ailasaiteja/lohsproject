import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaCoins, FaRupeeSign, FaExchangeAlt, FaHistory,
    FaArrowUp, FaArrowDown, FaWallet, FaChevronLeft,
    FaDownload, FaCheckCircle, FaSpinner
} from 'react-icons/fa';
import {
    Container, Row, Col, Card, Button, Table, Badge,
    Modal, Form, InputGroup, Alert, Spinner
} from 'react-bootstrap';
import { fetchCommissionWallet } from './commissionwalletAPI';
import LoadingToast from '../loading/LoadingToast';

const CommissionWalletPage = () => {
    const navigate = useNavigate();
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Commission data from API based on your response structure
    const [commissionData, setCommissionData] = useState({
        incentives: [],
        commission_wallet_balance: 0
    });

    // Fetch commission wallet data from API
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetchCommissionWallet();
            console.log("Commission wallet response:", response);

            // Your API response structure: { incentives: [...], commission_wallet_balance: 2000.0 }
            if (response) {
                setCommissionData({
                    incentives: response.incentives || [],
                    commission_wallet_balance: response.commission_wallet_balance || 0
                });
            }
            
            setError(null);
        } catch (error) {
            console.error("Error fetching commission wallet:", error);
            setError("Failed to load commission wallet data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate totals from API data
    const calculateTotals = () => {
        // Filter out withdrawn incentives (you may need to adjust based on your status)
        const pendingIncentives = commissionData.incentives.filter(i => 
            i.status === 'created' || i.status === 'pending' || i.paid_amount === 0
        );
        
        const withdrawnIncentives = commissionData.incentives.filter(i => 
            i.status === 'paid' || i.status === 'withdrawn' || i.paid_amount > 0
        );

        const pending = pendingIncentives.reduce((sum, i) => sum + (i.incentive_amount || 0), 0);
        const withdrawn = withdrawnIncentives.reduce((sum, i) => sum + (i.paid_amount || i.incentive_amount || 0), 0);

        return {
            pending: commissionData.commission_wallet_balance || pending,
            withdrawn,
            total: (commissionData.commission_wallet_balance || pending) + withdrawn
        };
    };

    const totals = calculateTotals();

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Format time function
    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Handle withdraw confirmation
    const handleWithdrawConfirm = () => {
        const amount = parseFloat(withdrawAmount);

        // Validation
        if (!amount || amount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        if (amount > totals.pending) {
            setAlertMessage({
                type: 'danger',
                text: `Cannot withdraw more than available amount (₹${totals.pending})`
            });
            return;
        }

        if (amount < 100) {
            setAlertMessage({
                type: 'danger',
                text: 'Minimum withdrawal amount is ₹100'
            });
            return;
        }

        // Show confirmation modal
        setShowWithdraw(false);
        setShowConfirmation(true);
    };

    // Process withdrawal after confirmation
    const processWithdrawal = async () => {
        const amount = parseFloat(withdrawAmount);

        try {
            setLoading(true);
            
            // Call withdraw API endpoint (you need to create this)
            // const response = await withdrawAmount(amount);
            
            // For now, simulate successful withdrawal
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update local state optimistically
            setCommissionData(prev => ({
                ...prev,
                commission_wallet_balance: prev.commission_wallet_balance - amount
            }));

            setAlertMessage({
                type: 'success',
                text: `Successfully withdrew ₹${amount} to your bank account! Funds will be transferred within 24-48 hours.`
            });

            setShowConfirmation(false);
            setWithdrawAmount('');
            
            // Refresh data from API
            fetchData();
            
        } catch (error) {
            console.error("Error processing withdrawal:", error);
            setAlertMessage({
                type: 'danger',
                text: 'Failed to process withdrawal. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'created':
            case 'pending':
                return 'warning';
            case 'paid':
            case 'withdrawn':
                return 'success';
            case 'cancelled':
            case 'rejected':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    // Get status display text
    const getStatusText = (incentive) => {
        if (incentive.paid_amount > 0) return 'Paid';
        if (incentive.status === 'created') return 'Pending';
        return incentive.status || 'Pending';
    };

    if (loading && !commissionData.incentives.length) {
        return <LoadingToast show={loading} />
    }

    if (error) {
        return (
            <Container fluid className="py-4">
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
                <Alert variant="danger" className="text-center py-5">
                    <Alert.Heading>Error Loading Data</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="danger" onClick={fetchData}>
                        Retry
                    </Button>
                </Alert>
            </Container>
        );
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

            {/* Page Header - Back button on left side */}
            <Row className="mb-4">
                <Col>
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
                    <div className="d-flex align-items-center">
                        <div>
                            <h2 className="fw-bold mb-1">
                                <FaCoins className="me-2 text-warning" />
                                Commission & Incentives
                            </h2>
                            <p className="text-muted mb-0">Your earnings from referrals, sales, and achievements</p>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Summary Cards */}
            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100 border-top border-3 border-success">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                                    <FaArrowUp className="text-success fs-4" />
                                </div>
                                <div>
                                    <div className="text-muted small">Total Incentives</div>
                                    <h2 className="fw-bold mb-0 text-success">
                                        <FaRupeeSign className="me-1" />
                                        {totals.total.toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Lifetime earnings from all incentives
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100 border-top border-3 border-warning">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                                    <FaWallet className="text-warning fs-4" />
                                </div>
                                <div>
                                    <div className="text-muted small">Available to Withdraw</div>
                                    <h2 className="fw-bold mb-0 text-warning">
                                        <FaRupeeSign className="me-1" />
                                        {commissionData.commission_wallet_balance.toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Amount ready for withdrawal
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100 border-top border-3 border-info">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                                    <FaArrowDown className="text-info fs-4" />
                                </div>
                                <div>
                                    <div className="text-muted small">Total Withdrawn</div>
                                    <h2 className="fw-bold mb-0 text-info">
                                        <FaRupeeSign className="me-1" />
                                        {totals.withdrawn.toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Amount withdrawn to bank account
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Withdraw Button */}
            <Row className="mb-4">
                <Col>
                    <Card className="border-0 shadow">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h5 className="fw-bold mb-1">Withdraw Your Earnings</h5>
                                    <p className="text-muted mb-0">
                                        Transfer incentives to your bank account. Minimum withdrawal: ₹100
                                    </p>
                                </div>
                                <Button
                                    variant="warning"
                                    size="lg"
                                    onClick={() => setShowWithdraw(true)}
                                    disabled={commissionData.commission_wallet_balance < 100 || loading}
                                    className="px-4 py-3 fw-bold d-flex align-items-center"
                                >
                                    {loading ? <FaSpinner className="spinner me-2" /> : <FaDownload className="me-2" />}
                                    Withdraw Now
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Incentives History */}
            <Card className="border-0 shadow">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">
                            <FaHistory className="me-2" />
                            Incentives History
                        </h4>
                    </div>

                    {commissionData.incentives.length === 0 ? (
                        <div className="text-center py-5">
                            <FaCoins className="text-muted mb-3" size={48} />
                            <h5 className="text-muted">No incentives found</h5>
                            <p className="text-muted">Start referring customers or making sales to earn incentives!</p>
                            <Button variant="outline-primary" onClick={() => navigate('/home')}>
                                Go to Home
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Description</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commissionData.incentives.map((incentive) => {
                                        // const isPaid = incentive.paid_amount > 0;
                                        const statusColor = getStatusColor(incentive.status);

                                        return (
                                            <tr key={incentive.id}>
                                                <td>
                                                    <div className="fw-medium">{formatDate(incentive.created_at)}</div>
                                                    <small className="text-muted">{formatTime(incentive.created_at)}</small>
                                                </td>
                                                <td>
                                                    <div className="fw-medium">{incentive.description}</div>
                                                    {incentive.payment_ref_no && (
                                                        <small className="text-muted">
                                                            Ref: {incentive.payment_ref_no}
                                                        </small>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg="info" className="px-3 py-2">
                                                        {incentive.name}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge
                                                        bg={statusColor}
                                                        className="px-3 py-2"
                                                        style={{ opacity: 1 }}
                                                    >
                                                        {getStatusText(incentive)}
                                                    </Badge>
                                                </td>
                                                <td className="fw-bold text-success">
                                                    + ₹{(incentive.incentive_amount || 0).toLocaleString()}
                                                    {incentive.paid_amount > 0 && (
                                                        <small className="text-muted d-block">
                                                            Paid: ₹{incentive.paid_amount}
                                                        </small>
                                                    )}
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

            {/* Withdraw Modal */}
            <Modal show={showWithdraw} onHide={() => setShowWithdraw(false)} centered>
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title>Withdraw Incentives</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Enter Withdrawal Amount (₹)</Form.Label>
                            <InputGroup size="lg">
                                <InputGroup.Text className="bg-warning text-white fw-bold">₹</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="Enter amount to withdraw"
                                    min="100"
                                    max={commissionData.commission_wallet_balance}
                                    className="py-3"
                                />
                            </InputGroup>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Available to withdraw:</span>
                                    <span className="fw-bold text-warning">
                                        ₹{commissionData.commission_wallet_balance.toLocaleString()}
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Minimum withdrawal:</span>
                                    <span className="fw-bold">₹100</span>
                                </div>
                            </div>
                        </Form.Group>

                        <Alert variant="info" className="small">
                            <strong>Note:</strong> Withdrawals are processed within 24-48 hours.
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowWithdraw(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="warning"
                        onClick={handleWithdrawConfirm}
                        disabled={!withdrawAmount || withdrawAmount < 100 || withdrawAmount > commissionData.commission_wallet_balance || loading}
                        className="px-4 py-2 fw-bold"
                    >
                        {loading ? <FaSpinner className="spinner me-2" /> : <FaExchangeAlt className="me-2" />}
                        Continue to Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <FaCheckCircle className="me-2" />
                        Confirm Withdrawal
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <div className="mb-4">
                        <div className="bg-success bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                            <FaCheckCircle className="text-success" size={48} />
                        </div>
                        <h4 className="fw-bold">Confirm Withdrawal Amount</h4>
                        <p className="text-muted">Please review your withdrawal details</p>
                    </div>

                    <Card className="border-0 bg-light mb-4">
                        <Card.Body>
                            <h1 className="fw-bold text-warning display-6 mb-3">
                                ₹{withdrawAmount ? parseFloat(withdrawAmount).toLocaleString() : '0'}
                            </h1>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Available Balance:</span>
                                <span className="fw-bold">₹{commissionData.commission_wallet_balance.toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Balance After Withdrawal:</span>
                                <span className="fw-bold text-success">
                                    ₹{(commissionData.commission_wallet_balance - parseFloat(withdrawAmount || 0)).toLocaleString()}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>

                    <Alert variant="warning" className="text-start">
                        <strong>Important:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Withdrawals are processed within 24-48 hours</li>
                            <li>Funds will be transferred to your registered bank account</li>
                            <li>This action cannot be undone</li>
                        </ul>
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowConfirmation(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={processWithdrawal}
                        disabled={loading}
                        className="px-4 py-2 fw-bold"
                    >
                        {loading ? <FaSpinner className="spinner me-2" /> : <FaCheckCircle className="me-2" />}
                        Confirm & Withdraw
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Quick Stats */}
            {commissionData.incentives.length > 0 && (
                <Row className="mt-4">
                    <Col>
                        <Card className="border-0 bg-light">
                            <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <div>
                                        <small className="text-muted">Last Incentive:</small>
                                        <div className="fw-bold">
                                            {formatDate(commissionData.incentives[0]?.created_at)} 
                                            (₹{commissionData.incentives[0]?.incentive_amount})
                                        </div>
                                    </div>
                                    <div>
                                        <small className="text-muted">Next Withdrawal Available:</small>
                                        <div className="fw-bold text-success">Anytime</div>
                                    </div>
                                    <div>
                                        <small className="text-muted">Withdrawal Fee:</small>
                                        <div className="fw-bold">0% (Above ₹1000)</div>
                                    </div>
                                    <div>
                                        <small className="text-muted">Processing Time:</small>
                                        <div className="fw-bold">24-48 Hours</div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default CommissionWalletPage;