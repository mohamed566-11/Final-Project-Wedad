import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article';
    keywords?: string[];
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
}

const SEO = ({
    title,
    description = 'منصة وداد - رفيقك الصحي في كل مراحل حياتك',
    image = '/og-image.jpg',
    type = 'website',
    keywords = [],
    author,
    publishedTime,
    modifiedTime
}: SEOProps) => {
    const siteName = 'منصة وداد الصحية';
    const fullTitle = `${title} | ${siteName}`;
    const currentUrl = window.location.href;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={['صحة المرأة', 'حمل', 'ولادة', 'أطفال', 'زواج', ...keywords].join(', ')} />
            <meta name="author" content={author || siteName} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="ar_SA" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Article Specific */}
            {type === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {type === 'article' && modifiedTime && (
                <meta property="article:modified_time" content={modifiedTime} />
            )}
            {type === 'article' && author && (
                <meta property="article:author" content={author} />
            )}
        </Helmet>
    );
};

export default SEO;
