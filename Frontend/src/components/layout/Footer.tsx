import React from 'react';
import { Github, Linkedin, Headphones } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 border-t border-gray-800 dark:border-gray-200 bg-gray-900/60 dark:bg-white/60 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">
                <Headphones size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                AI Podcast Producer
              </span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Transform articles into engaging podcasts using AI technology.
            </p>
          </div>
          
          {/* Connect */}
          <div className="col-span-1">
            <h3 className="font-semibold text-lg mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/slfagrouche" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 dark:text-gray-600 hover:text-indigo-400 dark:hover:text-indigo-600 transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a 
                href="https://www.linkedin.com/in/saidlfagrouche/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 dark:text-gray-600 hover:text-indigo-400 dark:hover:text-indigo-600 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          {/* AI Safety Notice */}
          <div className="col-span-1">
            <h3 className="font-semibold text-lg mb-4">AI Safety Notice</h3>
            <div className="text-sm text-gray-400 dark:text-gray-600 space-y-2">
              <p>
                This application uses AI to generate content. While we strive for accuracy, 
                AI-generated content may contain inaccuracies or biases.
              </p>
              <p>
                Users are responsible for reviewing and verifying generated content 
                before publication or distribution.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-800 dark:border-gray-200 text-center text-sm text-gray-400 dark:text-gray-600">
          <p>© {new Date().getFullYear()} AI Podcast Producer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;