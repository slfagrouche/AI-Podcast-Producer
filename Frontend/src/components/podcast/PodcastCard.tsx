import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Disc, Play, Info } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/date';

interface PodcastCardProps {
  podcast: {
    podcast_id: string;
    status: string;
    url?: string;
    created_at: string;
    duration: number;
    topics: string[];
  };
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-600';
      case 'processing':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'failed':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };
  
  const statusColor = getStatusColor(podcast.status);
  const createdAt = new Date(podcast.created_at);

  return (
    <div 
      className="rounded-xl overflow-hidden bg-gray-800/70 dark:bg-white/70 backdrop-blur-sm border border-gray-700 dark:border-gray-300 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-32 bg-gradient-to-r from-indigo-800 to-purple-800 dark:from-indigo-200 dark:to-purple-200 flex items-center justify-center">
        <Disc 
          size={48} 
          className={`text-white dark:text-gray-800 transition-transform duration-500 ${isHovered ? 'rotate-[360deg]' : ''}`} 
        />
        
        {/* Status badge */}
        <div className="absolute top-3 right-3 flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColor} mr-1.5`}></span>
          <span className="text-xs text-white dark:text-gray-800 font-medium capitalize">
            {podcast.status}
          </span>
        </div>
        
        {/* Play button overlay (only for completed podcasts) */}
        {podcast.status === 'completed' && podcast.url && (
          <Link 
            to={`/podcasts/${podcast.podcast_id}`}
            className={`absolute inset-0 bg-black/50 dark:bg-white/50 flex items-center justify-center opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`}
          >
            <div className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all duration-300 hover:scale-110">
              <Play size={24} className="text-white ml-0.5" />
            </div>
          </Link>
        )}
      </div>
      
      <div className="p-4">
        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-3">
          {podcast.topics.slice(0, 3).map((topic, index) => (
            <span 
              key={index} 
              className="px-2 py-1 text-xs bg-gray-700 dark:bg-gray-300 text-gray-200 dark:text-gray-800 rounded-full"
            >
              {topic}
            </span>
          ))}
          {podcast.topics.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-700 dark:bg-gray-300 text-gray-200 dark:text-gray-800 rounded-full">
              +{podcast.topics.length - 3}
            </span>
          )}
        </div>
        
        {/* Info */}
        <div className="text-gray-400 dark:text-gray-600 text-sm space-y-1.5">
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            <span>Created {formatDistanceToNow(createdAt)} ago</span>
          </div>
          
          <div className="flex items-center">
            <Clock size={14} className="mr-2" />
            <span>{formatDuration(podcast.duration)}</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-between">
          <Link
            to={`/podcasts/${podcast.podcast_id}`}
            className="flex items-center text-indigo-400 dark:text-indigo-600 hover:text-indigo-300 dark:hover:text-indigo-700 text-sm font-medium transition-colors duration-200"
          >
            <Info size={16} className="mr-1" />
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;