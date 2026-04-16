import { Helmet } from 'react-helmet-async';

/**
 * SEO Configuration Hook
 * Use this hook to set dynamic page titles and meta tags
 * 
 * @param {Object} config - SEO configuration object
 * @param {string} config.title - Page title
 * @param {string} config.description - Meta description
 * @param {string} config.keywords - Meta keywords
 * @param {string} config.url - Canonical URL
 * @param {string} config.image - OG image URL
 * @param {Object} config.schema - JSON-LD schema object
 */
export const useSEO = (config = {}) => {
    const {
        title = 'Lots of Happy Smiles - Your Trusted Platform',
        description = 'Browse products, earn cashback, and participate in lucky draws. Join our community and get exclusive deals today!',
        keywords = 'cashback, lucky draws, e-commerce, products, schemes, rewards',
        url = 'http://app.lotofhappysmiles.com/',
        image = 'http://app.lotofhappysmiles.com/image.png',
        schema = null
    } = config;

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            
            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image} />
            
            {/* Twitter */}
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
            
            {/* Canonical */}
            <link rel="canonical" href={url} />
            
            {/* Schema.org */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

/**
 * SEO Component for rendering SEO meta tags
 * 
 * Usage:
 * <SEO 
 *   title="Products" 
 *   description="Browse our products"
 *   url="http://app.lotofhappysmiles.com/products"
 * />
 */
export const SEO = ({
    title = 'Lots of Happy Smiles',
    description = 'Browse products, earn cashback, and participate in lucky draws',
    keywords = 'cashback, lucky draws, products',
    url = 'http://app.lotofhappysmiles.com/',
    image = 'http://app.lotofhappysmiles.com/og-image.png',
    author = 'Lots of Happy Smiles',
    publishedDate = null,
    updatedDate = null,
    schema = null
}) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />
            
            {/* Open Graph / Social Media */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="Lots of Happy Smiles" />
            
            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            
            {/* Canonical URL */}
            <link rel="canonical" href={url} />
            
            {/* Article Meta Tags */}
            {publishedDate && (
                <meta property="article:published_time" content={publishedDate} />
            )}
            {updatedDate && (
                <meta property="article:modified_time" content={updatedDate} />
            )}
            
            {/* Schema.org Structured Data */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
