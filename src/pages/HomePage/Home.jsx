// src/pages/HomePage/Home.jsx (Fixed - Using Bootstrap primarily)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaTicketAlt, FaGift, FaShoppingCart, FaMoneyBillWave,
  FaCalendar, FaUsers, FaChartLine, FaArrowRight,
  FaBolt, FaChair, FaMobileAlt, FaStar,
  FaWallet, FaCoins, FaTools, FaChevronLeft, FaChevronRight,
  FaTimes, FaShieldAlt, FaClock, FaUserFriends,
  FaUpload, FaReceipt, FaTrophy, FaRandom, FaInfoCircle,
  FaHandshake, FaTag, FaRocket, FaQuoteRight, FaPlay
} from 'react-icons/fa';
import {
  Card, Row, Col, Button, Container, Badge,
  Modal, Tabs, Tab
} from 'react-bootstrap';
import LoadingToast from '../loading/LoadingToast';
import './HomePage.css';

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const winnersTrackRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  useEffect(() => {
    // if (localStorage.getItem('token') == null || localStorage.getItem('user_id') == undefined) {
    //   navigate('/login');
    // }
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Check login status from localStorage
        const userId = localStorage.getItem('user_id');
        const isLoggedInStorage = !!userId;

        setIsLoggedIn(isLoggedInStorage);

        if (isLoggedInStorage) {
          const userDataStr = localStorage.getItem('user_data');
          if (userDataStr) {
            setUserData(JSON.parse(userDataStr));
          }
        }

        // Small delay for smooth loading
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Listen for login/logout events to update UI
    const handleLogin = () => {
      const userId = localStorage.getItem('user_id');
      setIsLoggedIn(!!userId);
      if (userId) {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          setUserData(JSON.parse(userDataStr));
        }
      }
    };

    const handleLogout = () => {
      setIsLoggedIn(false);
      setUserData(null);
    };

    window.addEventListener('user-login-success', handleLogin);
    window.addEventListener('user-logout', handleLogout);

    return () => {
      window.removeEventListener('user-login-success', handleLogin);
      window.removeEventListener('user-logout', handleLogout);
    };
  }, []);

  // Auto-scroll winners

  // Auto-slide carousel

  const checkLoginBeforeAction = (category) => {
    if (!isLoggedIn) {
      setActionLoading(true);
      setLoadingMessage('Redirecting to login...');
      setTimeout(() => {
        setActionLoading(false);
        navigate('/login', {
          state: { from: window.location.pathname, category }
        });
      }, 500);
      return false;
    }
    return true;
  };

 const handleCardClick = (category) => {
  setActionLoading(true);
  setLoadingMessage(`Loading ${category}...`);

  setTimeout(() => {
    setActionLoading(false);

    switch (category) {
      case 'schemes':
        navigate('/schemes');
        break;

      case 'lucky-draw':
        navigate('/lucky-draw');
        break;

      case 'products':
        navigate('/products');
        break;

      case 'cashback':
        navigate('/cashback');
        break;

      default:
        navigate('/');
    }
  }, 500);
};

  const handleAdClick = (category) => {
    if (category === 'home') return;
    if (!checkLoginBeforeAction(category)) return;
    setActionLoading(true);
    setLoadingMessage(`Loading ${category}...`);
    setTimeout(() => {
      setActionLoading(false);
      navigate(`/${category}`);
    }, 500);
  };

  const handleLearnMore = (type) => {
    setActionLoading(true);
    setLoadingMessage('Loading details...');
    setTimeout(() => {
      switch (type) {
        case 'schemes':
          setModalContent(schemesModalContent);
          break;
        case 'elp':
          setModalContent(elpModalContent);
          break;
        case 'cashback':
          setModalContent(cashbackModalContent);
          break;
        default:
          break;
      }
      setShowModal(true);
      setActiveTab('overview');
      setActionLoading(false);
    }, 300);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % advertisements.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  // Data arrays
  const advertisements = [
    {
      id: 1,
      title: "Special Diwali Offer! 🪔",
      description: "Get 25% extra cashback on all electronics purchases this festive season",
      image: "https://images.unsplash.com/photo-1603574670819-d0d0d1b5ef2a?w=1200&h=400&fit=crop&auto=format",
      cta: "Shop Festive Deals",
      category: "products"
    },
    {
      id: 2,
      title: "New Scheme Launch! 💰",
      description: "Invest in our Premium Gold Scheme and earn 20% monthly returns",
      image: "https://images.unsplash.com/photo-1552422535-c45813c61732?w=1200&h=400&fit=crop&auto=format",
      cta: "Invest Now",
      category: "schemes"
    },
    {
      id: 3,
      title: "Refer & Earn Bonus! 👥",
      description: "Refer new agents and earn ₹1000 bonus per successful referral",
      image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=1200&h=400&fit=crop&auto=format",
      cta: "Start Earning",
      category: "home"
    },
    {
      id: 4,
      title: "Mega Lucky Draw! 🎁",
      description: "Win iPhone 15 Pro Max & Cash Prizes worth ₹10 Lakh",
      image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&h=400&fit=crop&auto=format",
      cta: "Participate Now",
      category: "lucky-draw"
    },
    {
      id: 5,
      title: "Cashback Festival! 💳",
      description: "Double cashback on all banking services this month",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=400&fit=crop&auto=format",
      cta: "Avail Offers",
      category: "cashback"
    }
  ];

  const winnersData = [
    {
      id: 1,
      name: "Rahul Sharma",
      prize: "iPhone 15 Pro Max",
      feedback: "I never thought saving ₹100 daily could get me an iPhone! The process was completely transparent and the delivery was lightning fast.",
      scheme: "Daily Saving Scheme",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format"
    },
    {
      id: 2,
      name: "Priya Patel",
      prize: "₹50,000 Cashback",
      feedback: "With just a ₹99 ticket, I won ₹50,000 cashback! Used it to buy a washing machine for my family.",
      scheme: "ELP Weekly Draw",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&auto=format"
    },
    {
      id: 3,
      name: "Arjun Kumar",
      prize: "BMW X1 Car",
      feedback: "Still can't believe I won a BMW! The entire process was smooth and the FLH team was incredibly supportive.",
      scheme: "Premium Mega Draw",
      image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=200&h=200&fit=crop&auto=format"
    },
    {
      id: 4,
      name: "Meera Nair",
      prize: "₹5,00,000",
      feedback: "Winning ₹5 lakhs has helped me start my small business. The withdrawal process was quick and completely hassle-free.",
      scheme: "Cash Prize Draw",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format"
    },
    {
      id: 5,
      name: "Vikram Singh",
      prize: "MacBook Pro M3",
      feedback: "As a software developer, I always wanted a MacBook. FLH made it possible through their monthly scheme.",
      scheme: "Tech Gadgets Draw",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format"
    },
    {
      id: 6,
      name: "Sneha Reddy",
      prize: "Gold Bar 100g",
      feedback: "The gold scheme helped me save for my daughter's wedding. The certification and purity were absolutely perfect!",
      scheme: "Gold Investment Scheme",
      image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200&h=200&fit=crop&auto=format"
    }
  ];

  const categoryCards = [
    {
      id: 'lucky-draw',
      title: 'Electronic Lucky Product',
      description: 'Join exciting Electronic Lucky draws with amazing prizes',
      icon: <FaTicketAlt />,
      count: '15 Active Draws',
      bgColor: '#dc3545'
    },
    {
      id: 'schemes',
      title: 'Schemes',
      description: 'Daily, Weekly & Monthly earning schemes',
      icon: <FaGift />,
      count: '8 Ongoing Schemes',
      bgColor: '#28a745'
    },
    {
      id: 'products',
      title: 'Products',
      description: 'Shop from wide range of products',
      icon: <FaShoppingCart />,
      count: '200+ Products',
      bgColor: '#fd7e14'
    },
    {
      id: 'cashback',
      title: 'Earn Cashback',
      description: 'Electronic Credit & Banking services',
      icon: <FaMoneyBillWave />,
      count: '6 Services',
      bgColor: '#17a2b8'
    }
  ];

  const sidePromotions = [
    {
      id: 1,
      title: "Schemes",
      description: "Smart Savings • Early Benefits • Easy Purchases",
      icon: <FaChartLine />,
      bgColor: "#667eea",
      features: [
        { text: "Daily/Weekly/Monthly", icon: <FaCalendar /> },
        { text: "System-Driven", icon: <FaRandom /> },
        { text: "Early Benefits", icon: <FaBolt /> }
      ],
      type: "schemes"
    },
    {
      id: 2,
      title: "Electronic Lucky Product",
      description: "Small Tickets • Big Rewards • Instant Wins",
      icon: <FaTicketAlt />,
      bgColor: "#f093fb",
      features: [
        { text: "Low Cost Tickets", icon: <FaCoins /> },
        { text: "Multiple Winners", icon: <FaUsers /> },
        { text: "Automated System", icon: <FaShieldAlt /> }
      ],
      type: "elp"
    },
    {
      id: 3,
      title: "Earn Cashback",
      description: "Shop • Upload • Earn • Save",
      icon: <FaMoneyBillWave />,
      bgColor: "#43e97b",
      features: [
        { text: "Bill Upload", icon: <FaUpload /> },
        { text: "Earn Cashback", icon: <FaChartLine /> },
        { text: "Multiple Winners", icon: <FaWallet /> }
      ],
      type: "cashback"
    }
  ];

  // Modal content (simplified)
  const schemesModalContent = {
    title: 'Schemes',
    description: 'Save Smart • Get Early Benefits • Buy Products with Ease',
    icon: <FaChartLine />,
    overview: {
      sections: [
        {
          title: 'What is Scheme?',
          content: 'Turn your dream products into reality by saving small amounts daily, weekly, or monthly.',
          icon: <FaGift />
        }
      ]
    },
    workflow: [
      {
        step: 1,
        title: 'Join a Scheme',
        description: 'Choose a Daily, Weekly or Monthly Scheme',
        icon: <FaUserFriends />
      },
      {
        step: 2,
        title: 'Batch Gets Filled',
        description: 'Scheme starts only after the batch is full.',
        icon: <FaUsers />
      },
      {
        step: 3,
        title: 'Automated Winner Selection',
        description: 'Selection is fully system-driven.',
        icon: <FaRandom />
      }
    ]
  };

  const elpModalContent = {
    title: 'Electronic Lucky Product',
    description: 'Small Ticket. Big Smiles.',
    icon: <FaTicketAlt />,
    overview: {
      sections: [
        {
          title: 'What is ELP?',
          content: 'Digital lucky draw where you buy tickets and win products or cashback.',
          icon: <FaGift />
        }
      ]
    },
    workflow: [
      {
        step: 1,
        title: 'Pick a Draw',
        description: 'Choose a Daily / Weekly / Monthly lucky draw.',
        icon: <FaTicketAlt />
      },
      {
        step: 2,
        title: 'Buy Tickets',
        description: 'Buy one or multiple tickets.',
        icon: <FaShoppingCart />
      },
      {
        step: 3,
        title: 'Automated Winner Selection',
        description: 'Winners selected 100% by system.',
        icon: <FaRandom />
      }
    ]
  };

  const cashbackModalContent = {
    title: 'Earn Cashback',
    description: 'Shop • Upload Bills • Earn Cashback',
    icon: <FaCoins />,
    overview: {
      sections: [
        {
          title: 'What is ECB?',
          content: 'Earn cashback by uploading valid purchase bills.',
          icon: <FaMoneyBillWave />
        }
      ]
    },
    workflow: [
      {
        step: 1,
        title: 'Upload Your Bill',
        description: 'Upload a clear and valid purchase bill.',
        icon: <FaUpload />
      },
      {
        step: 2,
        title: 'Bill Review & Eligibility',
        description: 'Your bill is verified by the system.',
        icon: <FaReceipt />
      },
      {
        step: 3,
        title: 'Join Cashback Draws',
        description: 'Participate in Weekly or Monthly draws.',
        icon: <FaTicketAlt />
      }
    ]
  };

  if (loading) {
    return <LoadingToast show={loading} message={loadingMessage} />;
  }

  return (
    <>
      <LoadingToast show={actionLoading} message={loadingMessage} />

      <Container fluid className="py-4">
        {/* Hero Carousel - Bootstrap Carousel would be better but keeping structure */}
        <div className="position-relative mb-4">
          <div className="position-absolute top-50 start-0 translate-middle-y z-2" style={{ left: '20px' }}>
            <Button variant="light" className="rounded-circle shadow" onClick={prevSlide} style={{ width: '40px', height: '40px' }}>
              <FaChevronLeft />
            </Button>
          </div>
          <div className="position-absolute top-50 end-0 translate-middle-y z-2" style={{ right: '20px' }}>
            <Button variant="light" className="rounded-circle shadow" onClick={nextSlide} style={{ width: '40px', height: '40px' }}>
              <FaChevronRight />
            </Button>
          </div>

          <div className="position-relative overflow-hidden rounded" style={{ height: '400px' }}>
            {advertisements.map((ad, index) => (
              <div
                key={ad.id}
                className={`position-absolute top-0 start-0 w-100 h-100 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  transition: 'opacity 0.5s ease-in-out',
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${ad.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="h-100 d-flex align-items-center">
                  <div className="text-white ps-4 ps-md-5" style={{ maxWidth: '600px' }}>
                    <h1 className="display-4 fw-bold mb-3">{ad.title}</h1>
                    <p className="lead mb-4">{ad.description}</p>
                    {/* <Button
                      variant="light"
                      size="lg"
                      className="fw-bold rounded-pill px-4"
                      onClick={() => handleAdClick(ad.category)}
                      disabled={actionLoading}
                    >
                      {ad.cta} <FaArrowRight className="ms-2" />
                    </Button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
            {advertisements.map((_, index) => (
              <button
                key={index}
                className={`btn btn-sm p-0 ${index === currentSlide ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setCurrentSlide(index)}
                style={{ width: '10px', height: '10px', borderRadius: '50%' }}
              />
            ))}
          </div>
        </div>

        {/* Side Promotions */}
        <Row className="mb-5 g-4">
          {sidePromotions.map((promo) => (
            <Col key={promo.id} xs={12} md={4}>
              <Card className="border-0 shadow-lg h-100 text-white overflow-hidden" style={{ background: promo.bgColor }}>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-white bg-opacity-25 rounded-circle p-3">
                      {promo.icon}
                    </div>
                    <div>
                      <h5 className="fw-bold mb-1">{promo.title}</h5>
                      <p className="mb-0 small opacity-75">{promo.description}</p>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {promo.features.map((feature, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="px-3 py-2">
                        {feature.icon} {feature.text}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline-light"
                    className="rounded-pill"
                    onClick={() => handleLearnMore(promo.type)}
                    disabled={actionLoading}
                  >
                    Learn More <FaArrowRight className="ms-2" />
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Access Categories */}
        <div className="mb-5">
          <h3 className="fw-bold mb-4">Quick Access</h3>
          <Row className="g-4">
            {categoryCards.map((card) => (
              <Col key={card.id} xs={12} sm={6} lg={3}>
                <Card
                  className="border-0 shadow-sm h-100 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCardClick(card.id)}
                >
                  <Card.Body className="p-4">
                    <div className={`text-${card.bgColor === '#dc3545' ? 'danger' : card.bgColor === '#28a745' ? 'success' : card.bgColor === '#fd7e14' ? 'warning' : 'info'} mb-3`} style={{ fontSize: '2rem' }}>
                      {card.icon}
                    </div>
                    <h5 className="fw-bold mb-2">{card.title}</h5>
                    <p className="text-muted small mb-3">{card.description}</p>
                    <Badge bg="secondary" className="px-3 py-2">
                      {card.count}
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Download App Banner */}
        <Card className="border-0 mb-5 bg-primary text-white">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <h4 className="fw-bold mb-2">📱 Download Our App!</h4>
                <p className="mb-0 opacity-75">Get instant notifications, faster processing & exclusive mobile-only offers</p>
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <Button variant="light" className="fw-bold rounded-pill px-4">
                  <FaMobileAlt className="me-2" /> Download Now
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Winners Section */}
        <Card className="border-0 mb-5 bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Card.Body className="p-4">
            <h3 className="fw-bold text-black mb-4">🏆 Recent Winners</h3>

            <div className="position-relative">
              <div
                ref={winnersTrackRef}
                className="d-flex gap-4 overflow-auto py-3"
                style={{ scrollbarWidth: 'none', cursor: 'grab' }}
                onMouseEnter={() => setIsAutoScrolling(false)}
                onMouseLeave={() => setIsAutoScrolling(true)}
              >
                {winnersData.map((winner) => (
                  <Card key={winner.id} className="border-0 flex-shrink-0" style={{ width: '320px' }}>
                    <Card.Body className="p-4">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <img
                          src={winner.image}
                          alt={winner.name}
                          className="rounded-circle border border-3 border-warning"
                          style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                        />
                        <div>
                          <h6 className="fw-bold mb-0">{winner.name}</h6>
                          <div className="text-warning fw-bold">{winner.prize}</div>
                          <small className="text-muted">{winner.scheme}</small>
                        </div>
                      </div>
                      <div className="bg-light rounded p-3">
                        <FaQuoteRight className="text-warning me-2" />
                        <small className="text-muted">"{winner.feedback}"</small>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Footer */}
        <footer className="mt-5 pt-5 bg-dark text-white">
          <Container>
            <Row>
              <Col lg={3} md={6} className="mb-4">
                <h6 className="text-uppercase text-secondary mb-3">ABOUT</h6>
                <ul className="list-unstyled">
                  <li className="mb-2"><Link to="https://www.lotofhappysmiles.com/" className="text-white text-decoration-none small">Contact Us</Link></li>
                  <li className="mb-2"><Link to="https://www.lotofhappysmiles.com/" className="text-white text-decoration-none small">About Us</Link></li>
                </ul>
              </Col>
              <Col lg={5} md={6} className="mb-4">
                <h6 className="text-uppercase text-secondary mb-3">Mail Us</h6>
                <address className="small text-white-50" style={{ fontStyle: 'normal' }}>
                  Fully Loaded House - Lot of Happy Smiles Pvt. Ltd.<br />
                  D.NO : 10-28-2/1/1, #402 - 4TH FLOOR.<br />
                  "A"-Square Business Center Waltair Uplands,<br />
                  Waltair Main Road, Visakhapatnam-530003,<br />
                  Andhra Pradesh, India.
                </address>
              </Col>
              <Col lg={4} md={6}>
                <h6 className="text-uppercase text-secondary mb-3">Registered Office</h6>
                <address className="small text-white-50" style={{ fontStyle: 'normal' }}>
                 Fully Loaded House - Lot of Happy Smiles Pvt. Ltd.<br />
                  D.NO : 10-28-2/1/1, #402 - 4TH FLOOR.<br />
                  "A"-Square Business Center Waltair Uplands,<br />
                  Waltair Main Road, Visakhapatnam-530003,<br />
                  Andhra Pradesh, India.
                </address>
              </Col>
            </Row>
            <div className="text-center py-3 border-top border-secondary">
              <small className="text-white-50">
                © 2025-2026 Fully Loaded House - Lot of Happy Smiles Pvt. Ltd.
              </small>
            </div>
          </Container>
        </footer>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>{modalContent?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalContent && (
              <>
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <div className="text-primary" style={{ fontSize: '2rem' }}>{modalContent.icon}</div>
                  </div>
                  <p className="text-muted">{modalContent.description}</p>
                </div>

                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                  <Tab eventKey="overview" title="Overview">
                    <div className="p-3">
                      {modalContent.overview?.sections.map((section, idx) => (
                        <Card key={idx} className="mb-3 border-0 shadow-sm">
                          <Card.Body>
                            <div className="d-flex gap-3">
                              <div className="text-primary fs-3">{section.icon}</div>
                              <div>
                                <h6 className="fw-bold">{section.title}</h6>
                                <p className="text-muted mb-0">{section.content}</p>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </Tab>
                  <Tab eventKey="workflow" title="How It Works">
                    <div className="p-3">
                      {modalContent.workflow?.map((step, idx) => (
                        <div key={idx} className="d-flex gap-3 mb-4">
                          <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                            {step.step}
                          </div>
                          <div>
                            <h6 className="fw-bold">{step.title}</h6>
                            <p className="text-muted mb-0">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Tab>
                </Tabs>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              setShowModal(false);
              handleCardClick(modalContent?.title?.toLowerCase().includes('scheme') ? 'schemes' :
                modalContent?.title?.toLowerCase().includes('lucky') ? 'lucky-draw' : 'cashback');
            }}>
              Explore Now <FaArrowRight className="ms-2" />
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>

      <style>
        {`
          .cursor-pointer {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .cursor-pointer:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }
          .overflow-auto::-webkit-scrollbar {
            display: none;
          }
          .overflow-auto {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}
      </style>
    </>
  );
};

export default Home;