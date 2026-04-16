import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssignedOrders, fetchOrderDetails } from "./assignedordersAPI";
import LoadingToast from "../loading/LoadingToast";

const AssignedOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch assigned orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchAssignedOrders();
      
      // Extract orders array from the response
      const ordersData = response?.orders || [];
      
      console.log("Fetched orders:", ordersData);
      setOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error("Error fetching assigned orders:", error);
      setError("Failed to load assigned orders. Please try again.");
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
      console.log("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      alert(`Could not load order items. Please try again later.`);
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

  const handleAccept = (id) => {
    alert(`Order ${id} accepted`);
    setSelectedOrder(null);
    setOrderDetails(null);
    setOrderItems([]);
    fetchOrders();
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert("Please enter rejection reason");
      return;
    }

    alert(`Order ${selectedOrder.order_no} rejected\nReason: ${rejectReason}`);
    setRejectReason("");
    setShowRejectModal(false);
    setSelectedOrder(null);
    setOrderDetails(null);
    setOrderItems([]);
    fetchOrders();
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
        <h3 className="text-warning m-0">Assigned Orders</h3>
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

  /* ================= ASSIGNED ORDERS LIST ================= */
  if (!selectedOrder) {
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
        <h3 className="text-warning m-0">Assigned Orders</h3>
        <br />

        {orders.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No assigned orders found</p>
          </div>
        ) : (
          <div className="row">
            {orders.map((order) => (
              <div key={order.id} className="col-md-6 col-lg-4 mb-4 d-flex">
                <div className="card shadow rounded-4 w-100 d-flex flex-column">
                  <div className="card-body d-flex flex-column">
                    <div>
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="text-warning">{order.order_no}</h6>
                        <span className="badge bg-warning px-3 py-2">
                          {order.status || "ASSIGNED"}
                        </span>
                      </div>

                      <p><b>Customer:</b> {order.customer_phone_number}</p>
                      <p><b>Amount:</b> ₹{formatCurrency(order.total_amount)}</p>
                      <p><b>Ordered on:</b> {formatDate(order.ordered_at)}</p>
                      <p><b>Address:</b> {order.delivery_address}</p>
                    </div>

                    <button
                      className="btn btn-danger w-100 rounded-pill mt-3"
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

  /* ================= ORDER DETAILS ================= */
  if (loadingDetails) {
    return <LoadingToast show={loadingDetails} />;
  }

  // Use orderDetails if available, otherwise fallback to selectedOrder
  const displayOrder = orderDetails || selectedOrder;

  return (
    <>
      <div className="container py-4">
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
              <h5 className="text-warning mb-0">
                Order #{displayOrder.order_no}
              </h5>
              <span className="badge bg-warning px-3 py-2">
                {displayOrder.status || "ASSIGNED"}
              </span>
            </div>

            <div className="row">
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Order Date:</strong><br />
                  {formatDate(displayOrder.ordered_at)}
                </p>
                <p className="mb-2">
                  <strong>Customer Phone:</strong><br />
                  {displayOrder.customer_phone_number}
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

            {/* Assigned At (if available) */}
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
            <p><strong>Name:</strong> {displayOrder.customer_name || "N/A"}</p>
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
                  <div className="row">
                    <div className="col-8">
                      <h6 className="mb-1">{item.product_name}</h6>
                      <p className="text-muted mb-1">Category: {item.category}</p>
                      <p className="mb-1">Quantity: {item.quantity}</p>
                      <p className="mb-0">
                        <span className="badge bg-success">
                          {/* {item.status || "VENDOR ACCEPTED"} */}
                        </span>
                      </p>
                      {item.vendor_name && (
                        <p className="mb-0 text-muted mt-1">
                          {/* <small>Vendor: {item.vendor_name}</small> */}
                        </p>
                      )}
                    </div>
                    <div className="col-4 text-end">
                      <p className="text-danger fw-bold mb-0">
                        ₹{formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-12">
                      <p className="mb-0 text-end">
                        <strong>Total: ₹{formatCurrency(item.total_price)}</strong>
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

        {/* WALLET TRANSACTIONS (Optional - can be removed if not needed) */}
        {(displayOrder.userwallet_transaction_amount || 
          displayOrder.cashbackwallet_transaction_amount || 
          displayOrder.schemwallet_transaction_amount) && (
          <div className="card shadow rounded-4 mb-4">
            <div className="card-body">
              
              
            </div>
          </div>
        )}

        {/* ORDER ACTIONS */}
        <div className="row">
          <div className="col-6 mb-2">
            <button
              className="btn btn-danger w-100 py-3 rounded-pill"
              onClick={() => setShowRejectModal(true)}
            >
              Reject Order
            </button>
          </div>
          <div className="col-6 mb-2">
            <button
              className="btn btn-success w-100 py-3 rounded-pill"
              onClick={() => handleAccept(selectedOrder.id)}
            >
              Mark as Delivered
            </button>
          </div>
        </div>
      </div>

      {/* ================= REJECT MODAL ================= */}
      {showRejectModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4">
                <div className="modal-header">
                  <h5 className="text-danger">Reject Order #{displayOrder.order_no}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRejectModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <label htmlFor="rejectReason" className="form-label fw-bold mb-2">
                    Reason for Rejection:
                  </label>
                  <textarea
                    id="rejectReason"
                    className="form-control"
                    rows="4"
                    placeholder="Please provide a reason for rejecting this order..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary px-4 rounded-pill"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 rounded-pill"
                    onClick={handleRejectSubmit}
                    disabled={!rejectReason.trim()}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AssignedOrders;