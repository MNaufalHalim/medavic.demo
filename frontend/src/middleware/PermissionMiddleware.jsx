import { Navigate } from 'react-router-dom';

export const PermissionMiddleware = ({ children, requiredPermission }) => {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const hasPermission = permissions.some(p => 
    p.menuPath === window.location.pathname && p[requiredPermission]
  );

  if (!hasPermission) {
    return <Navigate to="/403" />;
  }

  return children;
};

export const withPermission = (Component, requiredPermission) => {
  return (props) => (
    <PermissionMiddleware requiredPermission={requiredPermission}>
      <Component {...props} />
    </PermissionMiddleware>
  );
};