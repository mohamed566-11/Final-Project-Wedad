import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholder?: string;
    aspectRatio?: string;
    onLoad?: () => void;
    onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = '',
    placeholder,
    aspectRatio,
    onLoad,
    onError,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '100px', // Start loading 100px before entering viewport
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    // Generate blur placeholder from solid color
    const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23e2e8f0" width="1" height="1"/%3E%3C/svg%3E';

    return (
        <div
            ref={imgRef}
            className={`lazy-image-container ${className} ${isLoaded ? 'loaded' : ''}`}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {/* Placeholder/Skeleton */}
            {!isLoaded && !hasError && (
                <div className="lazy-image-placeholder">
                    <div className="skeleton-shimmer"></div>
                </div>
            )}

            {/* Error Fallback */}
            {hasError && (
                <div className="lazy-image-error">
                    <span>📷</span>
                </div>
            )}

            {/* Actual Image */}
            {isInView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`lazy-image ${isLoaded ? 'visible' : ''}`}
                    loading="lazy"
                    decoding="async"
                />
            )}
        </div>
    );
};

export default LazyImage;
