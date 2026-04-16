import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRejectedOrders, fetchOrderDetails } from "./rejectedordersAPI";
import LoadingToast from "../loading/LoadingToast";

/* ================= STATUS BADGE ================= */
const StatusBadge = ({ text }) => (
  <span
    className="badge bg-danger d-flex align-items-center justify-content-center"
    style={{
      height: "26px",
      fontSize: "12px",
      fontWeight: 600,
      padding: "0 12px",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

/* ================= MAIN COMPONENT ================= */
const RejectedOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch rejected orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchRejectedOrders();
      
      console.log("Rejected orders response:", response);
      
      // Extract orders array from the response
      // Response structure: { success: true, orders: [...] }
      const ordersData = response?.orders || [];
      
      setOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error("Error fetching rejected orders:", error);
      setError("Failed to load rejected orders. Please try again.");
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
        <h3 className="text-warning m-0">Rejected Orders</h3>
        <br />
        <div className="d-flex flex-column align-items-center justify-content-center" >
          <div className="text-danger mb-3"></div>
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
        <h3 className="text-warning m-0">Rejected Orders</h3>
        <br />
        <div className="card shadow-sm rounded-4 p-4">

          {orders.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No rejected orders found</p>
            </div>
          ) : (
            <div className="row g-4">
              {orders.map((order) => (
                <div className="col-md-6 col-lg-4 d-flex" key={order.id}>
                  <div className="card shadow-sm rounded-4 w-100 d-flex flex-column">
                    <div className="card-body d-flex flex-column">
                      <div className="flex-grow-1">

                      {/* HEADER */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="text-danger fw-semibold mb-0">
                          {order.order_no}
                        </h6>
                        <StatusBadge text="REJECTED" />
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Customer Phone</small>
                        <div className="fw-medium">{order.customer_phone_number}</div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Amount</small>
                        <div className="fw-medium">₹{formatCurrency(order.total_amount)}</div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Rejected On</small>
                        <div>{formatDate(order.rejected_at || order.cancelled_at)}</div>
                      </div>

                      <div className="mb-2">
                        <small className="text-muted">Product</small>
                        <div>{getProductName(order)}</div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted">Address</small>
                        <div className="text-break">{order.delivery_address}</div>
                      </div>

                      </div>

                      <button
                        className="btn btn-danger rounded-pill mt-3"
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
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">

        {/* HEADER */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              setSelectedOrder(null);
              setOrderDetails(null);
              setOrderItems([]);
            }}
          >
            ← Back
          </button>
          <h4 className="mb-0 fw-bold">Order Details</h4>
        </div>

        {/* ORDER SUMMARY */}
        <div className="card shadow-sm rounded-4 mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              
              <div>
                <h5 className="text-danger fw-bold mb-2">
                  Order #{displayOrder.order_no}
                </h5>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <small className="text-muted">Order Date</small>
                      <div>{formatDate(displayOrder.ordered_at)}</div>
                    </div>

                    <div className="mb-2">
                      <small className="text-muted">Rejected On</small>
                      <div>{formatDate(displayOrder.rejected_at)}</div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-2">
                      <small className="text-muted">Total Amount</small>
                      <div className="fw-bold fs-5 text-danger">
                        ₹{formatCurrency(displayOrder.total_amount)}
                      </div>
                    </div>

                    {displayOrder.assigned_at && (
                      <div className="mb-2">
                        <small className="text-muted">Assigned On</small>
                        <div>{formatDate(displayOrder.assigned_at)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge aligned with Order ID */}
              <StatusBadge text="REJECTED" />

            </div>
          </div>
        </div>

        {/* CUSTOMER + ITEMS */}
        <div className="row g-4 mb-4">

          {/* CUSTOMER INFO */}
          <div className="col-md-6">
            <div className="card shadow-sm rounded-4 h-100">
              <div className="card-body">
                <h5 className="text-warning fw-bold mb-3">
                  Customer Information
                </h5>

                <div className="mb-3">
                  <small className="text-muted">Name</small>
                  <div className="fw-medium">{displayOrder.customer_name}</div>
                </div>

                <div className="mb-3">
                  <small className="text-muted">Phone</small>
                  <div className="fw-medium">{displayOrder.customer_phone_number}</div>
                </div>

                <div className="mb-3">
                  <small className="text-muted">Delivery Address</small>
                  <div className="text-break">
                    {displayOrder.delivery_address}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS */}
          <div className="col-md-6">
            <div className="card shadow-sm rounded-4 h-100">
              <div className="card-body">
                <h5 className="text-warning fw-bold mb-3">
                  Order Items
                </h5>

                {orderItems.length > 0 ? (
                  orderItems.map((item) => {
                    const itemPrice = parseFloat(item.price || 0);
                    const itemQuantity = item.quantity || 1;
                    const itemTotal = parseFloat(item.total_price || itemPrice * itemQuantity);

                    return (
                      <div key={item.id} className="border rounded-3 p-3 mb-3 style={{ background: '#ffffff', border: '1px solid #ff4444' }}">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold mb-0"style={{ color: '#000',fontSize: '1rem'}}>{item.product_name}</h6>
                          <span className="badge bg-danger  px-3 py-2 rounded-pill">
                            {item.status}
                          </span>
                        </div>

                        <div className="row mb-2">
                          <div className="col-6">
                            <small className="text-muted">Category</small>
                            <div>{item.category}</div>
                          </div>
                          <div className="col-6 text-end">
                            <small className="text-muted">Quantity</small>
                            <div>{itemQuantity}</div>
                          </div>
                        </div>

                        <div className="row mb-2">
                          <div className="col-6">
                            <small className="text-muted">Price per item</small>
                            <div>₹{formatCurrency(itemPrice)}</div>
                          </div>
                          <div className="col-6 text-end">
                            {/* <small className="text-muted">Vendor</small>
                            <div>{item.vendor_name}</div> */}
                          </div>
                        </div>

                        <div className="d-flex justify-content-between fw-bold text-danger mt-2 pt-2 border-top">
                          <span>Total</span>
                          <span>₹{formatCurrency(itemTotal)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted">No items found for this order</p>
                )}
              </div>
            </div>
          </div>
        </div>

        

        

      </div>
    </div>
  );
};

export default RejectedOrders;