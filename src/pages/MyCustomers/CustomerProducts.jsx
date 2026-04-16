import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    FaArrowLeft, FaBox, FaRupeeSign, FaCalendarAlt,
    FaCheckCircle, FaTimesCircle, FaSpinner, FaImage,
    FaStar, FaTruck, FaUndo, FaPrint, FaExclamationTriangle,
    FaTag, FaWarehouse, FaBalanceScale, FaCalendarCheck,
    FaRegCommentDots, FaShoppingBag, FaCheck, FaClock,
    FaShoppingCart, FaEye, FaTrash, FaCreditCard,
    FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaHeadset,
    FaHeart, FaShareAlt, FaShieldAlt, FaShippingFast,
    FaExchangeAlt, FaShoppingBasket, FaBolt,
    FaPercent, FaMedal, FaStarHalfAlt, FaStar as FaStarSolid,
    FaArrowRight, FaShareSquare, FaDownload, FaFileInvoice,
    FaCheckSquare, FaRedo, FaExclamationCircle, FaThumbsUp,
    FaShippingFast as FaFastShipping, FaGift, FaAward,
    FaApple,
    FaMobile
} from 'react-icons/fa';

const CustomerProducts = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customerId } = useParams();
    
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);
    const [productList, setProductList] = useState([]);
    const [selectedProd, setSelectedProd] = useState(null);
    const [showProductDetails, setShowProductDetails] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [productDetails, setProductDetails] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [selectedPincode, setSelectedPincode] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [imageErrors, setImageErrors] = useState({});
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [orderStatus, setOrderStatus] = useState([]);

    // Load products from multiple sources
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            
            try {
                const { customer: stateCustomer, products } = location.state || {};
                
                let foundCustomer;
                if (stateCustomer) {
                    foundCustomer = stateCustomer;
                } else {
                    const customers = JSON.parse(localStorage.getItem('flh_customers') || '[]');
                    
                    if (customerId) {
                        foundCustomer = customers.find(c => c.id === parseInt(customerId) || c.id === customerId);
                    } else {
                        const lastCustomerId = localStorage.getItem('flh_last_selected_customer');
                        if (lastCustomerId) {
                            foundCustomer = customers.find(c => c.id === parseInt(lastCustomerId) || c.id === lastCustomerId);
                        }
                    }
                    
                    if (!foundCustomer) {
                        navigate('/customer-activities');
                        return;
                    }
                }
                
                setCustomer(foundCustomer);
                
                // Load products from multiple sources
                const allProducts = [];
                
                // 1. From userEntries (ProductPage purchases)
                const userEntries = JSON.parse(localStorage.getItem('userEntries') || '[]');
                const customerPurchases = userEntries.filter(entry => 
                    entry.customerId === foundCustomer.id || 
                    (foundCustomer.id && entry.customerId === foundCustomer.id.toString())
                );
                
                // Convert purchases to product format
                const purchasedProducts = customerPurchases.map(purchase => ({
                    id: purchase.id || purchase.productId || `PROD-${Date.now()}`,
                    customerId: foundCustomer.id,
                    productName: purchase.productName || purchase.title,
                    category: purchase.category || 'General',
                    price: purchase.amount || purchase.unitPrice || 0,
                    originalPrice: purchase.originalPrice || (purchase.amount ? purchase.amount * 1.1 : 0),
                    images: purchase.productImages || [purchase.productImage || ''],
                    status: purchase.status || 'delivered',
                    orderDate: purchase.orderDate || purchase.date,
                    deliveryDate: purchase.expectedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    seller: 'FLH Store',
                    brand: purchase.brand || getBrandFromProduct(purchase.productName),
                    model: purchase.productName,
                    storage: purchase.storage || '',
                    features: purchase.features || getFeaturesFromProduct(purchase.productName),
                    description: purchase.detailedDescription || purchase.description || '',
                    specifications: purchase.specifications || getSpecificationsFromProduct(purchase.productName),
                    rating: purchase.rating || 4.5,
                    reviews: Math.floor(Math.random() * 1000) + 100,
                    warranty: purchase.warranty || '1 Year Manufacturer Warranty',
                    returnPolicy: '10 Days Return Policy',
                    highlights: purchase.highlights || getHighlightsFromProduct(purchase.productName),
                    quantity: purchase.quantity || 1,
                    paymentMethod: purchase.paymentMethod || 'Wallet',
                    orderId: purchase.id,
                    invoiceNumber: purchase.reference || `INV-${Date.now()}`,
                    customerReview: purchase.review ? {
                        rating: purchase.rating || 0,
                        review: purchase.review,
                        date: purchase.reviewDate
                    } : null
                }));
                
                allProducts.push(...purchasedProducts);
                
                // 2. From flh_customer_products (if you implement that)
                const customerProducts = JSON.parse(localStorage.getItem('flh_customer_products') || '[]');
                const customerSpecificProducts = customerProducts.filter(p => 
                    p.customerId === foundCustomer.id || 
                    (foundCustomer.id && p.customerId === foundCustomer.id.toString())
                );
                allProducts.push(...customerSpecificProducts);
                
                // 3. From flh_products (legacy)
                const legacyProducts = JSON.parse(localStorage.getItem('flh_products') || '[]');
                const legacyCustomerProducts = legacyProducts.filter(p => 
                    p.customerId === foundCustomer.id || 
                    (foundCustomer.id && p.customerId === foundCustomer.id.toString())
                );
                allProducts.push(...legacyCustomerProducts);
                
                // 4. Generate mock products if no products found
                if (allProducts.length === 0) {
                    const mockProducts = generateMockProducts(foundCustomer.id);
                    allProducts.push(...mockProducts);
                }
                
                // Remove duplicates by ID
                const uniqueProducts = [];
                const seenIds = new Set();
                
                allProducts.forEach(product => {
                    if (!seenIds.has(product.id)) {
                        seenIds.add(product.id);
                        uniqueProducts.push(product);
                    }
                });
                
                setProductList(uniqueProducts);
                
            } catch (error) {
                console.error('Error loading data:', error);
                navigate('/customer-activities');
            } finally {
                setTimeout(() => setLoading(false), 500);
            }
        };

        initializeData();
    }, [location.state, navigate, customerId]);

    // Helper functions to extract product details
    const getBrandFromProduct = (productName) => {
        if (!productName) return 'Unknown';
        const name = productName.toLowerCase();
        if (name.includes('iphone') || name.includes('apple')) return 'Apple';
        if (name.includes('samsung') || name.includes('galaxy')) return 'Samsung';
        if (name.includes('oneplus')) return 'OnePlus';
        if (name.includes('google') || name.includes('pixel')) return 'Google';
        if (name.includes('xiaomi') || name.includes('mi')) return 'Xiaomi';
        if (name.includes('dell') || name.includes('xps')) return 'Dell';
        if (name.includes('macbook')) return 'Apple';
        if (name.includes('sony') || name.includes('wh')) return 'Sony';
        if (name.includes('airpods')) return 'Apple';
        if (name.includes('nike') || name.includes('air')) return 'Nike';
        if (name.includes('adidas') || name.includes('ultraboost')) return 'Adidas';
        return 'FLH';
    };

    const getFeaturesFromProduct = (productName) => {
        if (!productName) return ['High Quality', 'Durable', 'Premium Product'];
        const name = productName.toLowerCase();
        if (name.includes('iphone')) {
            return [
                'A17 Pro chip for next-level performance',
                'Pro camera system with 48MP main camera',
                'Titanium design',
                'USB‑C for charging and data transfer',
                'iOS 17 with Dynamic Island'
            ];
        }
        if (name.includes('laptop') || name.includes('macbook')) {
            return [
                'High-performance processor',
                'Long battery life',
                'Lightweight and portable',
                'High-resolution display',
                'Fast SSD storage'
            ];
        }
        return ['High Quality', 'Durable', 'Premium Product', 'Warranty Included'];
    };

    const getSpecificationsFromProduct = (productName) => {
        if (!productName) return { 'Type': 'General Product', 'Quality': 'Premium' };
        const name = productName.toLowerCase();
        if (name.includes('iphone')) {
            return {
                'Display': '6.7-inch Super Retina XDR',
                'Processor': 'A17 Pro chip',
                'Camera': '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
                'Battery': 'Up to 29 hours video playback',
                'Storage': '256GB',
                'Colors': 'Natural Titanium',
                'Warranty': '1 Year Apple Warranty'
            };
        }
        return {
            'Type': 'General Product',
            'Quality': 'Premium',
            'Warranty': '1 Year',
            'Return Policy': '10 Days'
        };
    };

    const getHighlightsFromProduct = (productName) => {
        if (!productName) return ['Best Seller', 'Premium Quality', 'Warranty Included'];
        return [
            'Best Seller',
            'No Cost EMI Available',
            'Exchange Offer',
            'Free Shipping',
            'GST Invoice Available'
        ];
    };

    // Generate product-specific images
    const generateProductImages = (productName) => {
        const productImages = {
            'iphone': [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=600&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&h=600&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1574755393849-623942496936?w=600&h=600&fit=crop&crop=center'
            ],
            'smart watch': [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1579586337278-3fbd68076c1e?w=600&h=600&fit=crop'
            ],
            'samsung': [
                'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop'
            ],
            'headphones': [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop'
            ],
            'laptop': [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop'
            ],
            'shoe': [
                'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&h=600&fit=crop'
            ],
            'jacket': [
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop'
            ],
            'dress': [
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop',
                'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=600&fit=crop'
            ]
        };

        const name = productName.toLowerCase();
        if (name.includes('iphone') || name.includes('apple')) return productImages['iphone'];
        if (name.includes('watch')) return productImages['smart watch'];
        if (name.includes('galaxy') || name.includes('samsung')) return productImages['samsung'];
        if (name.includes('headphone') || name.includes('airpod') || name.includes('sony')) return productImages['headphones'];
        if (name.includes('laptop') || name.includes('macbook') || name.includes('dell')) return productImages['laptop'];
        if (name.includes('shoe') || name.includes('nike') || name.includes('adidas')) return productImages['shoe'];
        if (name.includes('jacket') || name.includes('leather')) return productImages['jacket'];
        if (name.includes('dress') || name.includes('gown')) return productImages['dress'];
        
        // Default to general product image
        return ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'];
    };

    // Generate mock products with proper images and prices
    const generateMockProducts = (customerId) => {
        const products = [
            {
                id: `PROD-${Date.now()}-1`,
                customerId: customerId,
                productName: 'Apple iPhone 15 Pro Max',
                category: 'Smartphones',
                price: 134999,
                originalPrice: 149999,
                images: generateProductImages('iphone'),
                status: 'delivered',
                orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                deliveryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                seller: 'FLH Store',
                brand: 'Apple',
                color: 'Natural Titanium',
                model: 'iPhone 15 Pro Max',
                storage: '256 GB',
                features: [
                    '6.7-inch Super Retina XDR display',
                    'A17 Pro chip for next-level performance',
                    'Pro camera system (48MP Main, Ultra Wide, Telephoto)',
                    'Titanium design, the lightest Pro model ever',
                    'USB‑C for charging and data transfer'
                ],
                description: 'iPhone 15 Pro Max. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
                specifications: {
                    'Display': '6.7-inch Super Retina XDR display',
                    'Chip': 'A17 Pro chip',
                    'Camera': 'Pro camera system: 48MP Main, 12MP Ultra Wide, 12MP 5x Telephoto',
                    'Battery': 'Up to 29 hours video playback',
                    'Material': 'Titanium with textured matte glass back',
                    'Water Resistance': 'IP68 (maximum depth of 6 meters up to 30 minutes)',
                    'Operating System': 'iOS 17'
                },
                rating: 4.8,
                reviews: 15234,
                warranty: '1 Year Apple Warranty',
                returnPolicy: '14 Days Replacement Policy',
                highlights: [
                    'Brand: Apple',
                    'Model: iPhone 15 Pro Max',
                    'Display: 6.7 inches',
                    'Camera: 48MP + 12MP + 12MP',
                    'RAM: 8 GB',
                    'In The Box: Handset, USB-C Cable, Documentation'
                ],
                customerReview: {
                    rating: 0,
                    review: '',
                    date: null
                }
            },
            {
                id: `PROD-${Date.now()}-2`,
                customerId: customerId,
                productName: 'Apple iPhone 15 Pro Max',
                category: 'Smartphones',
                price: 134999,
                originalPrice: 149999,
                images: generateProductImages('iphone'),
                status: 'active',
                orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                seller: 'FLH Store',
                brand: 'Apple',
                color: 'Natural Titanium',
                model: 'iPhone 15 Pro Max',
                features: [
                    '6.7-inch Super Retina XDR display',
                    'A17 Pro chip for next-level performance',
                    'Pro camera system (48MP Main, Ultra Wide, Telephoto)',
                    'Titanium design, the lightest Pro model ever',
                    'USB‑C for charging and data transfer'
                ],
                description: 'iPhone 15 Pro Max. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
                specifications: {
                    'Display': '6.7-inch Super Retina XDR display',
                    'Chip': 'A17 Pro chip',
                    'Camera': 'Pro camera system: 48MP Main, 12MP Ultra Wide, 12MP 5x Telephoto',
                    'Battery': 'Up to 29 hours video playback',
                    'Material': 'Titanium with textured matte glass back',
                    'Water Resistance': 'IP68 (maximum depth of 6 meters up to 30 minutes)',
                    'Operating System': 'iOS 17'
                },
                rating: 4.8,
                reviews: 15234,
                warranty: '1 Year Apple Warranty',
                returnPolicy: '14 Days Replacement Policy',
                highlights: [
                    'Brand: Apple',
                    'Model: iPhone 15 Pro Max',
                    'Display: 6.7 inches',
                    'Camera: 48MP + 12MP + 12MP',
                    'RAM: 8 GB',
                    'In The Box: Handset, USB-C Cable, Documentation'
                ],
                customerReview: {
                    rating: 0,
                    review: '',
                    date: null
                }
            }
        ];
        
        return products;
    };

    // Handle image error
    const handleImageError = useCallback((productId, imageIndex) => {
        setImageErrors(prev => ({
            ...prev,
            [`${productId}-${imageIndex}`]: true
        }));
    }, []);

    // Get image source with fallback
    const getImageSource = useCallback((product, imageIndex = 0) => {
        const images = product.images || [];
        if (images.length === 0) {
            // Generate image based on product name
            const generatedImages = generateProductImages(product.productName);
            return generatedImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
        }
        
        const imageUrl = images[imageIndex];
        const errorKey = `${product.id}-${imageIndex}`;
        
        if (imageErrors[errorKey] || !imageUrl || imageUrl === '') {
            const generatedImages = generateProductImages(product.productName);
            return generatedImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop';
        }
        
        return imageUrl;
    }, [imageErrors]);

    // Handle product selection
    const handleProductSelect = useCallback((product) => {
        if (!product) return;
        
        setSelectedProd(product);
        setCurrentImageIndex(0);
        const details = generateProductDetails(product);
        setProductDetails(details);
        
        // Load user rating if exists
        if (details.customerReview && details.customerReview.rating > 0) {
            setUserRating(details.customerReview.rating);
            setReviewText(details.customerReview.review || '');
        } else {
            setUserRating(0);
            setReviewText('');
        }
        
        // Generate order tracking status
        generateOrderStatus(product);
        
        // Check delivery for default pincode
        checkDelivery('560001');
        
        requestAnimationFrame(() => {
            setShowProductDetails(true);
            setShowCancelForm(false);
            setShowReviewForm(false);
        });
    }, [customer]);

    // Generate order tracking status
    const generateOrderStatus = useCallback((product) => {
        const status = product.status?.toLowerCase();
        const statusList = [];
        
        // Order Confirmed
        statusList.push({
            status: 'Order Confirmed',
            date: product.orderDate ? new Date(product.orderDate).toLocaleDateString('en-IN') : 'Today',
            completed: true,
            icon: <FaCheckCircle className="text-success" />
        });
        
        // Shipped
        if (status === 'shipped' || status === 'delivered') {
            statusList.push({
                status: 'Shipped',
                date: product.shippedDate ? new Date(product.shippedDate).toLocaleDateString('en-IN') : 
                      product.orderDate ? new Date(new Date(product.orderDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : 'Tomorrow',
                completed: true,
                icon: <FaTruck className="text-info" />
            });
        } else {
            statusList.push({
                status: 'Shipped',
                date: 'Expected soon',
                completed: false,
                icon: <FaTruck className="text-muted" />
            });
        }
        
        // Out for Delivery
        if (status === 'delivered') {
            statusList.push({
                status: 'Out for Delivery',
                date: product.deliveryDate ? new Date(product.deliveryDate).toLocaleDateString('en-IN') : 'Yesterday',
                completed: true,
                icon: <FaShippingFast className="text-warning" />
            });
        } else {
            statusList.push({
                status: 'Out for Delivery',
                date: 'Not yet',
                completed: false,
                icon: <FaShippingFast className="text-muted" />
            });
        }
        
        // Delivered
        if (status === 'delivered') {
            statusList.push({
                status: 'Delivered',
                date: product.deliveryDate ? new Date(product.deliveryDate).toLocaleDateString('en-IN') : 'Today',
                completed: true,
                icon: <FaCheckCircle className="text-success" />
            });
        } else {
            statusList.push({
                status: 'Delivered',
                date: product.expectedDelivery ? new Date(product.expectedDelivery).toLocaleDateString('en-IN') : 'In 3-5 days',
                completed: false,
                icon: <FaCalendarCheck className="text-muted" />
            });
        }
        
        setOrderStatus(statusList);
    }, []);

    // Check delivery info
    const checkDelivery = (pincode) => {
        if (!pincode) return;
        
        const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const deliveryOptions = [
            {
                type: 'standard',
                deliveryBy: deliveryDate.toLocaleDateString('en-IN'),
                charges: 'Free',
                icon: <FaShippingFast />
            },
            {
                type: 'express',
                deliveryBy: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
                charges: '₹99',
                icon: <FaBolt />
            }
        ];
        
        setDeliveryInfo({
            pincode,
            available: true,
            deliveryOptions,
            codAvailable: true,
            returnPolicy: '10 Days Return Policy',
            seller: 'FLH Official'
        });
    };

    // Handle order cancellation
    const handleCancelOrder = useCallback(() => {
        if (!cancellationReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }
        
        const updatedProducts = productList.map(p => {
            if (p.id === selectedProd.id) {
                return {
                    ...p,
                    status: 'cancelled',
                    cancellationReason: cancellationReason,
                    cancelledDate: new Date().toISOString()
                };
            }
            return p;
        });
        
        setProductList(updatedProducts);
        
        // Update localStorage for all product sources
        // 1. Update userEntries
        const userEntries = JSON.parse(localStorage.getItem('userEntries') || '[]');
        const updatedUserEntries = userEntries.map(entry => {
            if (entry.id === selectedProd.id || entry.productId === selectedProd.id) {
                return {
                    ...entry,
                    status: 'cancelled',
                    cancellationReason: cancellationReason
                };
            }
            return entry;
        });
        localStorage.setItem('userEntries', JSON.stringify(updatedUserEntries));
        
        // 2. Update flh_customer_products
        const customerProducts = JSON.parse(localStorage.getItem('flh_customer_products') || '[]');
        const updatedCustomerProducts = customerProducts.map(p => {
            if (p.id === selectedProd.id) {
                return {
                    ...p,
                    status: 'cancelled',
                    cancellationReason: cancellationReason,
                    cancelledDate: new Date().toISOString()
                };
            }
            return p;
        });
        localStorage.setItem('flh_customer_products', JSON.stringify(updatedCustomerProducts));
        
        // 3. Update flh_products
        const allProducts = JSON.parse(localStorage.getItem('flh_products') || '[]');
        const updatedAllProducts = allProducts.map(p => {
            if (p.id === selectedProd.id) {
                return {
                    ...p,
                    status: 'cancelled',
                    cancellationReason: cancellationReason,
                    cancelledDate: new Date().toISOString()
                };
            }
            return p;
        });
        localStorage.setItem('flh_products', JSON.stringify(updatedAllProducts));
        
        // Update selected product
        const updatedSelectedProd = {
            ...selectedProd,
            status: 'cancelled',
            cancellationReason: cancellationReason,
            cancelledDate: new Date().toISOString()
        };
        setSelectedProd(updatedSelectedProd);
        setProductDetails(generateProductDetails(updatedSelectedProd));
        
        alert('Order cancelled successfully!');
        setShowCancelForm(false);
        setCancellationReason('');
    }, [cancellationReason, productList, selectedProd]);

    // Handle submit review
    const handleSubmitReview = useCallback(() => {
        if (userRating === 0) {
            alert('Please select a rating');
            return;
        }
        
        const updatedProducts = productList.map(p => {
            if (p.id === selectedProd.id) {
                return {
                    ...p,
                    customerReview: {
                        rating: userRating,
                        review: reviewText,
                        date: new Date().toISOString()
                    }
                };
            }
            return p;
        });
        
        setProductList(updatedProducts);
        
        // Update localStorage for all product sources
        // 1. Update userEntries
        const userEntries = JSON.parse(localStorage.getItem('userEntries') || '[]');
        const updatedUserEntries = userEntries.map(entry => {
            if (entry.id === selectedProd.id || entry.productId === selectedProd.id) {
                return {
                    ...entry,
                    rating: userRating,
                    review: reviewText,
                    reviewDate: new Date().toISOString()
                };
            }
            return entry;
        });
        localStorage.setItem('userEntries', JSON.stringify(updatedUserEntries));
        
        // 2. Update flh_customer_products
        const customerProducts = JSON.parse(localStorage.getItem('flh_customer_products') || '[]');
        const updatedCustomerProducts = customerProducts.map(p => {
            if (p.id === selectedProd.id) {
                return {
                    ...p,
                    customerReview: {
                        rating: userRating,
                        review: reviewText,
                        date: new Date().toISOString()
                    }
                };
            }
            return p;
        });
        localStorage.setItem('flh_customer_products', JSON.stringify(updatedCustomerProducts));
        
        alert('Thank you for your review!');
        setShowReviewForm(false);
    }, [userRating, reviewText, productList, selectedProd]);

    // Memoize filtered products
    const filteredProducts = useMemo(() => {
        return productList.filter(product => {
            if (!product) return false;
            const status = product.status?.toLowerCase();
            switch(activeTab) {
                case 'active': 
                    return status === 'active' || status === 'pending' || status === 'shipped';
                case 'cancelled': 
                    return status === 'cancelled';
                case 'completed': 
                    return status === 'completed' || status === 'delivered';
                default: 
                    return true;
            }
        });
    }, [productList, activeTab]);

    // Calculate total spent - FIXED to show actual purchase amounts
    const totalSpent = useMemo(() => {
        return productList.reduce((sum, product) => {
            const price = product.price || 0;
            const quantity = product.quantity || 1;
            return sum + (price * quantity);
        }, 0);
    }, [productList]);

    // Memoize status color
    const getStatusColor = useCallback((status) => {
        const statusLower = status?.toLowerCase() || 'pending';
        switch(statusLower) {
            case 'completed': 
            case 'delivered': 
                return 'success';
            case 'active': 
                return 'primary';
            case 'pending': 
                return 'warning';
            case 'cancelled': 
                return 'danger';
            case 'shipped': 
                return 'info';
            default: 
                return 'secondary';
        }
    }, []);

    // Generate product details with safe defaults
    const generateProductDetails = useCallback((product) => {
        if (!product) return null;
        
        const purchaseDate = product.orderDate ? new Date(product.orderDate) : new Date();
        const price = product.price || 0;
        const originalPrice = product.originalPrice || price * 1.1; // Add 10% if no original price
        
        const status = product.status?.toLowerCase() || 'pending';
        const isCancelled = status === 'cancelled';

        return {
            ...product,
            price: price,
            originalPrice: originalPrice,
            purchaseDate: purchaseDate.toLocaleDateString('en-IN'),
            purchaseTime: purchaseDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            status,
            isCancelled,
            rating: product.rating || Math.floor(Math.random() * 5) + 1,
            reviews: product.reviews || 0,
            seller: product.seller || 'FLH Store',
            warranty: product.warranty || '1 Year Manufacturer Warranty',
            returnPolicy: product.returnPolicy || '10 Days Return Policy',
            estimatedDelivery: product.expectedDelivery ? new Date(product.expectedDelivery).toLocaleDateString('en-IN') : 
                             new Date(purchaseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
            canCancel: (status === 'active' || status === 'pending' || status === 'shipped') && !isCancelled,
            deliveryAddress: product.deliveryAddress || (customer ? `${customer.firstName} ${customer.lastName}\n${customer.address || 'No address provided'}\nPhone: ${customer.phone}` : 'No address available'),
            paymentMethod: product.paymentMethod || 'UPI/Net Banking',
            orderId: product.id || `ORD-${Date.now()}`,
            invoiceNumber: product.invoiceNumber || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bankOffers: product.bankOffers || [
                '10% Instant Discount on ICICI Bank Credit Cards',
                '5% Unlimited Cashback on Flipkart Axis Bank Credit Card',
                'No Cost EMI on Bajaj Finserv'
            ],
            highlights: product.highlights || [
                'Best Seller',
                'No Cost EMI',
                'Exchange Offer Available',
                'Free Shipping',
                'GST Invoice Available'
            ],
            features: product.features || [],
            specifications: product.specifications || {},
            images: product.images || generateProductImages(product.productName),
            customerReview: product.customerReview || { rating: 0, review: '', date: null },
            quantity: product.quantity || 1
        };
    }, [customer]);

    // Safe price formatting function
    const formatPrice = useCallback((price) => {
        if (price === undefined || price === null) return '0';
        if (typeof price !== 'number') {
            const num = parseFloat(price);
            if (isNaN(num)) return '0';
            return num.toLocaleString('en-IN');
        }
        return price.toLocaleString('en-IN');
    }, []);

    // Calculate discount percentage safely
    const calculateDiscount = useCallback((price, originalPrice) => {
        if (!price || !originalPrice || originalPrice <= 0) return 0;
        return Math.round((1 - price / originalPrice) * 100);
    }, []);

    // Generate star rating display
    const renderStars = useCallback((rating, interactive = false, onRate = null) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={`star ${interactive ? 'interactive' : ''} ${i <= rating ? 'filled' : ''}`}
                    onClick={() => interactive && onRate && onRate(i)}
                    style={{
                        cursor: interactive ? 'pointer' : 'default',
                        color: i <= rating ? '#ffd700' : '#ddd',
                        fontSize: interactive ? '24px' : '16px',
                        margin: '0 2px'
                    }}
                >
                    {i <= rating ? <FaStarSolid /> : <FaStar />}
                </span>
            );
        }
        return <div className="d-flex align-items-center">{stars}</div>;
    }, []);

    // Render product card with proper price display - FIXED
    const renderProductCard = useCallback((product, index) => {
        if (!product) return null;
        
        const statusColor = getStatusColor(product.status);
        const price = product.price || 0;
        const originalPrice = product.originalPrice || price * 1.1;
        const discount = calculateDiscount(price, originalPrice);
        const quantity = product.quantity || 1;
        
        return (
            <div key={product.id || index} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 product-card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Product Image */}
                    <div className="position-relative" style={{ height: '220px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                        <img 
                            src={getImageSource(product, 0)}
                            alt={product.productName || 'Product'}
                            className="card-img-top w-100 h-100"
                            style={{ objectFit: 'contain', padding: '20px' }}
                            onError={() => handleImageError(product.id, 0)}
                        />
                        
                    </div>
                    
                    <div className="card-body d-flex flex-column p-3">
                        {/* Product Title */}
                        <h6 className="card-title fw-bold mb-2" style={{ 
                            fontSize: '14px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {product.productName || 'Product Name'}
                        </h6>
                        
                        {/* Brand */}
                        {product.brand && (
                            <div className="d-flex align-items-center mb-2">
                                {product.brand.toLowerCase() === 'apple' ? (
                                    <FaApple className="text-dark me-2" size={16} />
                                ) : (
                                    <FaTag className="text-muted me-2" size={12} />
                                )}
                                <span className="small text-muted">{product.brand}</span>
                            </div>
                        )}
                        
                        {/* Product Rating */}
                        <div className="d-flex align-items-center mb-2">
                            <span className="bg-warning text-white px-1 py-0 rounded d-flex align-items-center me-2" 
                                  style={{ fontSize: '12px' }}>
                                {product.rating || 4.0} <FaStar size={10} />
                            </span>
                            <span className="text-muted small">({product.reviews || 0})</span>
                        </div>
                        
                        {/* Price - SHOWING ACTUAL PURCHASE PRICE */}
                        <div className="mb-3">
                            <div className="d-flex align-items-baseline">
                                <h5 className="text-dark fw-bold me-2" style={{ fontSize: '18px' }}>
                                    ₹{formatPrice(price)}
                                </h5>
                                {originalPrice > price && (
                                    <>
                                        <span className="text-decoration-line-through text-muted me-2" style={{ fontSize: '14px' }}>
                                            ₹{formatPrice(originalPrice)}
                                        </span>
                                        <span className="text-success small fw-bold">
                                            {discount}% off
                                        </span>
                                    </>
                                )}
                            </div>
                            {quantity > 1 && (
                                <div className="small text-muted">
                                    Quantity: {quantity} • Total: ₹{formatPrice(price * quantity)}
                                </div>
                            )}
                            {originalPrice > price && (
                                <div className="small text-success">
                                    You save: ₹{formatPrice(originalPrice - price)}
                                </div>
                            )}
                        </div>
                        
                        {/* Additional Info */}
                        <div className="small text-muted mb-3 flex-grow-1">
                            <div className="mb-1">
                                <FaUser className="me-1" size={12} />
                                {product.seller || 'FLH Store'}
                            </div>
                            <div>
                                <FaTag className="me-1" size={12} />
                                {product.category || 'General'}
                            </div>
                            {product.color && (
                                <div>
                                    <span className="me-1">Color:</span>
                                    <span className="fw-bold">{product.color}</span>
                                </div>
                            )}
                            <div>
                                <span className="me-1">Order Date:</span>
                                <span className="fw-bold">
                                    {product.orderDate ? new Date(product.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="d-flex gap-2 mt-auto">
                            <button 
                                className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center"
                                onClick={() => handleProductSelect(product)}
                            >
                                <FaEye className="me-1" />
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [getStatusColor, handleProductSelect, getImageSource, handleImageError, formatPrice, calculateDiscount]);

    // Flipkart-style product details modal
    const renderProductDetails = useCallback(() => {
        if (!selectedProd || !productDetails) return null;

        const images = productDetails.images || generateProductImages(productDetails.productName);
        const price = productDetails.price || 0;
        const originalPrice = productDetails.originalPrice || price * 1.1;
        const discount = calculateDiscount(price, originalPrice);
        const quantity = productDetails.quantity || 1;
        const totalAmount = price * quantity;
        const isDelivered = productDetails.status === 'delivered';
        const isCancelled = productDetails.status === 'cancelled';
        const hasReviewed = productDetails.customerReview?.rating > 0;

        return (
            <div className="modal fade show d-block" style={{ 
                backgroundColor: 'rgba(0,0,0,0.5)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1050
            }}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" 
                     style={{ maxHeight: '95vh', margin: 'auto', maxWidth: '1200px' }}>
                    <div className="modal-content border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                        {/* Close Button */}
                        <button 
                            type="button" 
                            className="btn-close position-absolute"
                            onClick={() => {
                                setShowProductDetails(false);
                                setShowCancelForm(false);
                                setCancellationReason('');
                                setShowReviewForm(false);
                            }}
                            style={{ 
                                top: '15px', 
                                right: '15px', 
                                zIndex: 1060,
                                backgroundColor: 'white',
                                padding: '10px',
                                borderRadius: '50%',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                        ></button>

                        <div className="modal-body p-0" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                            {/* Product Header */}
                            <div className="bg-light p-4 border-bottom">
                                <div className="container-fluid">
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-2" style={{ fontSize: '14px' }}>
                                            <li className="breadcrumb-item">
                                                <a href="#!" onClick={(e) => { e.preventDefault(); navigate('/customer-activities', { state: { customer } }); }}>
                                                    <FaShoppingBasket className="me-1" />
                                                    Customer Products
                                                </a>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <a href="#!" onClick={(e) => e.preventDefault()}>
                                                    {productDetails.category || 'General'}
                                                </a>
                                            </li>
                                            <li className="breadcrumb-item active" aria-current="page">
                                                {productDetails.productName || 'Product'}
                                            </li>
                                        </ol>
                                    </nav>
                                    
                                    <div className="d-flex align-items-center gap-3">
                                        <span className={`badge bg-${getStatusColor(productDetails.status)} px-3 py-2`}>
                                            {productDetails.status?.toUpperCase() || 'PENDING'}
                                        </span>
                                        <div className="text-muted small">
                                            <FaCalendarAlt className="me-1" />
                                            Ordered on {productDetails.purchaseDate || 'N/A'}
                                        </div>
                                        <div className="text-muted small">
                                            Order ID: {productDetails.orderId || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="container-fluid py-4">
                                <div className="row g-4">
                                    {/* Left Column - Product Images */}
                                    <div className="col-lg-5">
                                        <div className="sticky-top" style={{ top: '20px' }}>
                                            {/* Main Image */}
                                            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                                <div className="position-relative" style={{ paddingTop: '100%' }}>
                                                    <img 
                                                        src={getImageSource(productDetails, currentImageIndex)}
                                                        alt={productDetails.productName || 'Product'}
                                                        className="position-absolute top-0 start-0 w-100 h-100"
                                                        style={{ objectFit: 'contain', padding: '20px', backgroundColor: '#f8f9fa' }}
                                                        onError={() => handleImageError(productDetails.id, currentImageIndex)}
                                                    />
                                                    {productDetails.isCancelled && (
                                                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                                                             style={{ backgroundColor: 'rgba(255,0,0,0.1)', zIndex: 2 }}>
                                                            <div className="bg-danger text-white px-4 py-2 rounded-pill">
                                                                CANCELLED
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Thumbnail Images */}
                                            {images.length > 1 && (
                                                <div className="d-flex gap-2 mb-4">
                                                    {images.map((img, index) => (
                                                        <div 
                                                            key={index}
                                                            className={`border rounded cursor-pointer ${currentImageIndex === index ? 'border-primary border-2' : 'border-light'}`}
                                                            style={{ 
                                                                width: '60px', 
                                                                height: '60px',
                                                                overflow: 'hidden',
                                                                backgroundColor: '#f8f9fa'
                                                            }}
                                                            onClick={() => setCurrentImageIndex(index)}
                                                        >
                                                            <img 
                                                                src={getImageSource(productDetails, index)}
                                                                alt={`${productDetails.productName || 'Product'} ${index + 1}`}
                                                                className="w-100 h-100"
                                                                style={{ objectFit: 'cover' }}
                                                                onError={() => handleImageError(productDetails.id, index)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Price Box - Showing actual purchase price */}
                                            <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
                                                <div className="card-body">
                                                    <h6 className="card-title mb-3">
                                                        <strong>Purchase Details</strong>
                                                    </h6>
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-baseline">
                                                            <h3 className="text-dark fw-bold me-3" style={{ fontSize: '24px' }}>
                                                                ₹{formatPrice(price)}
                                                            </h3>
                                                            {originalPrice > price && (
                                                                <>
                                                                    <span className="text-decoration-line-through text-muted me-2" style={{ fontSize: '16px' }}>
                                                                        ₹{formatPrice(originalPrice)}
                                                                    </span>
                                                                    <span className="text-success fw-bold">
                                                                        <FaPercent className="me-1" />
                                                                        {discount}% off
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {quantity > 1 && (
                                                            <div className="mt-2">
                                                                <div className="text-muted small">Quantity: {quantity}</div>
                                                                <div className="text-dark fw-bold mt-1">
                                                                    Total: ₹{formatPrice(totalAmount)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {originalPrice > price && (
                                                            <div className="text-success">
                                                                You saved: ₹{formatPrice(originalPrice - price)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="small text-muted">
                                                        Payment Method: {productDetails.paymentMethod || 'Wallet'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Tracking */}
                                            <div className="card border-0 shadow-sm mb-4">
                                                <div className="card-body">
                                                    <h6 className="card-title d-flex align-items-center mb-3">
                                                        <FaTruck className="me-2 text-info" />
                                                        <strong>Order Tracking</strong>
                                                    </h6>
                                                    <div className="order-timeline">
                                                        {orderStatus.map((step, index) => (
                                                            <div key={index} className="timeline-step mb-3">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="timeline-icon me-3">
                                                                        {step.icon}
                                                                    </div>
                                                                    <div className="flex-grow-1">
                                                                        <div className={`fw-bold ${step.completed ? 'text-dark' : 'text-muted'}`}>
                                                                            {step.status}
                                                                        </div>
                                                                        <div className="small text-muted">{step.date}</div>
                                                                    </div>
                                                                    {step.completed && (
                                                                        <FaCheckCircle className="text-success ms-2" />
                                                                    )}
                                                                </div>
                                                                {index < orderStatus.length - 1 && (
                                                                    <div className="timeline-line">
                                                                        <div className={`vertical-line ${step.completed ? 'completed' : ''}`}></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Product Details */}
                                    <div className="col-lg-7">
                                        {/* Product Title and Brand with Price */}
                                        <div className="mb-4">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div>
                                                    <h2 className="h4 fw-bold mb-0">
                                                        {productDetails.brand?.toLowerCase() === 'apple' && (
                                                            <FaApple className="me-2 text-dark" />
                                                        )}
                                                        {productDetails.productName || 'Product Name'}
                                                    </h2>
                                                    {/* PRICE DISPLAY - Actual purchase price */}
                                                    <div className="d-flex align-items-center mt-2">
                                                        <h4 className="text-dark fw-bold me-3 mb-0">
                                                            ₹{formatPrice(price)}
                                                        </h4>
                                                        {originalPrice > price && (
                                                            <>
                                                                <span className="text-decoration-line-through text-muted me-2" style={{ fontSize: '16px' }}>
                                                                    ₹{formatPrice(originalPrice)}
                                                                </span>
                                                                <span className="text-success fw-bold">
                                                                    {discount}% off
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {quantity > 1 && (
                                                        <div className="text-dark mt-1">
                                                            <strong>Quantity: {quantity}</strong> • <strong>Total: ₹{formatPrice(totalAmount)}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    {productDetails.brand && (
                                                        <span className="badge bg-primary">{productDetails.brand}</span>
                                                    )}
                                                    <span className="badge bg-success">{productDetails.category || 'General'}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="d-flex align-items-center me-4">
                                                    <span className="bg-warning text-white px-2 py-1 rounded me-2 d-flex align-items-center">
                                                        {productDetails.rating || 0} <FaStar className="ms-1" size={12} />
                                                    </span>
                                                    <span className="text-muted small">({productDetails.reviews || 0} ratings)</span>
                                                </div>
                                                <span className="text-success small">
                                                    <FaMedal className="me-1" />
                                                    {(productDetails.reviews || 0) > 1000 ? '1K+' : (productDetails.reviews || 0)}+ bought in past month
                                                </span>
                                            </div>

                                            {/* Product Highlights */}
                                            {productDetails.highlights && productDetails.highlights.length > 0 && (
                                                <div className="card border-0 bg-light mb-4">
                                                    <div className="card-body">
                                                        <h6 className="card-title mb-3">
                                                            <strong>Product Highlights</strong>
                                                        </h6>
                                                        <div className="row g-2">
                                                            {productDetails.highlights.map((highlight, index) => (
                                                                <div key={index} className="col-12 col-md-6">
                                                                    <div className="d-flex align-items-center mb-2">
                                                                        <FaCheckCircle className="text-success me-2" size={12} />
                                                                        <span className="small">{highlight}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Order Status & Actions */}
                                            <div className="card border-0 shadow-sm mb-4">
                                                <div className="card-body">
                                                    <h6 className="card-title d-flex align-items-center mb-3">
                                                        <FaCalendarCheck className="me-2 text-primary" />
                                                        <strong>Order Status & Actions</strong>
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <div className="small text-muted">Order Date</div>
                                                                <div className="fw-bold">{productDetails.purchaseDate}</div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <div className="small text-muted">Payment Method</div>
                                                                <div className="fw-bold">{productDetails.paymentMethod}</div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <div className="small text-muted">Quantity</div>
                                                                <div className="fw-bold">{quantity}</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <div className="small text-muted">Expected Delivery</div>
                                                                <div className="fw-bold text-success">{productDetails.estimatedDelivery}</div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <div className="small text-muted">Order Status</div>
                                                                <div className={`fw-bold text-${getStatusColor(productDetails.status)}`}>
                                                                    {productDetails.status?.toUpperCase()}
                                                                </div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <div className="small text-muted">Total Amount</div>
                                                                <div className="fw-bold text-primary">₹{formatPrice(totalAmount)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                                        {productDetails.canCancel && !showCancelForm && (
                                                            <button 
                                                                className="btn btn-danger"
                                                                onClick={() => setShowCancelForm(true)}
                                                            >
                                                                <FaTimesCircle className="me-2" />
                                                                Cancel Order
                                                            </button>
                                                        )}
                                                        {isDelivered && !hasReviewed && !showReviewForm && (
                                                            <button 
                                                                className="btn btn-warning"
                                                                onClick={() => setShowReviewForm(true)}
                                                            >
                                                                <FaStar className="me-2" />
                                                                Rate & Review
                                                            </button>
                                                        )}
                                                        {hasReviewed && (
                                                            <button 
                                                                className="btn btn-success"
                                                                disabled
                                                            >
                                                                <FaCheckCircle className="me-2" />
                                                                Already Reviewed
                                                            </button>
                                                        )}
                                                    
                                                        <button 
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => {
                                                                const invoiceContent = `
                                                                    Invoice: ${productDetails.invoiceNumber}
                                                                    Order ID: ${productDetails.orderId}
                                                                    Date: ${productDetails.purchaseDate}
                                                                    Product: ${productDetails.productName}
                                                                    Unit Price: ₹${formatPrice(price)}
                                                                    Quantity: ${quantity}
                                                                    Total: ₹${formatPrice(totalAmount)}
                                                                    Status: ${productDetails.status}
                                                                    Payment Method: ${productDetails.paymentMethod}
                                                                    Customer: ${customer?.firstName || ''} ${customer?.lastName || ''}
                                                                `;
                                                                const blob = new Blob([invoiceContent], { type: 'text/plain' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `invoice-${productDetails.orderId}.txt`;
                                                                a.click();
                                                            }}
                                                        >
                                                            <FaFileInvoice className="me-2" />
                                                            Download Invoice
                                                        </button>
                                                    </div>

                                                    {/* Cancellation Form */}
                                                    {showCancelForm && (
                                                        <div className="mt-4 p-3 border rounded bg-light">
                                                            <h6 className="mb-3">
                                                                <FaExclamationCircle className="me-2 text-danger" />
                                                                Cancel Order
                                                            </h6>
                                                            <div className="mb-3">
                                                                <label className="form-label">Reason for Cancellation</label>
                                                                <select 
                                                                    className="form-select"
                                                                    value={cancellationReason}
                                                                    onChange={(e) => setCancellationReason(e.target.value)}
                                                                >
                                                                    <option value="">Select a reason</option>
                                                                    <option value="change_of_mind">Change of mind</option>
                                                                    <option value="found_better_price">Found better price elsewhere</option>
                                                                    <option value="delivery_too_long">Delivery taking too long</option>
                                                                    <option value="ordered_by_mistake">Ordered by mistake</option>
                                                                    <option value="other">Other</option>
                                                                </select>
                                                            </div>
                                                            {cancellationReason === 'other' && (
                                                                <div className="mb-3">
                                                                    <textarea 
                                                                        className="form-control"
                                                                        placeholder="Please specify reason..."
                                                                        rows="3"
                                                                        value={cancellationReason}
                                                                        onChange={(e) => setCancellationReason(e.target.value)}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="d-flex gap-2">
                                                                <button 
                                                                    className="btn btn-danger"
                                                                    onClick={handleCancelOrder}
                                                                >
                                                                    Confirm Cancellation
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => setShowCancelForm(false)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Review Form */}
                                                    {showReviewForm && (
                                                        <div className="mt-4 p-3 border rounded bg-light">
                                                            <h6 className="mb-3">
                                                                <FaStar className="me-2 text-warning" />
                                                                Rate this Product
                                                            </h6>
                                                            <div className="mb-3">
                                                                <label className="form-label">Your Rating</label>
                                                                <div className="mb-2">
                                                                    {renderStars(userRating, true, setUserRating)}
                                                                </div>
                                                            </div>
                                                            <div className="mb-3">
                                                                <label className="form-label">Your Review</label>
                                                                <textarea 
                                                                    className="form-control"
                                                                    placeholder="Share your experience with this product..."
                                                                    rows="4"
                                                                    value={reviewText}
                                                                    onChange={(e) => setReviewText(e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="d-flex gap-2">
                                                                <button 
                                                                    className="btn btn-warning"
                                                                    onClick={handleSubmitReview}
                                                                >
                                                                    Submit Review
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => setShowReviewForm(false)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Details */}
                                            <div className="card border-0 shadow-sm mb-4">
                                                <div className="card-body">
                                                    <h6 className="card-title mb-3">
                                                        <strong>Product Details</strong>
                                                    </h6>
                                                    {productDetails.description && (
                                                        <p className="mb-3">{productDetails.description}</p>
                                                    )}
                                                    
                                                    {productDetails.features && productDetails.features.length > 0 && (
                                                        <div className="mb-3">
                                                            <strong>Key Features:</strong>
                                                            <ul className="mb-0">
                                                                {productDetails.features.map((feature, index) => (
                                                                    <li key={index}>{feature}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {productDetails.specifications && Object.keys(productDetails.specifications).length > 0 && (
                                                        <div>
                                                            <strong>Specifications:</strong>
                                                            <table className="table table-sm mt-2 mb-0">
                                                                <tbody>
                                                                    {Object.entries(productDetails.specifications).map(([key, value]) => (
                                                                        <tr key={key}>
                                                                            <td className="text-muted" style={{ width: '40%' }}>{key}</td>
                                                                            <td className="fw-bold">{value}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [selectedProd, productDetails, currentImageIndex, getImageSource, handleImageError, formatPrice, calculateDiscount, orderStatus, getStatusColor, customer, navigate, showCancelForm, cancellationReason, showReviewForm, userRating, reviewText, handleCancelOrder, handleSubmitReview, renderStars]);

    if (loading) {
        return (
            <div className="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading customer products...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container-fluid bg-light min-vh-100 p-3 d-flex align-items-center justify-content-center">
                <div className="text-center py-5">
                    <FaTimesCircle className="text-danger mb-3" size={60} />
                    <h3>Customer Not Found</h3>
                    <p className="text-muted mb-4">Please select a customer first</p>
                    <button 
                        className="btn btn-primary mt-3" 
                        onClick={() => navigate('/customer-activities')}
                    >
                        Go to Customer List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-light p-0" style={{ minHeight: '100vh' }}>
            
            {/* Header - Two containers like the example */}
            <div className="mb-4 p-3">
                {/* Container for Back Button */}
                <div className="mb-3">
                    <div className=" p-3">
                        <button
                            onClick={() => navigate('/customer-activities', { state: { customer } })}
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                        >
                            <FaArrowLeft className="me-2" />
                            Back to Activities
                        </button>
                    </div>
                </div>
                
                {/* Container for Title */}
                <div className="card">
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                                <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center" 
                                     style={{ width: '50px', height: '50px' }}>
                                    <FaBox className="text-white" size={20} />
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h3 className="h1 fw-bold mb-1">
                                    Customer Products
                                </h3>
                                {customer && (
                                    <div className="text-muted small">
                                        <FaUser className="me-1" />
                                        {customer.name}  •
                                        <FaMobile className="me-1" />
                                        {customer.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card mb-4 border-0 shadow-sm">
                <div className="card-body p-2">
                    <div className="d-flex flex-wrap gap-2">
                        <button
                            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setActiveTab('all')}
                        >
                         All   {/* All ({productList.length}) */}
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'active' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setActiveTab('active')}
                        >
                            <FaClock className="me-1" />
                            Active
                            {/* Active ({productList.filter(p => {
                                const status = p?.status?.toLowerCase();
                                return status === 'active' || status === 'pending' || status === 'shipped';
                            }).length}) */}
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'cancelled' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setActiveTab('cancelled')}
                        >
                            <FaTimesCircle className="me-1" />
                        Cancelled    {/* Cancelled ({productList.filter(p => p?.status?.toLowerCase() === 'cancelled').length}) */}
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'completed' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            <FaCheckCircle className="me-1" />
                        Completed    {/* Completed ({productList.filter(p => {
                                const status = p?.status?.toLowerCase();
                                return status === 'completed' || status === 'delivered';
                            }).length}) */}
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="container-fluid p-4">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-5">
                        <FaBox className="text-muted mb-3" size={48} />
                        <h5>No products found</h5>
                        <p className="text-muted mb-3">No products match the selected filter</p>
                        <button 
                            className="btn btn-warning"
                            onClick={() => setActiveTab('all')}
                        >
                            View All Products
                        </button>
                    </div>
                ) : (
                    <div className="row">
                        {filteredProducts.map((product, index) => renderProductCard(product, index))}
                    </div>
                )}
            </div>

            {/* Product Details Modal */}
            {showProductDetails && renderProductDetails()}
        </div>
    );
};

export default CustomerProducts;