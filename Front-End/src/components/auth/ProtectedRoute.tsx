import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/common/Loading';
import { UserType, ROUTES } from '@/utils/constants';

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerification?: boolean;
  allowedUserTypes?: UserType[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerification = true,
  allowedUserTypes = []
}) => {
  const { isAuthenticated, isVerified, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/patient')) {
      return <Navigate to="/patient/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/doctor')) {
      return <Navigate to="/doctor/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/patient/login" state={{ from: location }} replace />;
  }

  if (allowedUserTypes.length > 0 && userType && !allowedUserTypes.includes(userType)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (requireVerification && !isVerified && userType !== 'admin' && userType !== 'doctor') {
    return <Navigate to={ROUTES.VERIFY_EMAIL} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
