import React, { useState, useEffect, useRef } from 'react';
import {
  FaQuestionCircle,
  FaHeadset,
  FaPhone,
  FaEnvelope,
  FaChevronDown,
  FaChevronUp,
  FaStore,
  FaUserTie,
  FaUser,
  FaExclamationTriangle,
  FaRedo,
  FaGoogle,
  FaMicrosoft
} from 'react-icons/fa';
import { helpsupportApi } from "./helpsupportAPI";
import LoadingToast from '../loading/LoadingToast';

const HelpSupport = () => {
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [showQuickContact, setShowQuickContact] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [supportData, setSupportData] = useState({
    email: '',
    phone: '',
    faqa: [],
    business_hours: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Refs for protocol handling
  const mailtoLinkRef = useRef(null);

  /* ---------------- GET USER ROLE ---------------- */
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      console.log("User from localStorage:", userStr);
      
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("Parsed user:", user);
        
        const role = user?.role || user?.userType || user?.user_role || user?.type || '';
        console.log("User role from localStorage:", role);
        
        if (role) {
          setUserRole(role.toLowerCase());
          return;
        }
      }
      
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            console.log("Token payload:", payload);
            
            const role = payload?.role || payload?.userType || payload?.user_role || '';
            if (role) {
              setUserRole(role.toLowerCase());
              return;
            }
          }
        } catch (e) {
          console.log("Could not decode token:", e);
        }
      }
      
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        const role = user?.role || user?.userType || '';
        if (role) {
          setUserRole(role.toLowerCase());
          return;
        }
      }
      
      const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
      if (userType) {
        setUserRole(userType.toLowerCase());
        return;
      }
      
      console.log("No user role found in any storage");
      setError("User role not found. Please log in again.");
      setLoading(false);
      
    } catch (err) {
      console.error("Error parsing user data:", err);
      setError("Failed to load user information");
      setLoading(false);
    }
  }, []);

  /* ---------------- FETCH FAQS ---------------- */
  useEffect(() => {
    if (userRole) {
      fetchSupportData();
    }
  }, [userRole, retryCount]);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching support data for role:", userRole);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await helpsupportApi.fetchHelpSupport({
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log("API Response received:", response);
      
      if (!response || typeof response !== 'object') {
        throw new Error("Invalid response format from server");
      }
      
      setSupportData({
        email: response.email || 'support@lotofhappysmiles.com',
        phone: response.phone || '+918886053332, +919573344275',
        faqa: Array.isArray(response.faqa) ? response.faqa : [],
        business_hours: Array.isArray(response.business_hours) ? response.business_hours : [
          { title: "Monday - Friday", value: "9:00 AM - 7:00 PM" },
          { title: "Saturday", value: "10:00 AM - 5:00 PM" },
          { title: "Sunday", value: "Closed" }
        ]
      });
      
      console.log("Support data set successfully");
      
    } catch (err) {
      console.error("Error in fetchSupportData:", err);
      
      let errorMessage = "Failed to load FAQs. ";
      
      if (err.name === 'AbortError' || err.message === 'Request timeout') {
        errorMessage += "The request timed out. Please check your connection.";
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMessage += "Network error. Please check your internet connection.";
      } else if (err.response?.status === 401) {
        errorMessage += "Authentication failed. Please log in again.";
      } else if (err.response?.status === 404) {
        errorMessage += "API endpoint not found. Please contact support.";
      } else {
        errorMessage += err.message || "Please try again later.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER FAQS BY ROLE ---------------- */
  const getRoleBasedFaqs = () => {
    try {
      const roleCategories = {
        customer: ['Lucky Draw', 'Payment & Wallet', 'Account & Security'],
        vendor: ['Orders & Delivery', 'Payment & Vendor Wallet', 'Products & Inventory', 'Subscription Plans', 'App Features & Support', 'Account & Security'],
        agent: ['Payment & Wallet', 'Account & Security', 'App Features & Support']
      };

      if (!userRole || !roleCategories[userRole]) {
        return [];
      }

      const allowedCategories = roleCategories[userRole];

      const filtered = supportData.faqa.filter(faq => 
        allowedCategories.includes(faq.category)
      );
      
      return filtered;
    } catch (err) {
      console.error("Error filtering FAQs:", err);
      return [];
    }
  };

  const roleBasedFaqs = getRoleBasedFaqs();

  const getRoleSpecificCategories = () => {
    try {
      if (roleBasedFaqs.length === 0) {
        return [{ id: 'all', name: 'All FAQs' }];
      }
      
      const categories = [{ id: 'all', name: 'All FAQs' }];
      
      roleBasedFaqs.forEach(faq => {
        const categoryId = faq.category.toLowerCase().replace(/\s+/g, '-');
        if (!categories.some(cat => cat.id === categoryId)) {
          categories.push({
            id: categoryId,
            name: faq.category
          });
        }
      });
      
      return categories;
    } catch (err) {
      console.error("Error getting categories:", err);
      return [{ id: 'all', name: 'All FAQs' }];
    }
  };

  const faqCategories = getRoleSpecificCategories();

  const getRoleIcon = () => {
    switch(userRole?.toLowerCase()) {
      case 'vendor':
        return <FaStore className="me-2 text-warning" />;
      case 'agent':
        return <FaUserTie className="me-2 text-warning" />;
      case 'customer':
        return <FaUser className="me-2 text-warning" />;
      default:
        return <FaQuestionCircle className="me-2 text-warning" />;
    }
  };

  const getRoleDisplayName = () => {
    switch(userRole?.toLowerCase()) {
      case 'vendor':
        return 'Vendor';
      case 'agent':
        return 'Agent';
      case 'customer':
        return 'Customer';
      default:
        return 'User';
    }
  };

  const toggleFaq = (categoryIndex, questionIndex) => {
    const id = `${categoryIndex}-${questionIndex}`;
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getFilteredFaqs = () => {
    try {
      if (activeCategory === 'all') {
        return roleBasedFaqs;
      }
      
      return roleBasedFaqs.filter(faq => 
        faq.category.toLowerCase().replace(/\s+/g, '-') === activeCategory
      );
    } catch (err) {
      console.error("Error filtering FAQs:", err);
      return [];
    }
  };

  const filteredFaqs = getFilteredFaqs();

  const phoneNumbers = supportData.phone ? supportData.phone.split(',').map(phone => phone.trim()) : [];

  const getCategoryColor = (colorName) => {
    // MODIFIED: Only return red or yellow colors
    const colorMap = {
      'mustardYellow': '#ffc107', // yellow
      'primaryRed': '#dc3545',     // red
    };
    // Default to red if color not found
    return colorMap[colorName] || '#dc3545';
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
  };

  const hasAccess = userRole && ['customer', 'vendor', 'agent'].includes(userRole?.toLowerCase());

  // Email app selection handler
const handleEmailClick = (app) => {
  if (app === 'gmail') {
    // Gmail compose URL with pre-filled fields
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportData.email)}&su=${encodeURIComponent('Help Support Request')}`;
    window.open(gmailComposeUrl, '_blank');
  } else if (app === 'outlook') {
    // Outlook compose URL with pre-filled fields
    const outlookComposeUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(supportData.email)}&subject=${encodeURIComponent('Help Support Request')}`;
    window.open(outlookComposeUrl, '_blank');
  } else if (app === 'yahoo') {
    // Yahoo Mail compose
    const yahooComposeUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(supportData.email)}&subject=${encodeURIComponent('Help Support Request')}`;
    window.open(yahooComposeUrl, '_blank');
  } else if (app === 'default') {
    // Default mailto protocol - this opens the default email app with compose window
    if (mailtoLinkRef.current) {
      mailtoLinkRef.current.click();
    }
  }
  
  setShowEmailModal(false);
};

  // Email Modal Component
const EmailAppModal = () => {
  if (!showEmailModal) return null;
  
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowEmailModal(false)}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title">Choose Email App</h5>
            <button type="button" className="btn-close" onClick={() => setShowEmailModal(false)}></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">Select your preferred email app to compose a message to:</p>
            <p className="fw-bold text-center mb-4">{supportData.email}</p>
            
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button 
                className="btn btn-outline-danger p-3 flex-grow-1"
                onClick={() => handleEmailClick('gmail')}
                style={{ minWidth: '100px' }}
              >
                <FaGoogle size={24} className="mb-2" />
                <div>Gmail</div>
              </button>
              <button 
                className="btn btn-outline-primary p-3 flex-grow-1"
                onClick={() => handleEmailClick('outlook')}
                style={{ minWidth: '100px' }}
              >
                <FaMicrosoft size={24} className="mb-2" />
                <div>Outlook</div>
              </button>
              <button 
                className="btn btn-outline-secondary p-3 flex-grow-1"
                onClick={() => handleEmailClick('yahoo')}
                style={{ minWidth: '100px' }}
              >
                <span className="mb-2 fw-bold">Y!</span>
                <div>Yahoo</div>
              </button>
            </div>
            
            <div className="text-center mt-3">
              <button 
                className="btn btn-link text-secondary"
                onClick={() => handleEmailClick('default')}
              >
                Use default email app
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Loading state
  if (loading) {
    return <LoadingToast show={loading} />;
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid bg-white min-vh-100 p-0">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <FaExclamationTriangle className="text-warning mb-3" size={48} />
            <h5 className="mb-3">Oops! Something went wrong</h5>
            <p className="text-muted mb-3">{error}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button 
                className="btn btn-warning"
                onClick={handleRetry}
              >
                <FaRedo className="me-2" />
                Try Again
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No access state
  if (!hasAccess) {
    return (
      <div className="container-fluid bg-white min-vh-100 p-0">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="text-center">
            <FaQuestionCircle className="text-warning mb-3" size={48} />
            <h5 className="mb-3">Access Restricted</h5>
            <p className="text-muted mb-3">Please log in to access help and support.</p>
            <button 
              className="btn btn-warning"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="container-fluid bg-white min-vh-100 p-0">
      {/* Hidden anchor tag for email protocol handling */}
      <a 
        ref={mailtoLinkRef}
        href={`mailto:${supportData.email}?subject=Help%20Support%20Request`}
        style={{ display: 'none' }}
      ></a>

      {/* Email App Selection Modal */}
      <EmailAppModal />

      <div className="bg-light border-bottom py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div>
              <h2 className="fw-bold">
                <FaQuestionCircle className="me-2 text-warning" />
                Help & Support
              </h2>
              <p className="text-muted mb-0">
                FAQ | Contact
              </p>
              <div className="mt-2">
                <span className="badge bg-warning text-dark px-3 py-2">
                  {/* {getRoleIcon()}
                  Logged in as: {getRoleDisplayName()} */}
                </span>
                {/* <span className="badge bg-light text-dark ms-2 px-3 py-2">
                  {roleBasedFaqs.reduce((acc, faq) => acc + faq.questions.length, 0)} FAQ(s) available
                </span> */}
              </div>
            </div>

            <div className="text-end">
              <button
                className="btn btn-warning"
                onClick={() => setShowQuickContact(!showQuickContact)}
              >
                <FaHeadset className="me-2" />
                Contact Support
              </button>

              {showQuickContact && (
                <div className="mt-3 p-4 border rounded bg-white text-start" style={{ minWidth: '350px' }}>
                  <h5 className="mb-3 fw-bold">Get in Touch</h5>
                  <p className="text-muted mb-4">We're here to help! Choose your preferred way to contact us.</p>
                  
                  {/* Call Us Section - KEEPING ORIGINAL BEHAVIOR */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">
                      <FaPhone className="me-2 text-warning" />
                      Call Us
                    </h6>
                    {phoneNumbers.map((phone, index) => (
                      <a
                        key={index}
                        href={`tel:${phone.replace(/\s/g, '')}`}
                        className="text-primary d-block mb-1 text-decoration-none"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                  
                  {/* Email Us Section - WITH MODAL */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">
                      <FaEnvelope className="me-2 text-warning" />
                      Email Us
                    </h6>
                    <button
                      className="btn btn-link text-primary p-0"
                      style={{ textDecoration: 'none', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowEmailModal(true);
                      }}
                    >
                      {supportData.email}
                    </button>
                  </div>

                  {/* Business Hours */}
                  <div className="border-top pt-3">
                    <h6 className="fw-bold mb-3">Business Hours</h6>
                    {supportData.business_hours.map((hours, index) => (
                      <div key={index} className="d-flex justify-content-between small mb-2">
                        <span className="text-muted">{hours.title}</span>
                        <span className="fw-bold">{hours.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row">
          {faqCategories.length > 1 && (
            <div className="col-lg-3 mb-4">
              <div className="list-group shadow-sm">
                {faqCategories.map(cat => (
                  <button
                    key={cat.id}
                    // MODIFIED: Changed active class styling to use red
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      activeCategory === cat.id ? 'active bg-danger text-white border-danger' : ''
                    }`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span>{cat.name}</span>
                    {cat.id === 'all' ? (
                      // MODIFIED: Changed badge from bg-warning to bg-danger (yellow to red)
                      <span className="badge bg-danger rounded-pill">
                        {roleBasedFaqs.length}
                      </span>
                    ) : (
                      // MODIFIED: Changed badge from bg-secondary to bg-warning (gray to yellow)
                      <span className="badge bg-warning text-dark rounded-pill">
                        {roleBasedFaqs.find(f => 
                          f.category.toLowerCase().replace(/\s+/g, '-') === cat.id
                        )?.questions.length || 0}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={faqCategories.length > 1 ? "col-lg-9" : "col-lg-12"}>
            <div className="bg-white border rounded">
              <div className="px-4 py-3 border-bottom">
                <small className="text-muted">
                  Help Centre &gt; {getRoleDisplayName()} Support
                </small>
                <h5 className="fw-normal mt-2 mb-0">
                  {activeCategory === 'all' 
                    ? `All ${getRoleDisplayName()} FAQs` 
                    : faqCategories.find(c => c.id === activeCategory)?.name || 'FAQs'}
                </h5>
              </div>

              <div>
                {filteredFaqs.length === 0 && (
                  <div className="px-4 py-5 text-center text-muted">
                    <FaQuestionCircle size={48} className="mb-3 text-warning" />
                    <h6>No FAQs available for this category</h6>
                    <p className="mb-3">There are no FAQs matching your selection.</p>
                    {activeCategory !== 'all' && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => setActiveCategory('all')}
                      >
                        View all {getRoleDisplayName()} FAQs
                      </button>
                    )}
                  </div>
                )}

                {filteredFaqs.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border-bottom">
                    {activeCategory === 'all' && (
                      <div className="px-4 py-2 bg-light">
                        <h6 className="mb-0 fw-bold">
                          <span 
                            className="badge me-2" 
                            style={{ 
                              // MODIFIED: Using the updated getCategoryColor function
                              backgroundColor: getCategoryColor(category.color),
                              color: 'white'
                            }}
                          >
                            {category.category}
                          </span>
                        </h6>
                      </div>
                    )}
                    
                    {category.questions.map((faq, questionIndex) => (
                      <div key={questionIndex} className="px-4 py-3 border-top">
                        <button
                          className="btn w-100 d-flex justify-content-between align-items-center text-start p-0"
                          onClick={() => toggleFaq(categoryIndex, questionIndex)}
                        >
                          <span className="fw-normal">
                            {faq.q}
                          </span>
                          <span className="text-muted">
                            {expandedFaqs[`${categoryIndex}-${questionIndex}`] 
                              ? <FaChevronUp /> 
                              : <FaChevronDown />}
                          </span>
                        </button>

                        {expandedFaqs[`${categoryIndex}-${questionIndex}`] && (
                          <div className="mt-2 text-muted small p-3 bg-light rounded">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {filteredFaqs.length > 0 && (
                <div className="px-4 py-2 border-top bg-light">
                  <small className="text-muted">
                    Showing {filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0)} FAQ(s)
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;