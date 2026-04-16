import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const CancelledOrdersPage = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = [
    {
      id: "ORD-311-000325",
      orderDate: "05/01/2026 11:15",
      cancelledOn: "05/01/2026 12:02",
      amount: 3200,
      customerName: "David Smith",
      phone: "9876543210",
      address: "Anakapalli, Andhra Pradesh",
      items: [
        { name: "Headphones", category: "Electronics", qty: 1, price: 3200 },
      ],
    },
    {
      id: "ORD-311-000326",
      orderDate: "06/01/2026 09:40",
      cancelledOn: "06/01/2026 10:05",
      amount: 6400,
      customerName: "Emma Watson",
      phone: "9123456789",
      address: "Visakhapatnam, Andhra Pradesh",
      items: [
        { name: "Smart Watch", category: "Electronics", qty: 2, price: 3200 },
      ],
    },
  ];

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
        <h3 className="text-warning m-0">Cancelled Orders</h3>
        <br />
        <div className="card shadow-sm rounded-4 p-4">

          <div className="row g-4">
            {orders.map((order) => (
              <div key={order.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm rounded-4 h-100">
                  <div className="card-body d-flex flex-column">

                    {/* HEADER */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-danger fw-bold mb-0">
                        {order.id}
                      </h6>
                      <StatusBadge text="CANCELLED" />
                    </div>

                    <div className="mb-3">
                      <div className="mb-1">
                        <small className="text-muted">Customer Phone</small>
                        <div>{order.phone}</div>
                      </div>

                      <div className="mb-1">
                        <small className="text-muted">Amount</small>
                        <div>₹{order.amount}.00</div>
                      </div>

                      <div className="mb-1">
                        <small className="text-muted">Cancelled On</small>
                        <div>{order.cancelledOn}</div>
                      </div>

                      <div>
                        <small className="text-muted">Address</small>
                        <div className="text-break">{order.address}</div>
                      </div>
                    </div>

                    <button
                      className="btn btn-danger w-100 rounded-pill mt-auto"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  /* ================= DETAILS PAGE ================= */
  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">

        {/* HEADER */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <button
            className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
            onClick={() => setSelectedOrder(null)}
          >
            ←
          </button>
          <h4 className="mb-0 fw-bold">Order Details</h4>
        </div>

        {/* ORDER SUMMARY (FIXED ALIGNMENT) */}
        <div className="card shadow-sm rounded-4 mb-4">
          <div className="card-body d-flex justify-content-between align-items-start flex-wrap gap-3">

            <div>
              <h5 className="text-danger fw-bold mb-2">
                Order #{selectedOrder.id}
              </h5>

              <div className="mb-1">
                <small className="text-muted">Cancelled On</small>
                <div>{selectedOrder.cancelledOn}</div>
              </div>

              <div>
                <small className="text-muted">Total Amount</small>
                <div className="fw-bold fs-5">
                  ₹{selectedOrder.amount}.00
                </div>
              </div>
            </div>

            {/* Badge aligned with Order ID */}
            <StatusBadge text="CANCELLED" />

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

                <div className="mb-2">
                  <small className="text-muted">Name</small>
                  <div>{selectedOrder.customerName}</div>
                </div>

                <div className="mb-2">
                  <small className="text-muted">Phone</small>
                  <div>{selectedOrder.phone}</div>
                </div>

                <div>
                  <small className="text-muted">Delivery Address</small>
                  <div className="text-break">
                    {selectedOrder.address}
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

                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="border rounded-3 p-3 mb-3">

                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="mb-0 fw-bold">{item.name}</h6>
                      <StatusBadge text="CANCELLED" />
                    </div>

                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Category</small>
                        <div>{item.category}</div>
                      </div>
                      <div className="col-6 text-end">
                        <small className="text-muted">Quantity</small>
                        <div>{item.qty}</div>
                      </div>
                    </div>

                    <div className="mt-2 d-flex justify-content-between fw-semibold text-danger">
                      <span>Total</span>
                      <span>₹{item.price * item.qty}.00</span>
                    </div>

                  </div>
                ))}

              </div>
            </div>
          </div>

        </div>

        

      </div>
    </div>
  );
};

export default CancelledOrdersPage;
