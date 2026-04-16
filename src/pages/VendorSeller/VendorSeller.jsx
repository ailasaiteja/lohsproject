import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";

import {
  FaUsers,
  FaWallet,
  FaBoxOpen,
  FaTruck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaFileAlt,
  FaUserTie,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaLinkedinIn
} from "react-icons/fa";


const VendorSeller = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <div style={{
        background: "linear-gradient(120deg, #2874f0, #00c6ff)",
        padding: "100px 0",
        color: "#fff"
      }}>
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 style={{
                fontSize: "50px",
                fontWeight: "900",
                lineHeight: "1.2",
                marginBottom: "20px"
              }}>
                🏪 Become a Vendor on <span style={{ color: "#ffdd00" }}>FLH(Fully Loaded House)</span>
              </h1>

              <h5 style={{ color: "#e0e0e0", marginBottom: "25px" }}>
                Sell Online • Deliver Your Way • Get Paid Securely
              </h5>

              <p style={{ fontSize: "16px", color: "#f1f1f1", marginBottom: "20px" }}>
                Join <b>FLH (Fully Loaded House)</b> and grow your business by
                selling products to verified customers through direct
                purchases, saving schemes, and Electronic Lucky Product — with full control,
                transparent payments, and a simple vendor dashboard.
              </p>

              <Button
                size="lg"
                style={{
                  background: "linear-gradient(90deg, #ff9f00, #ff6f00)",
                  border: "none",
                  color: "#000",
                  fontWeight: "700",
                  padding: "14px 40px",
                  borderRadius: "40px",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.25)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
                onClick={() => navigate("/signup")}
              >
                Register as Vendor
              </Button>
            </Col>

            <Col md={6} className="text-center">
              <img
                src="https://img.freepik.com/free-vector/online-shopping-concept-illustration_114360-1084.jpg"
                alt="Vendor"
                style={{
                  maxHeight: "360px",
                  borderRadius: "20px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                  transform: "rotate(-2deg)"
                }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* ================= WHY VENDORS CHOOSE FLH ================= */}
      <Container style={{ marginTop: "60px", marginBottom: "60px" }}>
        <h3 style={{ textAlign: "center", fontWeight: "800", marginBottom: "50px" }}>
          ⭐ Why Vendors Choose <span style={{ color: "#2874f0" }}>FLH(Fully Loaded House)</span>
        </h3>

        <Row className="g-4">
          {[
            "Access a growing base of verified users",
            "Multiple selling models: Direct | Schemes | Electronic Lucky Product(ELP)",
            "Vendor-controlled delivery ",
            "Secure Vendor Wallet with full payment visibility",
            "Simple product, order & sales management",
            "Dedicated onboarding & support team",
          ].map((item, i) => (
            <Col md={4} key={i}>
              <div style={{
                background: "#fff",
                borderRadius: "25px",
                padding: "25px",
                textAlign: "center",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.15)"}
              onMouseOut={e => e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"}
              >
                <FaCheckCircle style={{
                  color: "#28a745",
                  fontSize: "26px",
                  marginBottom: "12px",
                  background: "#e6f4ea",
                  borderRadius: "50%",
                  padding: "10px"
                }} />
                <p style={{ fontWeight: "700", marginBottom: 0 }}>{item}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* ================= HOW FLH WORKS (VERTICAL TIMELINE) ================= */}
      <Container style={{ marginBottom: "60px" }}>
        <h3 style={{ fontWeight: "800", marginBottom: "50px", textAlign: "center" }}>
          🟦 How FLH(Fully Loaded House) Works for Vendors
        </h3>

        <div style={{ position: "relative", paddingLeft: "40px", borderLeft: "3px solid #2874f0" }}>
          {[
            {
              icon: <FaUserTie size={25} style={{ color: "#2874f0" }} />,
              title: "Register as a Vendor",
              desc: "Complete the registration process to become a Vendor on FLH.",
            },
            {
              icon: <FaBoxOpen size={25} style={{ color: "#2874f0" }} />,
              title: "List Your Products",
              desc: "Add products, grocery kits, or bundles with pricing, stock, and scheme or lucky draw eligibility.",
            },
            {
              icon: <FaUsers size={25} style={{ color: "#2874f0" }} />,
              title: "Receive Orders",
              desc: "Orders appear instantly in your Vendor Dashboard with timelines.",
            },
            {
              icon: <FaTruck size={25} style={{ color: "#2874f0" }} />,
              title: "Deliver Orders Yourself",
              desc: "You pack, dispatch, and deliver while updating order status.",
            },
            {
              icon: <FaMoneyBillWave size={25} style={{ color: "#28a745" }} />,
              title: "Get Paid Securely",
              desc: "Payments are credited to your Vendor Wallet after delivery.",
            },
          ].map((item, i) => (
            <div key={i} style={{
              position: "relative",
              marginBottom: "50px",
              paddingLeft: "30px"
            }}>
              <div style={{
                position: "absolute",
                left: "-40px",
                top: "0",
                background: "#fff",
                border: "3px solid #2874f0",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
              }}>
                {item.icon}
              </div>
              <h5 style={{ fontWeight: "700", marginBottom: "8px" }}>{item.title}</h5>
              <p style={{ color: "#555", fontSize: "15px" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* ================= VENDOR WALLET ================= */}
      <Container style={{ marginBottom: "60px" }}>
        <div style={{
          padding: "30px",
          borderRadius: "25px",
          boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
          background: "#fff"
        }}>
          <h4 style={{ fontWeight: "800", marginBottom: "20px" }}>💰 Vendor Wallet – 100% Transparent</h4>

          <ul style={{ marginBottom: "10px", paddingLeft: "20px", color: "#555" }}>
            <li>View earnings from completed orders</li>
            <li>Track every transaction clearly</li>
            <li>Withdraw money to your registered bank account</li>
            <li>Receive payout and wallet update alerts</li>
          </ul>

          <p style={{ color: "#6c757d" }}>
            🔒 Payments are processed securely as per FLH policies.
          </p>
        </div>
      </Container>

      {/* ================= DOCUMENTS REQUIRED ================= */}
      <Container style={{ marginBottom: "60px" }}>
        <h4 style={{ fontWeight: "800", marginBottom: "30px" }}>📄 Documents Required to Get Started</h4>

        <Row>
          <Col md={6}>
            <div style={{
              padding: "25px",
              borderRadius: "25px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              marginBottom: "20px",
              background: "#fff"
            }}>
              <FaFileAlt style={{
                color: "#2874f0",
                fontSize: "26px",
                marginBottom: "12px",
                background: "#e6f0ff",
                borderRadius: "50%",
                padding: "10px"
              }} />
              <p style={{ fontWeight: "700", marginBottom: "10px" }}>Business & Identity</p>
              <ul style={{ paddingLeft: "20px" }}>
                <li>Business Name & GST (if applicable)</li>
                <li>PAN Card</li>
                <li>Aadhaar & Address Proof</li>
              </ul>
            </div>
          </Col>

          <Col md={6}>
            <div style={{
              padding: "25px",
              borderRadius: "25px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              marginBottom: "20px",
              background: "#fff"
            }}>
              <FaWallet style={{
                color: "#28a745",
                fontSize: "26px",
                marginBottom: "12px",
                background: "#e6f4ea",
                borderRadius: "50%",
                padding: "10px"
              }} />
              <p style={{ fontWeight: "700", marginBottom: "10px" }}>Bank Details</p>
              <ul style={{ paddingLeft: "20px" }}>
                <li>Account Holder Name</li>
                <li>Account Number & IFSC</li>
                <li>Cancelled Cheque / Passbook</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Container>

      {/* ================= BOTTOM CTA ================= */}
      <div style={{
        background: "linear-gradient(90deg,  #00c6ff)",
        padding: "80px 0",
        textAlign: "center",
        color: "#fff"
      }}>
        <Container>
          <h5 style={{ fontWeight: "800", marginBottom: "25px", fontSize: "24px" }}>
            Sell with confidence. Deliver your way. Get paid securely — only on FLH.
          </h5>

          <Button
            size="lg"
            style={{
              background: "#fff",
              color: "#df2f2f",
              borderRadius: "40px",
              fontWeight: "700",
              padding: "14px 50px",
              border: "none",
              boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease"
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
            onClick={() => navigate("/vendor-registration")}
          >
            Get Started Now
          </Button>
        </Container>
        
      </div>
            {/* ================= FOOTER ================= */}
      <footer
        style={{
          background: "linear-gradient(180deg, #0f1c2e, #16263d)",
          color: "#fff",
          paddingTop: "60px",
          marginTop: "0",
        }}
      >
        <Container>
          <Row className="mb-5">
            {/* ABOUT */}
            <Col md={4}>
              <h6 style={{ color: "#9aa4b2", fontSize: "13px", marginBottom: "15px" }}>
                ABOUT
              </h6>
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
  <li className="mb-2">
    <a
      href="https://www.lotofhappysmiles.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-decoration-none text-white"
      style={{ fontSize: "12px" }}
    >
      Contact Us
    </a>
  </li>

  <li className="mb-2">
    <a
      href="https://www.lotofhappysmiles.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-decoration-none text-white"
      style={{ fontSize: "12px" }}
    >
      About Us
    </a>
  </li>

  <li style={{ fontSize: "12px" }}>
    Corporate Information
  </li>
</ul>
            </Col>

            {/* MAIL US */}
            <Col md={4}>
              <h6 style={{ color: "#9aa4b2", fontSize: "13px", marginBottom: "15px" }}>
                MAIL US
              </h6>
              <p style={{ fontSize: "14px", lineHeight: "1.8" }}>
                Fully Loaded House - Lot of Happy Smiles Pvt. Ltd.<br />
                D.NO : 10-28-2/1/1, #402 - 4TH FLOOR,<br />
                "A"-Square Business Center Waltair Uplands,<br />
                Waltair Main Road, Visakhapatnam-530003,<br />
                Andhra Pradesh, India.
              </p>
            </Col>

            {/* REGISTERED OFFICE */}
            <Col md={4}>
              <h6 style={{ color: "#9aa4b2", fontSize: "13px", marginBottom: "15px" }}>
                REGISTERED OFFICE ADDRESS
              </h6>
              <p style={{ fontSize: "14px", lineHeight: "1.8" }}>
                Fully Loaded House - Lot of Happy Smiles Pvt. Ltd.<br />
                20-34, DURGA NAGAR DURGA NAGAR,<br />
                PAYAKARAOPETA Payakaraopeta<br />
                Visakhapatnam, Andhra Pradesh<br />
                India 531126
                <br /><br />
                CIN: U47594AP2025PTC118915<br />
                Telephone: 044-45614700 / 044-67415800
              </p>
            </Col>
          </Row>

          {/* DIVIDER */}
          <hr style={{ borderColor: "rgba(255,255,255,0.2)" }} />

          {/* BOTTOM LINKS */}
          <Row className="align-items-center py-3">
            <Col md={6}>
              <span style={{ marginRight: "20px", fontSize: "14px" }}>Register as Vendor</span>
              <span style={{ fontSize: "14px" }}>Help Center</span>
            </Col>
            <Col md={4} className="text-md-end">
                            <div className="d-flex justify-content-md-end gap-3">
                              {[
                                { icon: <FaFacebookF />, href: "https://www.facebook.com/profile.php?id=61579165551099", color: "#1877F2", label: "Facebook" },
                                { icon: <FaInstagram />, href: "https://www.instagram.com/fullyloadedhouse/", color: "#E4405F", label: "Instagram" },
                                { icon: <FaTwitter />, href: "https://x.com/FLH9999", color: "#1DA1F2", label: "Twitter" },
                                { icon: <FaYoutube />, href: "#", color: "#FF0000", label: "YouTube" },
                                { icon: <FaLinkedinIn />, href: "https://www.linkedin.com/in/fully-loaded-house-fully-loaded-house-4a532a378", color: "#0A66C2", label: "LinkedIn" },
                              ].map((social, index) => (
                                <a 
                                  key={index}
                                  href={social.href} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                  title={social.label}
                                >
                                  <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      backgroundColor: '#2d3e50',
                                      color: '#ffffff',
                                      fontSize: '16px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.backgroundColor = social.color;
                                      e.currentTarget.style.transform = 'translateY(-3px)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.backgroundColor = '#2d3e50';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                  >
                                    {social.icon}
                                  </div>
                                </a>
                              ))}
                            </div>
                          </Col>
                        </Row>

            
             

          {/* COPYRIGHT */}
          <hr style={{ borderColor: "rgba(255,255,255,0.2)" }} />
          <Row className="py-3 text-center">
            <Col style={{ fontSize: "13px", color: "#b0b8c4" }}>
              © 2007-2026 Fully Loaded House - Lot of Happy Smiles Pvt. Ltd.
            </Col>
          </Row>
        </Container>
      </footer>

    </>
  );
};

export default VendorSeller;
