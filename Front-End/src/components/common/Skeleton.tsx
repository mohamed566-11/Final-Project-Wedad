import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    className?: string;
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    animation = 'wave',
}) => {
    const style: React.CSSProperties = {
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'text' ? '1em' : undefined),
    };

    return (
        <div
            className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-card">
                <Skeleton variant="rectangular" height={180} />
                <div className="skeleton-card-body">
                    <Skeleton variant="text" height={24} width="70%" />
                    <Skeleton variant="text" height={16} width="50%" />
                    <div className="skeleton-card-footer">
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="text" height={14} width="30%" />
                    </div>
                </div>
            </div>
        ))}
    </>
);

// Doctor Card Skeleton
export const DoctorCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-doctor-card">
                <div className="skeleton-doctor-header">
                    <Skeleton variant="circular" width={100} height={100} />
                </div>
                <div className="skeleton-doctor-body">
                    <Skeleton variant="text" height={24} width="60%" />
                    <Skeleton variant="text" height={18} width="40%" />
                    <div className="skeleton-row">
                        <Skeleton variant="text" height={14} width="30%" />
                        <Skeleton variant="text" height={14} width="30%" />
                    </div>
                    <Skeleton variant="rectangular" height={44} className="skeleton-btn" />
                </div>
            </div>
        ))}
    </>
);

// Article Card Skeleton
export const ArticleCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-article-card">
                <Skeleton variant="rectangular" height={160} className="skeleton-article-img" />
                <div className="skeleton-article-content">
                    <Skeleton variant="text" height={12} width="30%" />
                    <Skeleton variant="text" height={20} width="90%" />
                    <Skeleton variant="text" height={20} width="75%" />
                    <Skeleton variant="text" height={14} width="100%" />
                    <Skeleton variant="text" height={14} width="80%" />
                </div>
            </div>
        ))}
    </>
);

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => (
    <div className="skeleton-profile">
        <div className="skeleton-profile-header">
            <Skeleton variant="circular" width={120} height={120} />
            <div className="skeleton-profile-info">
                <Skeleton variant="text" height={28} width="200px" />
                <Skeleton variant="text" height={18} width="150px" />
            </div>
        </div>
        <div className="skeleton-profile-stats">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-stat">
                    <Skeleton variant="text" height={24} width="60px" />
                    <Skeleton variant="text" height={14} width="80px" />
                </div>
            ))}
        </div>
    </div>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4,
}) => (
    <div className="skeleton-table">
        <div className="skeleton-table-header">
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} variant="text" height={16} />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="skeleton-table-row">
                {Array.from({ length: cols }).map((_, colIdx) => (
                    <Skeleton key={colIdx} variant="text" height={14} />
                ))}
            </div>
        ))}
    </div>
);

// Hero Skeleton
export const HeroSkeleton: React.FC = () => (
    <div className="skeleton-hero">
        <Skeleton variant="text" height={48} width="70%" />
        <Skeleton variant="text" height={28} width="50%" />
        <Skeleton variant="text" height={20} width="60%" />
        <div className="skeleton-hero-buttons">
            <Skeleton variant="rounded" height={50} width={160} />
            <Skeleton variant="rounded" height={50} width={140} />
        </div>
    </div>
);

export default Skeleton;
