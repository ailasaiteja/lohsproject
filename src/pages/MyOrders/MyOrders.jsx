import React from "react";
import { useNavigate } from "react-router-dom";

const MyOrders = () => {
  const navigate = useNavigate();

  const stats = [
    { title: "Assigned Orders", count: 45, color: "#d32f2f", link: "/assigned-orders" },
    { title: "Accepted Orders", count: 30, color: "#fff000", link: "/accepted-orders" },
    { title: "Delivered Orders", count: 25, color: "#d32f2f", link: "/delivered-orders" },
    { title: "Rejected Orders", count: 8, color: "#fff000", link: "/rejected-orders" },
    { title: "Cancelled Orders", count: 5, color: "#d32f2f", link: "/cancelled-orders" },
  ];

  const recentOrders = [
    { id: "ORD-1001", customer: "Rahul", status: "Delivered", amount: "₹540",product :"smart phone" },
    { id: "ORD-1002", customer: "Suresh", status: "Accepted", amount: "₹320",product :"laptop" },
    { id: "ORD-1003", customer: "Anjali", status: "Rejected", amount: "₹210" ,product :"watch"},
    { id: "ORD-1004", customer: "Ravi", status: "Delivered", amount: "₹500",product :"smart phone" },
    { id: "ORD-1005", customer: "Ramesh", status: "Cancelled", amount: "₹400",product :"chair" },
  ];

  return (
    <div style={page}>
      {/* ===== Header ===== */}
      <div style={header}>
        <h2>My Orders </h2>
        
      <p style={subtitle}>Track and manage all your order activities</p>
      </div>

      {/* ===== Order Status Cards  ===== */}
      <div style={gridStyle}>
        {stats.map((item, index) => (
          <div
            key={index}
            style={{ ...cardStyle, borderLeft: `5px solid ${item.color}` }}
            onClick={() => navigate(item.link)}
          >
            <div>
              <p style={cardTitle}>{item.title}</p>
              <h3 style={{ ...count, color: item.color }}>{item.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Recent Orders Table ===== */}
      <div style={tableCard}>
        <h3 style={{ marginBottom: "16px" }}>Recent Orders</h3>

        <table style={table}>
          <thead>
            <tr style={theadRow}>
              <th style={th}>Order ID</th>
              <th style={th}>Customer</th>
              <th style={{ ...th, textAlign: "center" }}>Status</th>
              <th style={{ ...th, textAlign: "right" }}>Amount</th>
              <th style={{ ...th, textAlign: "right" }}>Product</th>
            </tr>
          </thead>

          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={i} style={tbodyRow}>
                <td style={td}>{order.id}</td>
                <td style={td}>{order.customer}</td>
                <td style={{ ...td, textAlign: "center" }}>
                  <span style={status(order.status)}>{order.status}</span>
                </td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>
                  {order.amount}
                  <br />
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  {order.product}
                  <br />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const page = {
  background: "#f5f7fb",
  minHeight: "100vh",
  padding: "24px",
};

const header = { marginBottom: "24px" };

const subtitle = { color: "#6b7280" };

// const summaryGrid = {
//   display: "grid",
//   gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
//   marginBottom: "30px",
// };

// const summaryCard = {
//   background: "#fff",
//   padding: "24px",
//   borderRadius: "14px",
//   boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
// };

// const summaryLabel = {
//   fontSize: "14px",
//   color: "#6b7280",
//   fontWeight: 600,
// };

// const summaryValue = {
//   fontSize: "32px",
//   fontWeight: 700,
//   marginTop: "6px",
// };

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginBottom: "30px",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  cursor: "pointer",
};

const cardTitle = {
  margin: 0,
  fontSize: "14px",
  color: "#6b7280",
  fontWeight: 600,
};

const count = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 700,
};

const tableCard = {
  background: "#fff",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
};

const table = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0 10px",
};

const theadRow = { background: "#f1f5f9" };

const th = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "13px",
  color: "#475569",
  fontWeight: 700,
};

const tbodyRow = {
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const td = {
  padding: "14px 16px",
  fontSize: "14px",
  color: "#1f2937",
};

const status = (value) => ({
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 600,
  color:
    value === "Delivered"
      ? "#2e7d32"
      : value === "Accepted"
      ? "#1976d2"
      : value === "Cancelled"
      ? "#f57c00"
      : "#d32f2f",
  background:
    value === "Delivered"
      ? "#e8f5e9"
      : value === "Accepted"
      ? "#e3f2fd"
      : value === "Cancelled"
      ? "#fff3e0"
      : "#fdecea",
});

export default MyOrders;
