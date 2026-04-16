import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaDownload, FaHistory, FaClock, FaCheckCircle,
    FaTimesCircle, FaHome, FaWallet, FaSpinner
} from 'react-icons/fa';
import {
    Container, Row, Col, Card, Table, Badge,
    Modal, Form, InputGroup, Alert, Button, Spinner
} from 'react-bootstrap';
import { getWithdrawalHistory } from './withdrawWallwtApi';

const WithdrawWalletPage = () => {
    const navigate = useNavigate();
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [withdrawals, setWithdrawals] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        loadWithdrawals();
        loadWalletBalance();
    }, []);

    const loadWalletBalance = () => {
        try {
            const savedWallets = localStorage.getItem('flh_wallets');
            if (savedWallets) {
                const wallets = JSON.parse(savedWallets);
                setWalletBalance(wallets.withdrawWallet || 0);
            }
        } catch (error) {
            console.error('Error loading wallet balance:', error);
        }
    };

    const loadWithdrawals = async () => {
        setLoading(true);
        try {
            const response = await getWithdrawalHistory();

            console.log('Raw API Response:', response);

            let withdrawalsList = [];

            // Since your API returns an array directly
            if (Array.isArray(response)) {
                withdrawalsList = response;
                console.log('Response is array, length:', withdrawalsList.length);
            }
            else if (response && Array.isArray(response.data)) {
                withdrawalsList = response.data;
                console.log('Response.data is array, length:', withdrawalsList.length);
            }
            else if (response && response.results && Array.isArray(response.results)) {
                withdrawalsList = response.results;
                console.log('Response.results is array, length:', withdrawalsList.length);
            }
            else {
                console.log('Unexpected response format:', typeof response, response);
                // If response is an object, try to find any array in it
                if (response && typeof response === 'object') {
                    for (let key in response) {
                        if (Array.isArray(response[key])) {
                            withdrawalsList = response[key];
                            console.log(`Found array in property "${key}":`, withdrawalsList);
                            break;
                        }
                    }
                }
            }

            console.log('Final withdrawals list:', withdrawalsList);
            setWithdrawals(withdrawalsList);

        } catch (error) {
            console.error('Error loading withdrawals:', error);
            setAlertMessage({
                type: 'danger',
                text: 'Failed to load withdrawal history. Please try again.'
            });
            setWithdrawals([]);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawRequest = () => {
        if (!withdrawAmount || withdrawAmount <= 0) {
            setAlertMessage({ type: 'danger', text: 'Please enter a valid amount' });
            return;
        }

        const amountNum = parseFloat(withdrawAmount);

        if (amountNum < 100) {
            setAlertMessage({ type: 'danger', text: 'Minimum withdrawal amount is ₹100' });
            return;
        }

        if (walletBalance < amountNum) {
            setAlertMessage({ type: 'danger', text: `Insufficient balance. Available: ₹${walletBalance}` });
            return;
        }

        setAlertMessage({
            type: 'success',
            text: `Withdrawal request of ₹${withdrawAmount} submitted successfully!`
        });
        setShowWithdraw(false);
        setWithdrawAmount('');
        loadWithdrawals();
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'pending': { bg: 'warning', icon: <FaClock className="me-1" />, text: 'PENDING' },
            'processing': { bg: 'info', icon: <FaSpinner className="me-1" />, text: 'PROCESSING' },
            'approved': { bg: 'success', icon: <FaCheckCircle className="me-1" />, text: 'APPROVED' },
            // 'completed': { bg: 'success', icon: <FaCheckCircle className="me-1" />, text: 'COMPLETED' },
            'rejected': { bg: 'danger', icon: <FaTimesCircle className="me-1" />, text: 'REJECTED' },
            'failed': { bg: 'danger', icon: <FaTimesCircle className="me-1" />, text: 'FAILED' },
            'cancelled': { bg: 'secondary', icon: <FaTimesCircle className="me-1" />, text: 'CANCELLED' }
        };

        const config = statusColors[status?.toLowerCase()] || statusColors.pending;

        return (
            <Badge bg={config.bg} className="px-3 py-1">
                {config.icon}
                {config.text}
            </Badge>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-IN'),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const calculateStatistics = () => {
        const totalWithdrawn = withdrawals
            .filter(w => w.status === 'approved' || w.status === 'approved')
            .reduce((sum, w) => sum + parseFloat(w.requested_amount || 0), 0);

        const pendingAmount = withdrawals
            .filter(w => w.status === 'pending' || w.status === 'pending')
            .reduce((sum, w) => sum + parseFloat(w.requested_amount || 0), 0);

        const rejectedAmount = withdrawals
            .filter(w => w.status === 'rejected' || w.status === 'failed' || w.status === 'cancelled')
            .reduce((sum, w) => sum + parseFloat(w.requested_amount || 0), 0);

        return {
            totalWithdrawn,
            pendingAmount,
            approvedAmount: totalWithdrawn,
            rejectedAmount,
            totalRequests: withdrawals.length
        };
    };

    const statistics = calculateStatistics();

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading withdrawal history...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
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

            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
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
                                <FaDownload className="me-2 text-danger" />
                                Withdrawals
                            </h2>
                        </div>

                    </div>
                </Col>
            </Row>


            <Row className="g-3 mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                    <FaCheckCircle size={20} className="text-success" />
                                </div>
                                <div>
                                    <div className="text-muted small">Total Withdrawn</div>
                                    <div className="fs-5 fw-bold text-success">
                                        ₹{statistics.totalWithdrawn.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                    <FaClock size={20} className="text-warning" />
                                </div>
                                <div>
                                    <div className="text-muted small">Pending</div>
                                    <div className="fs-5 fw-bold text-warning">
                                        ₹{statistics.pendingAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                                    <FaClock size={20} className="text-warning" />
                                </div>
                                <div>
                                    <div className="text-muted small">Approved</div>
                                    <div className="fs-5 fw-bold text-success">
                                        ₹{statistics.approvedAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                                    <FaTimesCircle size={20} className="text-danger" />
                                </div>
                                <div>
                                    <div className="text-muted small">Rejected</div>
                                    <div className="fs-5 fw-bold text-danger">
                                        ₹{statistics.rejectedAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

               
            </Row>
            <Card className="border-0 shadow">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">
                            <FaHistory className="me-2" />
                            Withdrawal History
                        </h4>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={loadWithdrawals}
                        >
                            <FaHistory className="me-1" /> Refresh
                        </Button>
                    </div>

                    {withdrawals.length === 0 ? (
                        <div className="text-center py-5">
                            <FaHistory className="text-muted mb-3" size={48} />
                            <h5 className="text-muted">No withdrawal requests found</h5>
                            <p className="text-muted">Click the "Request Withdrawal" button to make your first withdrawal</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Requested At</th>
                                        <th>Wallet Type</th>

                                        <th>Requested Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map((withdrawal) => {
                                        const formattedDate = formatDate(withdrawal.requested_at || withdrawal.created_at);
                                        return (
                                            <tr key={withdrawal.id}>
                                                <td className="fw-bold">#{withdrawal.id}</td>
                                                <td>
                                                    <div>{formattedDate.date}</div>
                                                    <small className="text-muted">{formattedDate.time}</small>
                                                </td>
                                                <td>
                                                    <Badge bg="secondary" className="px-2 py-1">
                                                        {withdrawal.wallet_type?.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="fw-bold text-danger">
                                                    ₹{parseFloat(withdrawal.requested_amount || 0).toLocaleString()}
                                                </td>
                                                
                                                <td>
                                                    {getStatusBadge(withdrawal.status)}
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


        </Container>
    );
};

export default WithdrawWalletPage;