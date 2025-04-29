import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { healthApi } from '../../services/api';

interface HealthStatus {
  status: string;
  version: string;
}

const HealthIndicator: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await healthApi.check();
        setHealth(response.data);
      } catch (error) {
        console.error('Health check failed:', error);
        // In development, show as healthy even if the API is not available
        if (import.meta.env.DEV) {
          setHealth({ status: 'healthy', version: 'dev' });
        } else {
          setHealth({ status: 'unhealthy', version: 'unknown' });
        }
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    
    // Schedule periodic health checks
    const healthInterval = setInterval(checkHealth, 60000); // Every minute
    
    return () => clearInterval(healthInterval);
  }, []);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="p-2 rounded-full bg-gray-800 dark:bg-gray-200 shadow-lg animate-pulse">
          <Activity size={16} className="text-gray-400 dark:text-gray-600" />
        </div>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setExpanded(!expanded)}
        className={`p-2 rounded-full ${
          isHealthy 
            ? 'bg-green-900/70 dark:bg-green-100/70' 
            : 'bg-red-900/70 dark:bg-red-100/70'
        } shadow-lg transition-all duration-300 hover:scale-110`}
        aria-label="API Health Status"
      >
        <Activity 
          size={16} 
          className={`${
            isHealthy 
              ? 'text-green-400 dark:text-green-600' 
              : 'text-red-400 dark:text-red-600'
          }`} 
        />
      </button>
      
      {expanded && (
        <div className="absolute bottom-full right-0 mb-2 p-3 rounded-lg bg-gray-800 dark:bg-white shadow-lg min-w-48 text-sm animate-fade-in">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              isHealthy 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`}></div>
            <span className="font-medium text-white dark:text-gray-800">
              API Status: {health?.status}
              {import.meta.env.DEV && health?.version === 'dev' && ' (Dev Mode)'}
            </span>
          </div>
          <div className="text-gray-400 dark:text-gray-600">
            Version: {health?.version}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthIndicator;