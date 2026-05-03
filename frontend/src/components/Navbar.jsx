import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, UserCircle, Bell, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Theme persistence
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'Student': return '/student';
      case 'Counselor': return '/counselor';
      case 'Staff': return '/staff';
      case 'Administrator': return '/admin';
      default: return '/login';
    }
  }

  // Only show full navbar if not on auth screens to keep auth screens clean
  if (['/login', '/register'].includes(location.pathname)) return null;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center px-6 transition-all duration-300 ${
          scrolled 
            ? 'h-14 glass-panel rounded-full border border-white/20' 
            : 'h-16'
        }`}>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-sm">SR</span>
            </div>
            <Link to={getDashboardLink()} className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800">
              Counselling
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none rounded-full transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {user ? (
              <>
                <NotificationCenter />
                
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                
                <Link to="/profile" className="flex items-center gap-3 pl-2 group transition-all">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{user.role}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-50 to-blue-50 flex items-center justify-center border border-slate-100 shadow-sm group-hover:border-blue-200 transition-all overflow-hidden p-0.5">
                    <UserCircle size={24} className="text-indigo-600 transition-transform group-hover:scale-110" />
                  </div>
                </Link>
                <button onClick={handleLogout} className="ml-2 p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all" title="Logout">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Sign in</Link>
                <Link to="/register" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
