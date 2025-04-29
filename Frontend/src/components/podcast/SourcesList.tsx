import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Source {
  url: string;
  title: string;
  source: string;
}

interface SourcesListProps {
  sources: Source[];
}

const SourcesList: React.FC<SourcesListProps> = ({ sources }) => {
  return (
    <div className="rounded-lg border border-gray-700 dark:border-gray-300 overflow-hidden">
      <div className="bg-gray-800 dark:bg-gray-200 px-4 py-3 border-b border-gray-700 dark:border-gray-300">
        <h3 className="font-medium">Sources ({sources.length})</h3>
      </div>
      
      <div className="divide-y divide-gray-700 dark:divide-gray-300">
        {sources.map((source, index) => (
          <div key={index} className="p-3 hover:bg-gray-800/50 dark:hover:bg-gray-200/50 transition-colors duration-200">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-sm line-clamp-2">{source.title}</h4>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 p-1 text-indigo-400 hover:text-indigo-300 dark:text-indigo-600 dark:hover:text-indigo-700 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300 flex-shrink-0"
                aria-label="Open source link"
              >
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-600">{source.source}</div>
          </div>
        ))}
        
        {sources.length === 0 && (
          <div className="p-4 text-center text-gray-400 dark:text-gray-600">
            No sources available
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcesList;