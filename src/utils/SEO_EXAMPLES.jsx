// Example: Using SEO Component in Your Routes

import { SEO } from '../utils/SEO';

// ============================================
// HOMEPAGE EXAMPLE
// ============================================
export const HomePage = () => {
    return (
        <>
            <SEO 
                title="Lots of Happy Smiles - Your Trusted Platform for Products & Rewards"
                description="Browse premium products, earn cashback rewards, and participate in exciting lucky draws. Join our community and get exclusive deals today!"
                keywords="cashback, lucky draws, e-commerce, products, schemes, rewards, shopping, deals"
                url="http://app.lotofhappysmiles.com/"
                image="http://app.lotofhappysmiles.com/og-image.png"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "Lots of Happy Smiles",
                    "url": "http://app.lotofhappysmiles.com",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "http://app.lotofhappysmiles.com/search?q={search_term_string}",
                        "query-input": "required name=search_term_string"
                    }
                }}
            />
            {/* Your homepage content */}
        </>
    );
};

// ============================================
// PRODUCTS PAGE EXAMPLE
// ============================================
export const ProductsPage = ({ productName = null }) => {
    return (
        <>
            <SEO 
                title={productName ? `${productName} | Buy Online | Lots of Happy Smiles` : "Products | Lots of Happy Smiles"}
                description={productName ? `Shop ${productName} with amazing cashback and rewards at Lots of Happy Smiles` : "Browse our wide range of products and enjoy cashback on every purchase"}
                keywords="products, buy online, cashback, deals, shopping"
                url="http://app.lotofhappysmiles.com/products"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": "Products",
                    "url": "http://app.lotofhappysmiles.com/products"
                }}
            />
            {/* Your products page content */}
        </>
    );
};

// ============================================
// SINGLE PRODUCT PAGE EXAMPLE
// ============================================
export const ProductDetailPage = ({ product }) => {
    return (
        <>
            <SEO 
                title={`${product.name} - Buy at Best Price | Lots of Happy Smiles`}
                description={`${product.description} - Get ${product.cashback}% cashback. Price: ₹${product.price}`}
                keywords={`${product.name}, ${product.category}, cashback, buy online`}
                url={`http://app.lotofhappysmiles.com/products/${product.id}`}
                image={product.image}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": product.name,
                    "image": product.image,
                    "description": product.description,
                    "offers": {
                        "@type": "Offer",
                        "priceCurrency": "INR",
                        "price": product.price,
                        "availability": "http://schema.org/InStock"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": product.rating || 4.5,
                        "ratingCount": product.reviews || 100
                    }
                }}
            />
            {/* Your product detail content */}
        </>
    );
};

// ============================================
// MY WALLET PAGE EXAMPLE
// ============================================
export const MyWalletPage = () => {
    return (
        <>
            <SEO 
                title="My Wallet | Manage Balance & Transactions | Lots of Happy Smiles"
                description="Manage your wallet balance, track transactions, add money, and withdraw funds easily"
                keywords="wallet, balance, transactions, cashback wallet, add money"
                url="http://app.lotofhappysmiles.com/wallet"
            />
            {/* Your wallet page content */}
        </>
    );
};

// ============================================
// LUCKY DRAWS PAGE EXAMPLE
// ============================================
export const LuckyDrawsPage = () => {
    return (
        <>
            <SEO 
                title="Lucky Draws - Win Exciting Prizes | Lots of Happy Smiles"
                description="Participate in our lucky draws and win amazing prizes. Buy tickets and participate in exciting weekly and monthly draws"
                keywords="lucky draws, lottery, prizes, lotteries, win prizes"
                url="http://app.lotofhappysmiles.com/lucky-draws"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": "Lucky Draws - Lots of Happy Smiles",
                    "url": "http://app.lotofhappysmiles.com/lucky-draws"
                }}
            />
            {/* Your lucky draws content */}
        </>
    );
};

// ============================================
// CASHBACK PAGE EXAMPLE
// ============================================
export const CashbackPage = () => {
    return (
        <>
            <SEO 
                title="Cashback Rewards Program | Get Cashback on Every Purchase"
                description="Earn cashback rewards on every purchase. Track your cashback and redeem rewards easily"
                keywords="cashback, rewards, earn cashback, redemption"
                url="http://app.lotofhappysmiles.com/cashback"
            />
            {/* Your cashback content */}
        </>
    );
};

// ============================================
// SCHEMES PAGE EXAMPLE
// ============================================
export const SchemesPage = () => {
    return (
        <>
            <SEO 
                title="Exclusive Schemes & Offers | Save More | Lots of Happy Smiles"
                description="Explore our exclusive schemes and special offers to save more on your purchases"
                keywords="schemes, offers, deals, discounts, exclusive schemes"
                url="http://app.lotofhappysmiles.com/schemes"
            />
            {/* Your schemes content */}
        </>
    );
};

// ============================================
// MY ORDERS PAGE EXAMPLE
// ============================================
export const MyOrdersPage = () => {
    return (
        <>
            <SEO 
                title="My Orders | Track & Manage Orders | Lots of Happy Smiles"
                description="View and track all your orders, check delivery status, and manage returns"
                keywords="my orders, order tracking, order status, returns"
                url="http://app.lotofhappysmiles.com/my-orders"
            />
            {/* Your orders content */}
        </>
    );
};

// ============================================
// LOGIN PAGE EXAMPLE
// ============================================
export const LoginPage = () => {
    return (
        <>
            <SEO 
                title="Login | Lots of Happy Smiles"
                description="Login to your Lots of Happy Smiles account to access your wallet and orders"
                keywords="login, signin, account"
                url="http://app.lotofhappysmiles.com/login"
            />
            {/* Your login content */}
        </>
    );
};

// ============================================
// SIGNUP PAGE EXAMPLE
// ============================================
export const SignupPage = () => {
    return (
        <>
            <SEO 
                title="Sign Up | Create Account | Lots of Happy Smiles"
                description="Create a new account and join our community to enjoy exclusive benefits and rewards"
                keywords="signup, register, create account, join"
                url="http://app.lotofhappysmiles.com/signup"
            />
            {/* Your signup content */}
        </>
    );
};
