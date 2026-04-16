import React, { useState, useEffect } from 'react';
import { 
  FaBell, FaCheck, FaTrash, FaClock, 
  FaTimes, FaFilter, FaArrowLeft, FaEye,
  FaExclamationTriangle, FaCheckCircle, FaInfoCircle,
  FaCalendarAlt, FaEnvelope, FaShoppingBag, FaWallet,
  FaTicketAlt, FaGift, FaBox, FaUser, FaCog
} from 'react-icons/fa';
import { 
  Button, Container, Row, Col, Badge, 
  Dropdown, Alert, Card, Form, InputGroup,
  ListGroup, Modal, Tab, Tabs
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    try {
      const savedNotifications = localStorage.getItem('flh_notifications');
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAllAsRead = () => {
    if (notifications.length === 0) return;
    
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    localStorage.setItem('flh_notifications', JSON.stringify(updatedNotifications));
    
    // Update unread count in localStorage
    localStorage.setItem('flh_notifications_unread', '0');
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    localStorage.setItem('flh_notifications', JSON.stringify(updatedNotifications));
    
    // Update unread count in localStorage
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    localStorage.setItem('flh_notifications_unread', unreadCount.toString());
  };

  const markMultipleAsRead = () => {
    if (selectedNotifications.length === 0) return;
    
    const updatedNotifications = notifications.map(notification => 
      selectedNotifications.includes(notification.id) 
        ? { ...notification, read: true } 
        : notification
    );
    
    setNotifications(updatedNotifications);
    setSelectedNotifications([]);
    localStorage.setItem('flh_notifications', JSON.stringify(updatedNotifications));
    
    // Update unread count in localStorage
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    localStorage.setItem('flh_notifications_unread', unreadCount.toString());
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('flh_notifications');
    localStorage.setItem('flh_notifications_unread', '0');
    setShowClearModal(false);
  };

  const deleteNotification = (id) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('flh_notifications', JSON.stringify(updatedNotifications));
    
    // Update unread count
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    localStorage.setItem('flh_notifications_unread', unreadCount.toString());
    
    // Remove from selected notifications
    setSelectedNotifications(prev => prev.filter(notifId => notifId !== id));
  };

  const deleteSelectedNotifications = () => {
    if (selectedNotifications.length === 0) return;
    
    const updatedNotifications = notifications.filter(
      notification => !selectedNotifications.includes(notification.id)
    );
    
    setNotifications(updatedNotifications);
    setSelectedNotifications([]);
    localStorage.setItem('flh_notifications', JSON.stringify(updatedNotifications));
    
    // Update unread count
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    localStorage.setItem('flh_notifications_unread', unreadCount.toString());
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return notificationTime.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type, customIcon) => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case 'draw': return '🎯';
      case 'scheme': return '📌';
      case 'product': return '🛒';
      case 'wallet': return '💰';
      case 'order': return '📦';
      case 'stock': return '📊';
      case 'alert': return '⚠️';
      case 'customer': return '👤';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getNotificationIconComponent = (type, customIcon) => {
    if (customIcon) return <span style={{ fontSize: '20px' }}>{customIcon}</span>;
    
    switch (type) {
      case 'draw': return <FaTicketAlt className="text-warning" />;
      case 'scheme': return <FaGift className="text-primary" />;
      case 'product': return <FaBox className="text-success" />;
      case 'wallet': return <FaWallet className="text-info" />;
      case 'order': return <FaShoppingBag className="text-secondary" />;
      case 'stock': return <FaCog className="text-dark" />;
      case 'customer': return <FaUser className="text-purple" />;
      default: return <FaBell className="text-muted" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'draw':
        return <Badge bg="warning" className="ms-1">Lucky Draw</Badge>;
      case 'scheme':
        return <Badge bg="primary" className="ms-1">Scheme</Badge>;
      case 'product':
        return <Badge bg="success" className="ms-1">Product</Badge>;
      case 'wallet':
        return <Badge bg="info" className="ms-1">Wallet</Badge>;
      case 'order':
        return <Badge bg="secondary" className="ms-1">Order</Badge>;
      case 'stock':
        return <Badge bg="dark" className="ms-1">Stock</Badge>;
      default:
        return <Badge bg="light" text="dark" className="ms-1">General</Badge>;
    }
  };

  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'draw':
        navigate('/lucky-draw');
        break;
      case 'scheme':
        navigate('/schemes');
        break;
      case 'product':
        navigate('/products');
        break;
      case 'wallet':
        navigate('/wallet');
        break;
      case 'order':
      case 'stock':
        navigate('/vendor/dashboard');
        break;
      default:
        // Do nothing
        break;
    }
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
    } else {
      const allIds = filteredNotifications.map(notif => notif.id);
      setSelectedNotifications(allIds);
    }
    setSelectAll(!selectAll);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    if (filter === 'today') {
      const today = new Date().toDateString();
      const notifDate = new Date(notification.timestamp).toDateString();
      return today === notifDate;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount = notifications.filter(n => {
    const today = new Date().toDateString();
    const notifDate = new Date(n.timestamp).toDateString();
    return today === notifDate;
  }).length;

  // Add sample notifications for testing
  const addSampleNotifications = () => {
    const sampleNotifications = [
      {
        id: Date.now(),
        title: 'New Order Received',
        message: 'Order #ORD-2024-00125 has been placed successfully',
        type: 'order',
        timestamp: new Date().toISOString(),
        read: false,
        icon: '📦',
        color: '#FF6B6B',
      },
      {
        id: Date.now() + 1,
        title: 'Payment Successful',
        message: 'Your payment of ₹2,500 has been processed',
        type: 'wallet',
        timestamp: new Date().toISOString(),
        read: false,
        icon: '💰',
        color: '#4ECDC4',
      }
    ];
    
    const updatedNotifications = [...sampleNotifications, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem('flh_notifications', JSON.stringify(updatedNotifications));
    
    // Update unread count
    const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
    localStorage.setItem('flh_notifications_unread', newUnreadCount.toString());
  };

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(-1)}
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px' }}
          >
            <FaArrowLeft />
          </Button>
          <div>
            <h2 className="mb-0 d-flex align-items-center">
              <FaBell className="me-3 text-primary" />
              Notifications
            </h2>
            <small className="text-muted">
              {notifications.length} total • {unreadCount} unread
            </small>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          {/* Filter Dropdown */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" size="sm" className="d-flex align-items-center">
              <FaFilter className="me-2" />
              {filter === 'all' && 'All'}
              {filter === 'unread' && 'Unread'}
              {filter === 'read' && 'Read'}
              {filter === 'today' && 'Today'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setFilter('all')}>
                <FaEye className="me-2" /> All Notifications ({notifications.length})
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter('unread')}>
                <FaExclamationTriangle className="me-2 text-warning" /> Unread Only ({unreadCount})
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter('read')}>
                <FaCheckCircle className="me-2 text-success" /> Read Only ({notifications.length - unreadCount})
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter('today')}>
                <FaCalendarAlt className="me-2 text-info" /> Today ({todayCount})
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {notifications.length > 0 && (
            <>
              <Button
                variant="outline-success"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="d-flex align-items-center"
              >
                <FaCheck className="me-2" /> Mark all as read
              </Button>
              
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowClearModal(true)}
                className="d-flex align-items-center"
              >
                <FaTrash className="me-2" /> Clear all
              </Button>
            </>
          )}

          {/* Add Sample Notifications Button (for testing) */}
          
        </div>
      </div>

      {/* Stats Summary */}
      {notifications.length > 0 && (
        <Row className="mb-4 g-3">
          <Col md={4}>
            
          </Col>
          <Col md={4}>
            
          </Col>
          <Col md={4}>
            
          </Col>
        </Row>
      )}

      {/* Bulk Actions */}
      {filteredNotifications.length > 0 && selectedNotifications.length > 0 && (
        <div className="mb-3 p-3 bg-light rounded d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <Form.Check
              type="checkbox"
              label={`${selectedNotifications.length} selected`}
              checked={selectAll}
              onChange={toggleSelectAll}
              className="fw-medium"
            />
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={markMultipleAsRead}
              className="d-flex align-items-center"
            >
              <FaCheck className="me-1" /> Mark as read
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={deleteSelectedNotifications}
              className="d-flex align-items-center"
            >
              <FaTrash className="me-1" /> Delete selected
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-5 my-5">
          <FaBell className="text-muted mb-4" size={64} />
          <h4 className="text-muted mb-3">No notifications found</h4>
          <p className="text-muted mb-4">
            {filter === 'all' 
              ? "You don't have any notifications yet." 
              : filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : filter === 'today'
                  ? "No notifications for today."
                  : "No read notifications found."
            }
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="outline-primary"
              onClick={() => setFilter('all')}
            >
              View all notifications
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Go to Home
            </Button>
          </div>
        </div>
      ) : (
        <div className="list-group">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`list-group-item list-group-item-action border-0 py-3 mb-3 ${!notification.read ? 'border-start border-5 border-warning bg-light bg-opacity-10' : ''}`}
              style={{ 
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              <div className="d-flex align-items-start gap-3">
                {/* Checkbox for selection */}
                <div className="flex-shrink-0 pt-1">
                  <Form.Check
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelectNotification(notification.id)}
                    aria-label="Select notification"
                  />
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: notification.color + '20',
                      color: notification.color,
                      fontSize: '20px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}>
                    {getNotificationIconComponent(notification.type, notification.icon)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1 me-3">
                      <h5 className="mb-1 d-flex align-items-center flex-wrap">
                        <span className="me-2">{notification.title}</span>
                        {getTypeBadge(notification.type)}
                        {!notification.read && (
                          <Badge bg="danger" className="ms-2">NEW</Badge>
                        )}
                      </h5>
                      <p className="mb-2 text-muted" style={{ lineHeight: '1.5' }}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="d-flex flex-column align-items-end flex-shrink-0">
                      <small className="text-muted mb-2 d-flex align-items-center">
                        <FaClock className="me-1" />
                        {formatTime(notification.timestamp)}
                      </small>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    {!notification.read && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="d-flex align-items-center"
                      >
                        <FaCheck className="me-1" /> Mark as read
                      </Button>
                    )}
                    
                   {/* <Button }
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleNotificationAction(notification)}
                      className="d-flex align-items-center"
                    >
                      <FaEye className="me-1" /> View Details
                     </Button> */}
                    
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="d-flex align-items-center ms-auto"
                    >
                      <FaTrash className="me-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination/Info */}
      {filteredNotifications.length > 0 && (
        <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
          <div className="text-muted">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
          <div className="text-muted small">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <Alert variant="info" className="mt-4">
          <div className="d-flex">
            <FaInfoCircle className="me-3 mt-1" size={24} />
            <div>
              <h5>How notifications work</h5>
              <p className="mb-2">
                Notifications keep you updated on important activities in your account. Here's what you'll see:
              </p>
              <Row className="mt-3">
                <Col md={6}>
                  <ul className="mb-0">
                    <li><strong>Orders:</strong> New orders, cancellations, updates</li>
                    <li><strong>Wallet:</strong> Payments, top-ups, withdrawals</li>
                    <li><strong>Products:</strong> New arrivals, price changes</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <ul className="mb-0">
                    <li><strong>Schemes:</strong> ELP/ECB updates, bonuses</li>
                    <li><strong>Lucky Draws:</strong> New draws, winners</li>
                    <li><strong>System:</strong> Updates, maintenance</li>
                  </ul>
                </Col>
              </Row>
            </div>
          </div>
        </Alert>
      )}

      {/* Clear All Modal */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Clear All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <FaTrash className="text-danger mb-3" size={48} />
            <h5>Are you sure?</h5>
            <p className="text-muted">
              This will permanently delete all {notifications.length} notifications. 
              This action cannot be undone.
            </p>
            {unreadCount > 0 && (
              <Alert variant="warning" className="mt-3">
                <FaExclamationTriangle className="me-2" />
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}. 
                Consider marking them as read first.
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={clearAllNotifications}>
            <FaTrash className="me-2" /> Clear All Notifications
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Styles */}
      <style>
        {`
          .text-purple {
            color: #6f42c1;
          }
          .notification-item:hover {
            transform: translateY(-2px);
          }
          .badge-new {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </Container>
  );
};

export default NotificationsPage;