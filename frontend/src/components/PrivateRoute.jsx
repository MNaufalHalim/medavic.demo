import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.role_id) {
      navigate('/login');
      return;
    }

    // Setup axios interceptor untuk handle 401 responses
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  return children;
};

export default PrivateRoute;