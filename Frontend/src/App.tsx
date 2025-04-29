import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CreatePodcastPage from './pages/CreatePodcastPage';
import PodcastListPage from './pages/PodcastListPage';
import PodcastDetailsPage from './pages/PodcastDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import HealthIndicator from './components/common/HealthIndicator';

// Protected route wrapper using Clerk
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 dark:from-gray-100 dark:to-white text-white dark:text-gray-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route 
                  path="/create" 
                  element={
                    <ProtectedRoute>
                      <CreatePodcastPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/podcasts" 
                  element={
                    <ProtectedRoute>
                      <PodcastListPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/podcasts/:podcastId" 
                  element={
                    <ProtectedRoute>
                      <PodcastDetailsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <HealthIndicator />
          </div>
          <Toaster position="bottom-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;