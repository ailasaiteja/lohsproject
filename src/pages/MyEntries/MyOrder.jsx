import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Alert, Form, InputGroup, FormControl } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaShoppingCart, FaBox, FaEye, FaDownload,
  FaTimes, FaStar, FaClock, FaCheckCircle, FaTimesCircle,
  FaMapMarkerAlt, FaPhone, FaUserCircle, FaCreditCard,
  FaFileInvoice, FaInfoCircle, FaSearch, FaSort, FaChevronLeft
} from 'react-icons/fa';
import { fetchUserOrders, fetchOrderDetails } from './myorderApi';
import LoadingToast from '../loading/LoadingToast';

const MyOrder = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const navigate = useNavigate();

  // Cancel reasons
  const cancelReasons = [
    { value: 'change_of_plan', label: 'Change of plans/Don\'t need the product anymore' },
    { value: 'found_better_price', label: 'Found a better price elsewhere' },
    { value: 'wrong_product', label: 'Ordered wrong product/size/color' },
    { value: 'delay_delivery', label: 'Item taking too long to deliver' },
    { value: 'other', label: 'Other reason' }
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        return (
          order.order_no?.toLowerCase().includes(query) ||
          order.customer_name?.toLowerCase().includes(query) ||
          order.customer_phone_number?.includes(query) ||
          order.items?.some(item => item.product_name?.toLowerCase().includes(query))
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.ordered_at || a.created_at);
      const dateB = new Date(b.ordered_at || b.created_at);

      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;
      if (sortBy === 'price-high') return parseFloat(b.total_amount) - parseFloat(a.total_amount);
      if (sortBy === 'price-low') return parseFloat(a.total_amount) - parseFloat(b.total_amount);
      return dateB - dateA;
    });

    setFilteredOrders(filtered);
  }, [orders, filterStatus, searchQuery, sortBy]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchUserOrders();

      // Handle the response structure based on your API
      if (response && response.success && response.orders) {
        setOrders(response.orders);
      } else if (response && Array.isArray(response)) {
        setOrders(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        console.log('Unexpected response structure:', response);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again later.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (order) => {
    setDetailsLoading(true);
    try {
      // Extract order ID from the order object
      const orderId = order.id || order.order_id;
      const response = await fetchOrderDetails(orderId);

      if (response && response.success && response.order) {
        setSelectedOrderDetails(response.order);
      } else {
        // If API fails, use the order data from the list
        setSelectedOrderDetails(order);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      // Fallback to the order data from the list
      setSelectedOrderDetails(order);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'secondary';
    const statusLower = status.toLowerCase();

    if (statusLower === 'delivered') return 'success';
    if (statusLower === 'assigned') return 'info';
    if (statusLower === 'order placed') return 'secondary';
    if (statusLower === 'cancelled') return 'danger';
    return 'secondary';
  };

  const getStatusIcon = (status) => {
    if (!status) return <FaClock className="text-primary" />;
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return <FaCheckCircle className="text-success" />;
    if (statusLower === 'order placed') return <FaClock className="text-white" />;
    if (statusLower === 'cancelled') return <FaTimesCircle className="text-danger" />;
    if (statusLower === 'assigned') return <FaCheckCircle className="text-info" />;
    return <FaClock className="text-secondary" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount) || 0);
  };

  const calculateStats = () => {
    const stats = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      pendingOrders: orders.filter(o => o.status?.toLowerCase() === 'order placed').length,
      assignedOrders: orders.filter(o => o.status?.toLowerCase() === 'assigned').length,
      deliveredOrders: orders.filter(o => o.status?.toLowerCase() === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status?.toLowerCase() === 'cancelled').length
    };
    return stats;
  };

  const handleDownloadInvoice = (order) => {
    const invoiceContent = `
      FLH PRODUCTS - ORDER INVOICE
      =============================
      
      Order ID: ${order.order_no}
      Customer: ${order.customer_name}
      Phone: ${order.customer_phone_number}
      Total Amount: ${formatCurrency(order.total_amount)}
      Status: ${order.status}
      Order Date: ${formatDateTime(order.ordered_at)}
      Delivery Address: ${order.delivery_address}
      
      Products:
      ${order.items?.map(item => `- ${item.product_name} x${item.quantity} = ${formatCurrency(item.total_price)}`).join('\n')}
      
      Payment Details:
      Wallet Amount: ${formatCurrency(order.userwallet_transaction_amount)}
      Cashback Amount: ${formatCurrency(order.cashbackwallet_transaction_amount)}
      
      =============================
      FLH Products
      Thank You for Your Order!
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.order_no}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setCustomReason('');
    setShowCancelModal(true);
  };

  const confirmCancelOrder = () => {
    if (!cancelReason) {
      alert('Please select a reason for cancellation');
      return;
    }

    if (cancelReason === 'other' && !customReason.trim()) {
      alert('Please provide details for cancellation');
      return;
    }

    alert(`✅ Order #${selectedOrder.order_no} cancelled successfully!\nRefund of ${formatCurrency(selectedOrder.total_amount)} will be processed.`);

    setShowCancelModal(false);
    setSelectedOrder(null);
    setCancelReason('');
    setCustomReason('');

    // Refresh orders
    loadOrders();
  };

  const handleViewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    await loadOrderDetails(order);
  };

  const submitRating = () => {
    if (!selectedOrder || rating === 0) return;

    alert('Thank you for your rating! Your feedback is valuable to us.');

    setShowRatingModal(false);
    setRating(0);
    setRatingComment('');
    setHoverRating(0);
    setSelectedOrder(null);
  };

  const stats = calculateStats();

  const statusOptions = [
    { value: 'all', label: 'All Orders', count: stats.totalOrders, color: 'primary' },
    { value: 'Order Placed', label: 'Pending', count: stats.pendingOrders, color: 'warning' },
    { value: 'Assigned', label: 'Assigned', count: stats.assignedOrders, color: 'info' },
    { value: 'Delivered', label: 'Delivered', count: stats.deliveredOrders, color: 'success' },
    { value: 'Cancelled', label: 'Cancelled', count: stats.cancelledOrders, color: 'danger' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' }
  ];

  if (loading) {
    return <LoadingToast show={loading} />;
  }

  // Use selectedOrderDetails if available, otherwise use selectedOrder
  const displayOrder = selectedOrderDetails || selectedOrder;

  return (
    <Container fluid className="py-4 bg-light" style={{ minHeight: '100vh' }}>
      {/* Back to Home Button */}
      <div className="mb-3">
        <Button variant="outline-secondary" onClick={() => navigate('/home')}>
          <FaChevronLeft className="me-2" />
          Back to Home
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Orders</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadOrders}>Try Again</Button>
        </Alert>
      )}

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2 fw-bold" style={{ color: '#c42b2b' }}>My Orders</h1>
          <p className="text-muted">Track and manage your orders</p>
        </Col>
      </Row>

      {/* Combined Filter and Search Bar */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-white"><FaSearch /></InputGroup.Text>
                <FormControl
                  placeholder="Search by order ID, customer name, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text className="bg-white"><FaSort /></InputGroup.Text>
                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Status Filter Cards */}
      <Row className="mb-4">
        {statusOptions.map((status) => (
          <Col key={status.value} xs={6} md={3} className="mb-4">
            <Card
              className={`border-0 shadow-sm cursor-pointer ${filterStatus === status.value ? `border-${status.color} border-2` : ''}`}
              onClick={() => setFilterStatus(status.value)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="text-center py-3">
                <div className={`text-${status.color} fs-4 fw-bold`}>{status.count}</div>
                <div className="text-muted small">{status.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Orders Display */}
      <Row className="g-4">
        {filteredOrders.length === 0 ? (
          <Col xs={12}>
            <Card className="text-center py-5 shadow-sm">
              <Card.Body>
                <FaShoppingCart className="fs-1 text-muted mb-3" />
                <h4 className="text-muted mb-3">No Orders Found</h4>
                <p className="text-muted mb-4">
                  {filterStatus === 'all' && searchQuery === ''
                    ? "You haven't placed any orders yet. Start shopping now!"
                    : `No orders found matching your criteria.`
                  }
                </p>
                <Button variant="primary" onClick={() => navigate('/products')}>
                  <FaShoppingCart className="me-2" />
                  Browse Products
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          filteredOrders.map((order) => (
            <Col key={order.id} xs={12} md={6} lg={4}>
              <Card
                className="h-100 shadow-sm border-0 cursor-pointer hover-shadow"
                onClick={() => handleViewOrderDetails(order)}
                style={{ cursor: 'pointer' }}
              >
                {/* Order Status Header */}
                <div className={`bg-${getStatusColor(order.status)} text-white rounded-top py-2 px-3`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {getStatusIcon(order.status)}
                      <span className="ms-2 fw-bold">{order.status || 'Pending'}</span>
                    </div>
                    <small>{formatDate(order.ordered_at)}</small>
                  </div>
                </div>

                <Card.Body>
                  {/* Order ID */}
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <small className="text-muted">Order ID</small>
                    <div className="fw-bold">{order.order_no}</div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <small className="text-muted">Customer Phone</small>
                    <div className="d-flex justify-content-between">
                      {/* <span>{order.customer_name}</span> */}
                      <small className="text-muted">{order.customer_phone_number}</small>
                    </div>
                  </div>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <small className="text-muted bg-color">Status </small>
                    <div className="d-flex justify-content-between">
                      <Badge>{order.status}</Badge>
                      {/* <small className="text-muted">{formatDate(order.ordered_at)}</small> */}
                    </div>
                  </div>

                  {/* Items Summary */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-3">
                      <small className="text-muted">Products</small>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="d-flex justify-content-between small mt-1">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span className="fw-bold">{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Total Amount</span>
                      <h5 className="text-danger mb-0">{formatCurrency(order.total_amount)}</h5>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Order Details Modal */}
      {showOrderDetails && displayOrder && (
        <Modal
          show={showOrderDetails}
          onHide={() => {
            setShowOrderDetails(false);
            setSelectedOrderDetails(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              Order Details - {displayOrder.order_no}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {detailsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading order details...</p>
              </div>
            ) : (
              <Row>
                <Col md={7}>
                  {/* Order Information */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0"><FaBox className="me-2" />Order Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <small className="text-muted d-block">Customer Name</small>
                        <div className="d-flex align-items-center">
                          <FaUserCircle className="me-2 text-primary" />
                          <strong>{displayOrder.customer_name}</strong>
                        </div>
                      </div>
                      <div>
                        <small className="text-muted d-block">Phone Number</small>
                        <div className="d-flex align-items-center">
                          <FaPhone className="me-2 text-success" />
                          <strong>{displayOrder.customer_phone_number}</strong>
                        </div>
                      </div>
                      <div>
                        <div className="mb-3">
                          <small className="text-muted d-block">Order Date</small>
                          <strong>{formatDateTime(displayOrder.ordered_at)}</strong>
                        </div>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted d-block">Order Status</small>
                        <Badge bg={getStatusColor(displayOrder.status)} className="px-3 py-2">
                          {getStatusIcon(displayOrder.status)}
                          <span className="ms-2">{displayOrder.status}</span>
                        </Badge>
                      </div>


                    </Card.Body>
                  </Card>

                  {/* Products */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0"><FaShoppingCart className="me-2" />Products Ordered</h6>
                    </Card.Header>
                    <Card.Body>
                      {displayOrder.items?.map((item, idx) => (
                        <div key={idx} className={`${idx !== displayOrder.items.length - 1 ? 'mb-3 pb-3 border-bottom' : ''}` }>
                          {/* Product Name - Full width */}
                          <small className="text-muted d-block ">Product Name</small>
                          <strong className="d-block mb-2">{item.product_name}</strong>

                          

                          {/* Vendor - Same row */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Vendor</small>
                            <span>{item.vendor_name}</span>
                          </div>

                          {/* Status - Same row */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Status</small>
                            <Badge bg={getStatusColor(item.status)} pill>{item.status}</Badge>
                          </div>

                          {/* Price - Same row */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Price</small>
                            <span>{formatCurrency(item.price)}</span>
                          </div>

                          {/* Quantity - Same row */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Quantity</small>
                            <span>{item.quantity}</span>
                          </div>

                          {/* Total Price - Same row with highlight */}
                          <div className="d-flex justify-content-between align-items-center pt-2 mt-1 border-top">
                            <strong className="text-muted">Total</strong>
                            <strong className="text-danger">{formatCurrency(item.total_price)}</strong>
                          </div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={5}>
                  {/* Delivery Address */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0"><FaMapMarkerAlt className="me-2" />Delivery Address</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-0">{displayOrder.delivery_address}</p>
                    </Card.Body>
                  </Card>

                  {/* Payment Details */}
                  <Card className="mb-3 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0"><FaCreditCard className="me-2" />Payment Details</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Amount:</span>
                        <strong className="text-danger">{formatCurrency(displayOrder.total_amount)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span> User Wallet :</span>
                        <span>{formatCurrency(displayOrder.userwallet_transaction_amount)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Cashback Wallet:</span>
                        <span className="text-success">{formatCurrency(displayOrder.cashbackwallet_transaction_amount)}</span>
                      </div>
                      {displayOrder.schemwallet_transaction_amount && (
                        <div className="d-flex justify-content-between mt-2">
                          <span>Scheme Wallet:</span>
                          <span>{formatCurrency(displayOrder.schemwallet_transaction_amount)}</span>
                        </div>
                      )}
                    </Card.Body>
                  </Card>



                  {/* Actions */}
                  <Card className="shadow-sm">
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <Button variant="secondary" onClick={() => handleDownloadInvoice(displayOrder)}>
                          <FaFileInvoice className="me-2" />
                          Download Invoice
                        </Button>
                        {/* {displayOrder.status?.toLowerCase() === 'order placed' && (
                          <Button variant="danger" onClick={() => {
                            setShowOrderDetails(false);
                            handleCancelOrder(displayOrder);
                          }}>
                            <FaTimesCircle className="me-2" />
                            Cancel Order
                          </Button>
                        )} */}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowOrderDetails(false);
              setSelectedOrderDetails(null);
            }}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Cancel Order Modal */}
      {/* <Modal
        show={showCancelModal}
        onHide={() => {
          setShowCancelModal(false);
          setCancelReason('');
          setCustomReason('');
        }}
        size="lg"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title><FaTimesCircle className="me-2" />Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Alert variant="light" className="mb-4">
                <div>
                  <h6 className="mb-1">Order #{selectedOrder.order_no}</h6>
                  <div className="text-muted small mb-1">{selectedOrder.customer_name}</div>
                  <div className="fw-bold text-danger">Amount: {formatCurrency(selectedOrder.total_amount)}</div>
                </div>
              </Alert>

              <h6 className="mb-3">Why do you want to cancel this order?</h6>

              <Form>
                {cancelReasons.map((reason) => (
                  <Form.Check
                    key={reason.value}
                    type="radio"
                    label={reason.label}
                    value={reason.value}
                    checked={cancelReason === reason.value}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="mb-2 p-2 border rounded"
                  />
                ))}

                {cancelReason === 'other' && (
                  <Form.Group className="mt-3">
                    <Form.Label>Please specify:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Please specify your reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </Form.Group>
                )}
              </Form>

              <Alert variant="info" className="mt-3">
                <FaInfoCircle className="me-2" />
                Refund will be processed to your wallet within 3-7 working days.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Go Back</Button>
          <Button
            variant="danger"
            onClick={confirmCancelOrder}
            disabled={!cancelReason || (cancelReason === 'other' && !customReason.trim())}
          >
            Cancel Order
          </Button>
        </Modal.Footer>
      </Modal> */}

      {/* Rating Modal */}
      <Modal
        show={showRatingModal}
        onHide={() => {
          setShowRatingModal(false);
          setRating(0);
          setRatingComment('');
        }}
        centered
      >
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title><FaStar className="me-2" />Rate Your Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <h5>{selectedOrder?.items?.[0]?.product_name}</h5>

          <div className="my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                size={40}
                className="mx-2 cursor-pointer"
                style={{ cursor: 'pointer' }}
                color={star <= (hoverRating || rating) ? "#ffc107" : "#e4e5e9"}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>

          <Form.Group>
            <Form.Label>Your Review (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Share your experience with this product..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingModal(false)}>Maybe Later</Button>
          <Button variant="warning" onClick={submitRating} disabled={rating === 0}>
            Submit Rating
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add some CSS for hover effects */}
      <style jsx="true">{`
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease;
        }
      `}</style>
    </Container>
  );
};

export default MyOrder;