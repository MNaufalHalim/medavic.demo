import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.name === 'username' 
      ? e.target.value.toUpperCase().replace(/\s/g, '')
      : e.target.value;
    
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.apiUrl}/auth/login`, formData);
      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token, user, menus } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('permissions', JSON.stringify(menus));

        console.log('Stored menus:', menus);

        const firstMenu = menus && menus.length > 0 ? menus[0] : null;
        console.log('First accessible menu:', firstMenu);

        if (firstMenu && firstMenu.menu_path) {
          console.log('Navigating to:', firstMenu.menu_path);
          navigate(firstMenu.menu_path);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('Username atau Password salah');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server');
      }
    } finally {
      setLoading(false);
    }
  }; // Removed extra closing brace here

  return (
    <div className='h-screen w-screen flex bg-white'>
      {/* Left Side - Login Form */}
      <div className="w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-lg">
        <svg width="170" height="123" viewBox="0 0 486 123" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M425.79 0L433.403 13.1874H433.43L433.746 13.7352L441.079 26.437L441.082 26.4332L448.093 38.5697L441.079 50.7174L433.466 37.5299H433.439L425.79 24.2803L418.14 37.5299L404.122 37.5299L404.125 37.5247L387 37.5247L391.932 25.7711L410.891 25.8051L425.79 0ZM457.09 22.9863L451.429 13.1874L462.747 13.1874L457.09 22.9863Z" fill="#14967F"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M463.983 25.7713L461.028 20.6524L466.023 12.1482L458.871 0.425009L454.1 8.65276L449.104 0L440.995 14.0459L454.553 37.5299L470.772 37.5299L470.759 37.5064L481.068 37.5249L486 25.7713L463.983 25.7713Z" fill="#095D7E"/>
          <path d="M46.8125 53.2499L59.375 53.2499L65.8906 100.594L88.8594 53.2499L102.453 53.2499L68.1406 121.5L57.5 121.5L46.8125 53.2499ZM38.6094 53.2499L52.1563 53.2499L45.5 106.266L42.8281 121.5L26.7969 121.5L38.6094 53.2499ZM96.5 53.2499L110.141 53.2499L98.3281 121.5L82.2031 121.5L85.1094 104.906L96.5 53.2499ZM156.313 108.844L154.109 121.5L118.719 121.5L120.922 108.844L156.313 108.844ZM136.344 53.2499L124.484 121.5L108.453 121.5L120.266 53.2499L136.344 53.2499ZM156.688 80.3436L154.578 92.578L123.734 92.578L125.891 80.3436L156.688 80.3436ZM166.063 53.2499L163.859 65.953L128.328 65.953L130.578 53.2499L166.063 53.2499ZM182.984 121.5L167.375 121.5L169.672 108.844L183.5 108.937C187.406 108.937 190.625 107.969 193.156 106.031C195.719 104.094 197.703 101.578 199.109 98.4843C200.547 95.3905 201.516 92.1249 202.016 88.6874L202.344 85.7811C202.625 83.7186 202.75 81.5624 202.719 79.3124C202.688 77.0311 202.359 74.9061 201.734 72.9374C201.109 70.9686 200.047 69.3436 198.547 68.0624C197.078 66.7811 195.016 66.0936 192.359 65.9999L176.75 65.953L178.953 53.2499L192.875 53.2968C197.438 53.3905 201.438 54.328 204.875 56.1093C208.313 57.8593 211.141 60.2499 213.359 63.2811C215.578 66.2811 217.141 69.7186 218.047 73.5936C218.953 77.4686 219.156 81.5468 218.656 85.828L218.328 88.7811C217.734 93.3436 216.453 97.6249 214.484 101.625C212.516 105.594 209.984 109.078 206.891 112.078C203.797 115.047 200.219 117.375 196.156 119.062C192.125 120.719 187.734 121.531 182.984 121.5ZM188.469 53.2499L176.609 121.5L160.578 121.5L172.391 53.2499L188.469 53.2499Z" fill="#14967F"/>
          <path d="M257.188 68.3905L232.063 121.5L214.297 121.5L250.484 53.2499L261.828 53.2499L257.188 68.3905ZM261.5 121.5L254.563 66.7499L254.938 53.2499L265.625 53.2499L278.234 121.5L261.5 121.5ZM265.156 96.0468L262.906 108.75L228.828 108.75L231.078 96.0468L265.156 96.0468ZM307.766 104.766L329.422 53.2499L347.844 53.2499L314.797 121.5L302.844 121.5L307.766 104.766ZM303.219 53.2499L308.938 106.219L308.75 121.5L297.313 121.5L285.781 53.2499L303.219 53.2499ZM370.109 53.2499L358.297 121.5L342.266 121.5L354.125 53.2499L370.109 53.2499ZM410.656 98.4374L426.359 98.2499C425.922 103.437 424.25 107.859 421.344 111.516C418.469 115.141 414.828 117.891 410.422 119.766C406.047 121.641 401.375 122.531 396.406 122.437C391.688 122.344 387.719 121.375 384.5 119.531C381.281 117.656 378.75 115.156 376.906 112.031C375.063 108.875 373.844 105.344 373.25 101.437C372.656 97.4999 372.625 93.4374 373.156 89.2499L373.672 85.5468C374.297 81.203 375.453 77.0311 377.141 73.0311C378.828 68.9999 381.031 65.4061 383.75 62.2499C386.5 59.0936 389.766 56.6249 393.547 54.8436C397.328 53.0311 401.609 52.1718 406.391 52.2655C411.484 52.3593 415.813 53.4218 419.375 55.453C422.969 57.4843 425.75 60.328 427.719 63.9843C429.719 67.6405 430.844 71.953 431.094 76.9218L415.109 76.8749C415.203 74.4686 414.969 72.4061 414.406 70.6874C413.844 68.9686 412.844 67.6405 411.406 66.703C410 65.7343 408.016 65.203 405.453 65.1093C402.672 65.0155 400.344 65.5936 398.469 66.8436C396.625 68.0624 395.125 69.703 393.969 71.7655C392.813 73.828 391.922 76.0624 391.297 78.4686C390.703 80.8749 390.25 83.203 389.938 85.453L389.469 89.2968C389.25 91.1405 389.047 93.2186 388.859 95.5311C388.672 97.8124 388.75 100.016 389.094 102.141C389.438 104.234 390.234 105.984 391.484 107.391C392.734 108.797 394.688 109.547 397.344 109.641C399.844 109.703 402.016 109.312 403.859 108.469C405.703 107.594 407.188 106.312 408.313 104.625C409.469 102.906 410.25 100.844 410.656 98.4374Z" fill="#095D7E"/>
          </svg>

          
          <p className=" text-5xl font-bold text-gray-900 mb-16">Login to Your Account</p>
      
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
      
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === ' ') e.preventDefault();
                }}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase placeholder:capitalize"
                placeholder="Username"
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Password"
              />
            </div>
      
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 mt-8 rounded-md text-white font-medium transition-colors
                ${loading ? 'bg-emerald-400' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Right Side - Green Background */}
      <div className="w-1/2 bg-emerald-500 flex flex-col items-center justify-center text-white p-8">
        <h2 className="text-4xl font-bold mb-4">New Here?</h2>
        <p className="text-center mb-8 text-lg">
          Sign up and discover a great amount of new opportunities!
        </p>
        <button className="px-8 py-3 rounded-full border-2 border-white text-white hover:bg-white hover:text-emerald-500 transition-colors">
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login;