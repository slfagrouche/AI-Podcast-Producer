import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Headphones } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const [logoHover, setLogoHover] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/60 dark:bg-white/60 border-b border-gray-800/50 dark:border-gray-200/50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/"
            className="flex items-center space-x-2"
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
          >
            <div className={`p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-transform duration-300 ${logoHover ? 'rotate-12' : ''}`}>
              <Headphones size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              AI Podcast
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="nav-link">Home</Link>
            {isAuthenticated && (
              <>
                <Link to="/create" className="nav-link">Create</Link>
                <Link to="/podcasts" className="nav-link">Library</Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-800/50 dark:hover:bg-gray-200/50"
            >
              {isDarkMode ? (
                <Sun size={20} className="text-yellow-400" />
              ) : (
                <Moon size={20} className="text-indigo-300" />
              )}
            </button>
            
            {isAuthenticated ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex items-center space-x-2">
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-60' : 'max-h-0'
        } overflow-hidden`}
      >
        <div className="px-4 py-2 space-y-1 border-t border-gray-800/50 dark:border-gray-200/50">
          <Link to="/" className="block py-2">Home</Link>
          {isAuthenticated && (
            <>
              <Link to="/create" className="block py-2">Create</Link>
              <Link to="/podcasts" className="block py-2">Library</Link>
            </>
          )}
          {!isAuthenticated ? (
            <div className="flex flex-col space-y-2 py-2">
              <SignInButton mode="modal">
                <button className="w-full px-4 py-2 text-left rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full px-4 py-2 text-left rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          ) : (
            <div className="py-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;