import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Mic, Sparkles, Radio, ChevronRight, Disc } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-bottom');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    document.querySelectorAll('.animate-on-scroll').forEach(section => {
      observer.observe(section);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 dark:from-indigo-200 dark:to-purple-200 py-16 px-6 text-center shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            AI <span className="text-purple-400 dark:text-purple-600">Podcast</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-delay-1">
            Create engaging podcasts with AI
          </p>
          <Button 
            size="lg" 
            onClick={() => isAuthenticated ? navigate('/create') : navigate('/login')}
            className="animate-fade-in-delay-2"
          >
            {isAuthenticated ? 'Create' : 'Start'} <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
        
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-purple-600/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -left-24 -top-24 w-96 h-96 bg-indigo-600/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </section>
      
      {/* Features */}
      <section className="animate-on-scroll opacity-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-gray-800/30 dark:bg-gray-200/30 border border-gray-700/50 dark:border-gray-300/50 hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="p-3 rounded-full bg-indigo-900/30 dark:bg-indigo-100/30 w-fit mb-4">
                <feature.icon size={24} className="text-indigo-400 dark:text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            </div>
          ))}
        </div>
      </section>
      
      {/* Demo Section */}
      <section className="animate-on-scroll opacity-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Create Effortlessly</h2>
            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Sparkles size={16} className="text-purple-400 dark:text-purple-600 mt-1 mr-2" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => isAuthenticated ? navigate('/create') : navigate('/login')}>
              {isAuthenticated ? 'Create' : 'Start'}
            </Button>
          </div>
          
          <div className="relative">
            <div className="rounded-xl overflow-hidden border-2 border-indigo-500/20 shadow-2xl">
              <img 
                src="https://images.pexels.com/photos/3756770/pexels-photo-3756770.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Studio setup" 
                className="w-full object-cover aspect-video"
              />
            </div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-indigo-500/20 rounded-lg blur-xl"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-lg blur-xl"></div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="animate-on-scroll opacity-0 mb-20">
        <div className="relative text-center bg-gradient-to-r from-indigo-900/30 to-purple-900/30 dark:from-indigo-100/30 dark:to-purple-100/30 rounded-xl p-20 overflow-hidden">
          {/* Spinning Disc Animation */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 group">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-20 animate-ping"></div>
              <Disc 
                size={128} 
                className="absolute inset-0 text-indigo-400 dark:text-indigo-600 animate-spin-slow transform group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
          
          <div className="relative z-10 mt-12">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              Ready to Create?
            </h2>
            <p className="text-xl mb-8 text-gray-300 dark:text-gray-700">
              Transform your ideas into engaging podcasts
            </p>
            <Button 
              size="lg"
              onClick={() => isAuthenticated ? navigate('/create') : navigate('/login')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <span className="flex items-center">
                <Radio size={20} className="mr-2 animate-pulse" />
                {isAuthenticated ? 'Open Studio' : 'Get Started'}
              </span>
            </Button>
          </div>
          
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: Mic,
    title: 'Choose Topics',
  },
  {
    icon: Headphones,
    title: 'Select Voices',
  },
  {
    icon: Radio,
    title: 'Generate',
  },
  {
    icon: Sparkles,
    title: 'Share',
  }
];

const benefits = [
  'Save hours of content creation time',
  'Professional quality audio',
  'Stay updated with industry news',
  'Consistent delivery',
  'No recording needed'
];

export default HomePage;