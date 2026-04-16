import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDeliveredOrders, fetchOrderDetails } from "./deliveredordersAPI";
import LoadingToast from "../loading/LoadingToast";

/* ===== STATUS BADGE ===== */
const StatusBadge = ({ text }) => (
  <span className="badge bg-success px-3 py-2 rounded-pill">
    {text}
  </span>
);

const DeliveredOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch delivered orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchDeliveredOrders();
      
      console.log("Delivered orders response:", response);
      
      // Extract orders array from the response
      // Response structure: { success: true, orders: [...] }
      const ordersData = response?.orders || [];
      
      setOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error("Error fetching delivered orders:", error);
      setError("Failed to load delivered orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch detailed order information including items
  const handleViewDetails = async (order) => {
    setLoadingDetails(true);
    setSelectedOrder(order);
    setOrderItems([]);
    setOrderDetails(null);
    
    try {
      // Ensure we have a valid order ID
      if (!order || !order.id) {
        throw new Error("Invalid order object");
      }

      const orderId = Number(order.id);
      console.log("Selected order:", order);
      console.log("Order ID being sent:", orderId);
      
      // Fetch order details with items
      const response = await fetchOrderDetails(orderId);
      console.log("Order details response:", response);
      
      // Extract the order and items from the response
      // Response structure: { success: true, order: { ... } }
      if (response?.success && response?.order) {
        const detailedOrder = response.order;
        setOrderDetails(detailedOrder);
        
        // Extract items from the order
        const items = detailedOrder.items || [];
        console.log("Extracted items:", items);
        setOrderItems(items);
      } else {
        throw new Error("Invalid response structure");
      }
      
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert("Could not load order details. Please try again later.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // Get product name from order items (for list view)
  const getProductName = (order) => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      return firstItem.product_name || firstItem.name || "Product";
    }
    return "Product";
  };

  if (loading) {
    return <LoadingToast show={loading} />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm me-3"
            onClick={() => navigate("/my-orders")}
          >
            ← Back to My Orders
          </button>
        </div>
        <h3 className="text-warning m-0">Delivered Orders</h3>
        <br />
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "400px" }}>
          <div className="text-danger mb-3">{error}</div>
          <button className="btn btn-primary" onClick={fetchOrders}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ================= LIST PAGE ================= */
  if (!selectedOrder) {
    return (
      <div className="container py-4">
        {/* HEADER WITH BACK BUTTON ON LEFT */}
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm me-3"
            onClick={() => navigate("/my-orders")}
          >
            ← Back to My Orders
          </button>
        </div>
        <h3 className="text-warning m-0">Delivered Orders</h3>
        <br />

        {orders.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No delivered orders found</p>
          </div>
        ) : (
          <div className="row">
            {orders.map((order) => (
              <div key={order.id} className="col-md-6 col-lg-4 mb-4 d-flex">
                <div className="card shadow rounded-4 w-100 d-flex flex-column">
                  <div className="card-body d-flex flex-column">
                    <div className="flex-grow-1">
                      {/* HEADER */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-success mb-0">
                          {order.order_no}
                        </h6>
                        <StatusBadge text="DELIVERED" />
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Customer</small>
                        <div>{order.customer_phone_number}</div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Amount</small>
                        <div>₹{formatCurrency(order.total_amount)}</div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Delivered On</small>
                        <div>{formatDate(order.delivered_at)}</div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Product</small>
                        <div>{getProductName(order)}</div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Delivery Address</small>
                        <div className="text-wrap">
                          {order.delivery_address}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-success w-100 rounded-pill mt-3"
                      onClick={() => handleViewDetails(order)}
                      disabled={loadingDetails}
                    >
                      {loadingDetails ? "Loading..." : "View Details"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ================= DETAILS PAGE ================= */
  if (loadingDetails) {
    return <LoadingToast show={loadingDetails} />;
  }

  // Use orderDetails if available, otherwise fallback to selectedOrder
  const displayOrder = orderDetails || selectedOrder;

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
          onClick={() => {
            setSelectedOrder(null);
            setOrderDetails(null);
            setOrderItems([]);
          }}
        >
          ← Back
        </button>
        <h4 className="ms-3 mb-0">Order Details</h4>
      </div>

      {/* ORDER SUMMARY */}
      <div className="card shadow rounded-4 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-success mb-0">
              Order #{displayOrder.order_no}
            </h5>
            <StatusBadge text="DELIVERED" />
          </div>

          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Order Date:</strong><br />
                {formatDate(displayOrder.ordered_at)}
              </p>
              <p className="mb-2">
                <strong>Delivered On:</strong><br />
                {formatDate(displayOrder.delivered_at)}
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Total Amount:</strong><br />
                <span className="text-danger fw-bold">₹{formatCurrency(displayOrder.total_amount)}</span>
              </p>
              <p className="mb-2">
                <strong>Order ID:</strong><br />
                #{displayOrder.id}
              </p>
            </div>
          </div>

          {displayOrder.assigned_at && (
            <p className="mb-0 mt-2 text-muted">
              <small>Assigned on: {formatDate(displayOrder.assigned_at)}</small>
            </p>
          )}
        </div>
      </div>

      {/* CUSTOMER INFO */}
      <div className="card shadow rounded-4 mb-4">
        <div className="card-body">
          <h5 className="text-warning mb-3">Customer Information</h5>
          <p><strong>Name:</strong> {displayOrder.customer_name}</p>
          <p><strong>Phone:</strong> {displayOrder.customer_phone_number}</p>
          <p><strong>Delivery Address:</strong><br />
            {displayOrder.delivery_address}
          </p>
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="card shadow rounded-4 mb-4">
        <div className="card-body">
          <h5 className="text-warning mb-3">Order Items</h5>
          
          {orderItems.length > 0 ? (
            orderItems.map((item) => (
              <div key={item.id} className="border-bottom pb-3 mb-3">
                {/* Item Header with Product Name and Status Badge */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">{item.product_name}</h6>
                  <StatusBadge text="DELIVERED" />
                </div>

                {/* Item Details */}
                <div className="row">
                  <div className="col-8">
                    <p className="text-muted mb-1">
                      <small>Category: {item.category}</small>
                    </p>
                    <p className="mb-1">
                      <small>Quantity: {item.quantity}</small>
                    </p>
                    {item.vendor_name && (
                      <p className="mb-0 text-muted">
                        <small>Vendor: {item.vendor_name}</small>
                      </p>
                    )}
                  </div>
                  <div className="col-4 text-end">
                    <p className="text-danger fw-bold mb-0">
                      ₹{formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                {/* Item Total */}
                <div className="row mt-2">
                  <div className="col-12">
                    <p className="mb-0 text-end fw-bold">
                      Total: ₹{formatCurrency(item.total_price || (item.price * item.quantity))}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="alert alert-info">
              <p className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                No items found for this order.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveredOrders;