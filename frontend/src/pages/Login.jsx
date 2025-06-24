import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false
  });

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('medavic_credentials');
    if (savedCredentials) {
      try {
        const { username, password, rememberMe: savedRememberMe } = JSON.parse(savedCredentials);
        if (savedRememberMe) {
          setFormData({ username, password });
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
        localStorage.removeItem('medavic_credentials');
      }
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.name === 'username' 
      ? e.target.value.toUpperCase().replace(/\s/g, '')
      : e.target.value;
    
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
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

        // Save credentials if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem('medavic_credentials', JSON.stringify({
            username: formData.username,
            password: formData.password,
            rememberMe: true
          }));
        } else {
          // Remove saved credentials if "Remember Me" is unchecked
          localStorage.removeItem('medavic_credentials');
        }

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Side - Login Form */}
          <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-4">
                  <svg width="100" height="32" viewBox="0 0 486 123" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M425.79 0L433.403 13.1874H433.43L433.746 13.7352L441.079 26.437L441.082 26.4332L448.093 38.5697L441.079 50.7174L433.466 37.5299H433.439L425.79 24.2803L418.14 37.5299L404.122 37.5299L404.125 37.5247L387 37.5247L391.932 25.7711L410.891 25.8051L425.79 0ZM457.09 22.9863L451.429 13.1874L462.747 13.1874L457.09 22.9863Z" fill="white"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M463.983 25.7713L461.028 20.6524L466.023 12.1482L458.871 0.425009L454.1 8.65276L449.104 0L440.995 14.0459L454.553 37.5299L470.772 37.5299L470.759 37.5064L481.068 37.5249L486 25.7713L463.983 25.7713Z" fill="white"/>
                    <path d="M46.8125 53.2499L59.375 53.2499L65.8906 100.594L88.8594 53.2499L102.453 53.2499L68.1406 121.5L57.5 121.5L46.8125 53.2499ZM38.6094 53.2499L52.1563 53.2499L45.5 106.266L42.8281 121.5L26.7969 121.5L38.6094 53.2499ZM96.5 53.2499L110.141 53.2499L98.3281 121.5L82.2031 121.5L85.1094 104.906L96.5 53.2499ZM156.313 108.844L154.109 121.5L118.719 121.5L120.922 108.844L156.313 108.844ZM136.344 53.2499L124.484 121.5L108.453 121.5L120.266 53.2499L136.344 53.2499ZM156.688 80.3436L154.578 92.578L123.734 92.578L125.891 80.3436L156.688 80.3436ZM166.063 53.2499L163.859 65.953L128.328 65.953L130.578 53.2499L166.063 53.2499ZM182.984 121.5L167.375 121.5L169.672 108.844L183.5 108.937C187.406 108.937 190.625 107.969 193.156 106.031C195.719 104.094 197.703 101.578 199.109 98.4843C200.547 95.3905 201.516 92.1249 202.016 88.6874L202.344 85.7811C202.625 83.7186 202.75 81.5624 202.719 79.3124C202.688 77.0311 202.359 74.9061 201.734 72.9374C201.109 70.9686 200.047 69.3436 198.547 68.0624C197.078 66.7811 195.016 66.0936 192.359 65.9999L176.75 65.953L178.953 53.2499L192.875 53.2968C197.438 53.3905 201.438 54.328 204.875 56.1093C208.313 57.8593 211.141 60.2499 213.359 63.2811C215.578 66.2811 217.141 69.7186 218.047 73.5936C218.953 77.4686 219.156 81.5468 218.656 85.828L218.328 88.7811C217.734 93.3436 216.453 97.6249 214.484 101.625C212.516 105.594 209.984 109.078 206.891 112.078C203.797 115.047 200.219 117.375 196.156 119.062C192.125 120.719 187.734 121.531 182.984 121.5ZM188.469 53.2499L176.609 121.5L160.578 121.5L172.391 53.2499L188.469 53.2499Z" fill="white"/>
                    <path d="M257.188 68.3905L232.063 121.5L214.297 121.5L250.484 53.2499L261.828 53.2499L257.188 68.3905ZM261.5 121.5L254.563 66.7499L254.938 53.2499L265.625 53.2499L278.234 121.5L261.5 121.5ZM265.156 96.0468L262.906 108.75L228.828 108.75L231.078 96.0468L265.156 96.0468ZM307.766 104.766L329.422 53.2499L347.844 53.2499L314.797 121.5L302.844 121.5L307.766 104.766ZM303.219 53.2499L308.938 106.219L308.75 121.5L297.313 121.5L285.781 53.2499L303.219 53.2499ZM370.109 53.2499L358.297 121.5L342.266 121.5L354.125 53.2499L370.109 53.2499ZM410.656 98.4374L426.359 98.2499C425.922 103.437 424.25 107.859 421.344 111.516C418.469 115.141 414.828 117.891 410.422 119.766C406.047 121.641 401.375 122.531 396.406 122.437C391.688 122.344 387.719 121.375 384.5 119.531C381.281 117.656 378.75 115.156 376.906 112.031C375.063 108.875 373.844 105.344 373.25 101.437C372.656 97.4999 372.625 93.4374 373.156 89.2499L373.672 85.5468C374.297 81.203 375.453 77.0311 377.141 73.0311C378.828 68.9999 381.031 65.4061 383.75 62.2499C386.5 59.0936 389.766 56.6249 393.547 54.8436C397.328 53.0311 401.609 52.1718 406.391 52.2655C411.484 52.3593 415.813 53.4218 419.375 55.453C422.969 57.4843 425.75 60.328 427.719 63.9843C429.719 67.6405 430.844 71.953 431.094 76.9218L415.109 76.8749C415.203 74.4686 414.969 72.4061 414.406 70.6874C413.844 68.9686 412.844 67.6405 411.406 66.703C410 65.7343 408.016 65.203 405.453 65.1093C402.672 65.0155 400.344 65.5936 398.469 66.8436C396.625 68.0624 395.125 69.703 393.969 71.7655C392.813 73.828 391.922 76.0624 391.297 78.4686C390.703 80.8749 390.25 83.203 389.938 85.453L389.469 89.2968C389.25 91.1405 389.047 93.2186 388.859 95.5311C388.672 97.8124 388.75 100.016 389.094 102.141C389.438 104.234 390.234 105.984 391.484 107.391C392.734 108.797 394.688 109.547 397.344 109.641C399.844 109.703 402.016 109.312 403.859 108.469C405.703 107.594 407.188 106.312 408.313 104.625C409.469 102.906 410.25 100.844 410.656 98.4374Z" fill="white"/>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h1>
                <p className="text-gray-600">Masuk ke akun MEDAVIC Anda</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                  <span className="text-red-700 text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className={`h-5 w-5 ${isFocused.username ? 'text-emerald-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => handleFocus('username')}
                      onBlur={() => handleBlur('username')}
                      onKeyDown={(e) => {
                        if (e.key === ' ') e.preventDefault();
                      }}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                        isFocused.username 
                          ? 'border-emerald-500 bg-white shadow-lg' 
                          : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                      } placeholder-gray-400 uppercase`}
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 ${isFocused.password ? 'text-emerald-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                        isFocused.password 
                          ? 'border-emerald-500 bg-white shadow-lg' 
                          : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                      } placeholder-gray-400`}
                      placeholder="Masukkan password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <span>Masuk</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500">atau</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <button className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                    Hubungi admin
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Section */}
          <div className="flex-1 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-8 lg:p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10 text-center max-w-md">
              {/* <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div> */}
              
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center">
              <svg width="200" height="50" viewBox="0 0 486 123" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M425.79 0L433.403 13.1874H433.43L433.746 13.7352L441.079 26.437L441.082 26.4332L448.093 38.5697L441.079 50.7174L433.466 37.5299H433.439L425.79 24.2803L418.14 37.5299L404.122 37.5299L404.125 37.5247L387 37.5247L391.932 25.7711L410.891 25.8051L425.79 0ZM457.09 22.9863L451.429 13.1874L462.747 13.1874L457.09 22.9863Z" fill="white"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M463.983 25.7713L461.028 20.6524L466.023 12.1482L458.871 0.425009L454.1 8.65276L449.104 0L440.995 14.0459L454.553 37.5299L470.772 37.5299L470.759 37.5064L481.068 37.5249L486 25.7713L463.983 25.7713Z" fill="white"/>
                    <path d="M46.8125 53.2499L59.375 53.2499L65.8906 100.594L88.8594 53.2499L102.453 53.2499L68.1406 121.5L57.5 121.5L46.8125 53.2499ZM38.6094 53.2499L52.1563 53.2499L45.5 106.266L42.8281 121.5L26.7969 121.5L38.6094 53.2499ZM96.5 53.2499L110.141 53.2499L98.3281 121.5L82.2031 121.5L85.1094 104.906L96.5 53.2499ZM156.313 108.844L154.109 121.5L118.719 121.5L120.922 108.844L156.313 108.844ZM136.344 53.2499L124.484 121.5L108.453 121.5L120.266 53.2499L136.344 53.2499ZM156.688 80.3436L154.578 92.578L123.734 92.578L125.891 80.3436L156.688 80.3436ZM166.063 53.2499L163.859 65.953L128.328 65.953L130.578 53.2499L166.063 53.2499ZM182.984 121.5L167.375 121.5L169.672 108.844L183.5 108.937C187.406 108.937 190.625 107.969 193.156 106.031C195.719 104.094 197.703 101.578 199.109 98.4843C200.547 95.3905 201.516 92.1249 202.016 88.6874L202.344 85.7811C202.625 83.7186 202.75 81.5624 202.719 79.3124C202.688 77.0311 202.359 74.9061 201.734 72.9374C201.109 70.9686 200.047 69.3436 198.547 68.0624C197.078 66.7811 195.016 66.0936 192.359 65.9999L176.75 65.953L178.953 53.2499L192.875 53.2968C197.438 53.3905 201.438 54.328 204.875 56.1093C208.313 57.8593 211.141 60.2499 213.359 63.2811C215.578 66.2811 217.141 69.7186 218.047 73.5936C218.953 77.4686 219.156 81.5468 218.656 85.828L218.328 88.7811C217.734 93.3436 216.453 97.6249 214.484 101.625C212.516 105.594 209.984 109.078 206.891 112.078C203.797 115.047 200.219 117.375 196.156 119.062C192.125 120.719 187.734 121.531 182.984 121.5ZM188.469 53.2499L176.609 121.5L160.578 121.5L172.391 53.2499L188.469 53.2499Z" fill="white"/>
                    <path d="M257.188 68.3905L232.063 121.5L214.297 121.5L250.484 53.2499L261.828 53.2499L257.188 68.3905ZM261.5 121.5L254.563 66.7499L254.938 53.2499L265.625 53.2499L278.234 121.5L261.5 121.5ZM265.156 96.0468L262.906 108.75L228.828 108.75L231.078 96.0468L265.156 96.0468ZM307.766 104.766L329.422 53.2499L347.844 53.2499L314.797 121.5L302.844 121.5L307.766 104.766ZM303.219 53.2499L308.938 106.219L308.75 121.5L297.313 121.5L285.781 53.2499L303.219 53.2499ZM370.109 53.2499L358.297 121.5L342.266 121.5L354.125 53.2499L370.109 53.2499ZM410.656 98.4374L426.359 98.2499C425.922 103.437 424.25 107.859 421.344 111.516C418.469 115.141 414.828 117.891 410.422 119.766C406.047 121.641 401.375 122.531 396.406 122.437C391.688 122.344 387.719 121.375 384.5 119.531C381.281 117.656 378.75 115.156 376.906 112.031C375.063 108.875 373.844 105.344 373.25 101.437C372.656 97.4999 372.625 93.4374 373.156 89.2499L373.672 85.5468C374.297 81.203 375.453 77.0311 377.141 73.0311C378.828 68.9999 381.031 65.4061 383.75 62.2499C386.5 59.0936 389.766 56.6249 393.547 54.8436C397.328 53.0311 401.609 52.1718 406.391 52.2655C411.484 52.3593 415.813 53.4218 419.375 55.453C422.969 57.4843 425.75 60.328 427.719 63.9843C429.719 67.6405 430.844 71.953 431.094 76.9218L415.109 76.8749C415.203 74.4686 414.969 72.4061 414.406 70.6874C413.844 68.9686 412.844 67.6405 411.406 66.703C410 65.7343 408.016 65.203 405.453 65.1093C402.672 65.0155 400.344 65.5936 398.469 66.8436C396.625 68.0624 395.125 69.703 393.969 71.7655C392.813 73.828 391.922 76.0624 391.297 78.4686C390.703 80.8749 390.25 83.203 389.938 85.453L389.469 89.2968C389.25 91.1405 389.047 93.2186 388.859 95.5311C388.672 97.8124 388.75 100.016 389.094 102.141C389.438 104.234 390.234 105.984 391.484 107.391C392.734 108.797 394.688 109.547 397.344 109.641C399.844 109.703 402.016 109.312 403.859 108.469C405.703 107.594 407.188 106.312 408.313 104.625C409.469 102.906 410.25 100.844 410.656 98.4374Z" fill="white"/>
                  </svg>
              </h2>
              <p className="text-lg mb-8 text-emerald-100 leading-relaxed">
                Kelola data pasien, jadwal dokter, dan administrasi rumah sakit dengan mudah dan efisien
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-200" size={20} />
                  <span className="text-emerald-100">Manajemen data pasien terintegrasi</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-200" size={20} />
                  <span className="text-emerald-100">Jadwal dokter yang fleksibel</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-200" size={20} />
                  <span className="text-emerald-100">Laporan keuangan real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;