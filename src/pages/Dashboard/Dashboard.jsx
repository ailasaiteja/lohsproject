import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FaBox,
  FaShoppingBag,
  FaChartLine,
  FaClipboardList,
  FaRupeeSign,
} from "react-icons/fa";
import { Container, Row, Col, Card } from "react-bootstrap";

const Dashboard = () => {
  /* ===== STAT CARDS ===== */
  const stats = [
    { 
      title: "Total Products", 
      value: 50, 
      icon: <FaBox />, 
      sub: "Total products",
      color: "#df3f2f",
      bgColor: "#fee7e7"
    },
    { 
      title: "Sold Products", 
      value: 10, 
      icon: <FaShoppingBag />, 
      sub: "Total sold products",
      color: "#df3f2f",
      bgColor: "#eef2ff"
    },
    { 
      title: "Available Products", 
      value: 40, 
      icon: <FaChartLine />, 
      sub: "In stock",
      color: "#df3f2f",
      bgColor: "#e8f7ed"
    },
    { 
      title: "Orders", 
      value: 12, 
      icon: <FaClipboardList />, 
      sub: "Available orders",
      color: "#df3f2f",
      bgColor: "#fff9e6"
    },
    { 
      title: "Revenue", 
      value: "50,000", 
      icon: <FaRupeeSign />, 
      sub: "Total revenue",
      color: "#df3f2f",
      bgColor: "#f0f2e6"
    },
  ];

  /* ===== GRAPH DATA ===== */
  const data = [
    { month: "Jan", Revenue: 12000, Sold: 8, Stock: 45, Orders: 5 },
    { month: "Feb", Revenue: 18000, Sold: 12, Stock: 42, Orders: 9 },
    { month: "Mar", Revenue: 15000, Sold: 10, Stock: 40, Orders: 7 },
    { month: "Apr", Revenue: 22000, Sold: 15, Stock: 38, Orders: 12 },
    { month: "May", Revenue: 19500, Sold: 18, Stock: 35, Orders: 14 },
    { month: "Jun", Revenue: 25000, Sold: 20, Stock: 30, Orders: 16 },
  ];

  /* ===== GRAPH HELPER ===== */
  const graphData = data.map(item => ({
    ...item,
    Growth: Math.round((item.Sold + item.Orders) / 2), // balanced growth line
  }));

  return (
    <Container fluid className="py-4" style={{ backgroundColor: "#f5f7fb", minHeight: "100vh" }}>
      
      {/* ===== BANNER ===== */}
      <Row className="mb-4">
        <Col>
          <div 
            className="p-4 text-white text-center rounded-4" 
            style={{ 
              background: "linear-gradient(90deg,#dc3545)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
            }}
          >
            <h2 className="fw-bold mb-2">Welcome back, FLH Vendor!</h2>
            <p className="mb-0 opacity-90">Manage your store efficiently</p>
          </div>
        </Col>
      </Row>

      {/* ===== STAT CARDS ===== */}
      <Row className="g-4 mb-5">
        {stats.map((item, i) => (
          <Col key={i} >
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-3">
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ 
                    width: "45px", 
                    height: "45px", 
                    backgroundColor: item.bgColor,
                    color: item.color,
                    fontSize: "22px"
                  }}
                >
                  {item.icon}
                </div>
                <p className="text-muted small mb-1">{item.title}</p>
                <h3 className="fw-bold mb-1" style={{ color: "#df3f2f" }}>
                  {item.title === "Revenue" ? <><FaRupeeSign className="me-1" />{item.value}</> : item.value}
                </h3>
                <p className="text-muted small mb-0">{item.sub}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ===== SALES GROWTH GRAPH ===== */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Overall Performance</h5>

              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={graphData} barCategoryGap="25%" barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />

                  {/* LEFT AXIS (NORMAL VALUES) */}
                  <YAxis yAxisId="left" />

                  {/* RIGHT AXIS (REVENUE) */}
                  <YAxis yAxisId="right" orientation="right" />

                  <Tooltip />
                  <Legend />

                  {/* BARS */}
                  <Bar yAxisId="left" dataKey="Sold" fill="#df3f2f" barSize={22} />
                  <Bar yAxisId="left" dataKey="Stock" fill="#ffd700" barSize={22} />
                  <Bar yAxisId="left" dataKey="Orders" fill="#6ec6ff" barSize={22} />
                  <Bar yAxisId="right" dataKey="Revenue" fill="#7ed597" barSize={22} />

                  {/* DOTTED SALES GROWTH LINE */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Growth"
                    stroke="#9aa06a"
                    strokeWidth={3}
                    strokeDasharray="6 6"
                    dot={false}
                    name="Growth"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Optional: Add some spacing at bottom */}
      <div className="mt-4" />
    </Container>
  );
};

export default Dashboard;