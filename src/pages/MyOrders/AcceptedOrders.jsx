import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAcceptedOrders, fetchOrderDetails } from "./acceptedordersAPI";
import LoadingToast from "../loading/LoadingToast";

const AcceptedOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch accepted orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchAcceptedOrders();
      
      console.log("Accepted orders response:", response);
      
      // Extract orders array from the response
      // Response structure: { success: true, orders: [...] }
      const ordersData = response?.orders || [];
      
      setOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error("Error fetching accepted orders:", error);
      setError("Failed to load accepted orders. Please try again.");
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
    fetchOrders(); // Refresh the list
  };

  const handleDelivered = (id) => {
    alert(`Order ${id} marked as delivered`);
    setSelectedOrder(null);
    setOrderDetails(null);
    setOrderItems([]);
    fetchOrders(); // Refresh the list
  };

  if (loading) {
    return <LoadingToast show={loading} />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm me-3"
            onClick={() => navigate("/my-orders")}
          >
            ← Back to my orders
          </button>
        </div>
        <h3 className="text-warning m-0">Accepted Orders</h3>
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

  /* ================= ORDER LIST ================= */
  if (!selectedOrder) {
    return (
      <div className="container py-4">
        {/* HEADER WITH BACK BUTTON ON LEFT */}
        <div className="d-flex align-items-center mb-4">
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm me-3"
            onClick={() => navigate("/my-orders")}
          >
            ← Back to my orders
          </button>
        </div>
        <h3 className="text-warning m-0">Accepted Orders</h3>
        <br />

        {orders.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No accepted orders found</p>
          </div>
        ) : (
          <div className="row">
            {orders.map((order) => (
              <div key={order.id} className="col-md-6 col-lg-4 mb-4 d-flex">
                <div className="card shadow rounded-4 w-100 d-flex flex-column">
                  <div className="card-body d-flex flex-column">
                    
                    {/* CARD CONTENT */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="text-warning">{order.order_no}</h6>
                        <span className="badge bg-warning px-3 py-2 rounded-pill">
                          ACCEPTED
                        </span>
                      </div>

                      <p className="mb-1">
                        <b>Customer:</b> {order.customer_phone_number}
                      </p>
                      <p className="mb-1">
                        <b>Amount:</b> ₹{formatCurrency(order.total_amount)}
                      </p>
                      <p className="mb-1">
                        <b>Ordered on:</b> {formatDate(order.ordered_at)}
                      </p>
                      <p className="mb-1">
                        <b>Accepted on:</b> {formatDate(order.accepted_at)}
                      </p>
                      <p className="mb-1">
                        <b>Product:</b> {getProductName(order)}
                      </p>
                      <p className="mb-2">
                        <b>Address:</b> {order.delivery_address}
                      </p>
                    </div>

                    {/* BUTTON FIXED AT BOTTOM */}
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

  /* ================= DETAILS PAGE ================= */
  if (loadingDetails) {
    return <LoadingToast show={loadingDetails} />;
  }

  // Use orderDetails if available, otherwise fallback to selectedOrder
  const displayOrder = orderDetails || selectedOrder;

  return (
    <>
      <div className="container py-4">
        {/* HEADER */}
        <div className="d-flex align-items-center mb-3">
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm me-2"
            onClick={() => {
              setSelectedOrder(null);
              setOrderDetails(null);
              setOrderItems([]);
            }}
          >
            ←
          </button>
          <h4>Order Details</h4>
        </div>

        {/* ORDER SUMMARY */}
        <div className="card shadow rounded-4 mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 className="text-warning mb-3">
                  Order #{displayOrder.order_no}
                </h5>
                
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <b>Order Date:</b><br />
                      {formatDate(displayOrder.ordered_at)}
                    </p>
                    <p className="mb-2">
                      <b>Assigned On:</b><br />
                      {formatDate(displayOrder.assigned_at)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <b>Accepted On:</b><br />
                      {formatDate(displayOrder.accepted_at)}
                    </p>
                    <p className="mb-2">
                      <b>Total Amount:</b><br />
                      <span className="text-success fw-bold fs-5">₹{formatCurrency(displayOrder.total_amount)}</span>
                    </p>
                  </div>
                </div>
              </div>
              <span className="badge bg-warning px-4 py-2 rounded-pill fs-6">
                ACCEPTED
              </span>
            </div>
          </div>
        </div>

        <div className="row">
          {/* CUSTOMER INFO */}
          <div className="col-md-6 mb-4">
            <div className="card shadow rounded-4 h-100">
              <div className="card-body">
                <h5 className="text-warning mb-3">
                  Customer Information
                </h5>
                
                <div className="mb-3">
                  <p className="mb-1">
                    <b>Name:</b>
                  </p>
                  <p className="ps-3">{displayOrder.customer_name}</p>
                </div>

                <div className="mb-3">
                  <p className="mb-1">
                    <b>Phone:</b>
                  </p>
                  <p className="ps-3">{displayOrder.customer_phone_number}</p>
                </div>

                <div className="mb-3">
                  <p className="mb-1">
                    <b>Delivery Address:</b>
                  </p>
                  <p className="ps-3">{displayOrder.delivery_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS */}
          <div className="col-md-6 mb-4">
            <div className="card shadow rounded-4 h-100">
              <div className="card-body">
                <h5 className="text-warning mb-3">
                  Order Items
                </h5>
                
                {orderItems.length > 0 ? (
                  orderItems.map((item) => {
                    const itemPrice = parseFloat(item.price || 0);
                    const itemQuantity = item.quantity || 1;
                    const itemTotal = parseFloat(item.total_price || itemPrice * itemQuantity);

                    return (
                      <div key={item.id} className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8fff8', borderLeft: '4px solid #28a745' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>{item.product_name}</h6>
                          <span className="badge bg-warning px-3 py-2 rounded-pill">
                            {item.status}
                          </span>
                        </div>

                        <div className="row mb-3">
                          <div className="col-6">
                            <small className="text-muted d-block mb-1">Category</small>
                            <div className="fw-medium">{item.category}</div>
                          </div>
                          <div className="col-6 text-end">
                            <small className="text-muted d-block mb-1">Quantity</small>
                            <div className="fw-medium">{itemQuantity}</div>
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-6">
                            <small className="text-muted d-block mb-1">Price per item</small>
                            <div className="fw-bold">₹{formatCurrency(itemPrice)}</div>
                          </div>
                          <div className="col-6 text-end">
                            {/* <small className="text-muted d-block mb-1">Vendor</small>
                            <div className="fw-medium">{item.vendor_name}</div> */}
                          </div>
                        </div>

                        <div className="d-flex justify-content-between fw-bold text-success mt-3 pt-3 border-top" style={{ borderTopColor: '#dee2e6' }}>
                          <span style={{ fontSize: '1rem' }}>Total</span>
                          <span style={{ fontSize: '1.2rem' }}>₹{formatCurrency(itemTotal)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No items found for this order</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

       

        {/* ACTION BUTTONS */}
        <div className="row">
          <div className="col-md-6 mb-3">
            <button
              className="btn btn-danger w-100 py-3 rounded-pill"
              onClick={() => setShowRejectModal(true)}
            >
              Reject Order
            </button>
          </div>
          <div className="col-md-6 mb-3">
            <button
              className="btn btn-success w-100 py-3 rounded-pill"
              onClick={() => handleDelivered(displayOrder.id)}
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
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4">
                <div className="modal-header">
                  <h5 className="modal-title text-danger">
                    Reject Order #{displayOrder.order_no}
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowRejectModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <label className="form-label fw-bold mb-2">
                    Reason for rejection
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Please provide a reason for rejecting this order..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary px-4 rounded-pill"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
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

export default AcceptedOrdersPage;