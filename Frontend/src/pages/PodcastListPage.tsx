import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader, SortAsc, SortDesc } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import PodcastCard from '../components/podcast/PodcastCard';
import Button from '../components/common/Button';
import { podcastApi, PodcastRecord } from '../services/api';
import toast from 'react-hot-toast';

// Status filter options
const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
] as const;

type StatusType = typeof STATUS_FILTERS[number]['value'];

// Sort options
const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'duration_desc', label: 'Longest First' },
  { value: 'duration_asc', label: 'Shortest First' },
];

const PodcastListPage: React.FC = () => {
  const { user } = useUser();
  const [podcasts, setPodcasts] = useState<PodcastRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [sort, setSort] = useState<string>('created_desc');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPodcasts, setTotalPodcasts] = useState(0);
  const podcastsPerPage = 12;

  const fetchPodcasts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Log the user ID that's being used for debugging
      console.log('Fetching podcasts for user ID:', user.id);
      
      // Pass the userId as the first parameter, then page and limit
      const response = await podcastApi.getByUser(user.id, currentPage, podcastsPerPage);
      
      // Log the response for debugging
      console.log('Podcast API response:', response);
      
      setPodcasts(response.data || []);
      setTotalPodcasts(response.total || 0);
      
      // If we get no data and we're not on the first page, reset to page 1
      if ((response.data?.length === 0 || !response.data) && currentPage > 1) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      toast.error('Failed to load podcasts. Please try again.');
      // Reset to page 1 if we encounter a range error
      if (error.code === 'PGRST103') {
        setCurrentPage(1);
      }
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, podcastsPerPage]);

  useEffect(() => {
    fetchPodcasts();
  }, [fetchPodcasts]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSort('created_desc');
  };

  const filteredPodcasts = podcasts
    .filter(podcast => {
      const matchesSearch = podcast.topics.some(topic =>
        topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || podcast.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'duration_asc':
          return a.duration - b.duration;
        case 'duration_desc':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Podcasts</h1>
        <p className="text-gray-400 dark:text-gray-600">
          Browse, filter, and play your generated podcasts
        </p>
      </div>

      {/* Search and filter bar */}
      <div className="bg-gray-800/50 dark:bg-gray-200/50 rounded-xl p-4 mb-8 border border-gray-700 dark:border-gray-300">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 dark:text-gray-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic..."
              className="block w-full pl-10 pr-3 py-2 bg-gray-900 dark:bg-white border border-gray-700 dark:border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="md:hidden px-4 py-2 bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-800 rounded-md hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors flex items-center"
          >
            <Filter size={18} className="mr-2" />
            {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Status filter - desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm">Status:</span>
            <div className="flex rounded-md overflow-hidden border border-gray-700 dark:border-gray-300">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 dark:bg-gray-300 text-gray-300 dark:text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-400'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort dropdown - desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 bg-gray-700 dark:bg-gray-300 border border-gray-700 dark:border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white dark:text-gray-800"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort icon based on current sort */}
          <div className="hidden md:flex items-center">
            {sort.includes('asc') ? (
              <SortAsc size={18} className="text-gray-400 dark:text-gray-600" />
            ) : (
              <SortDesc size={18} className="text-gray-400 dark:text-gray-600" />
            )}
          </div>
        </div>

        {/* Mobile filters */}
        {isFilterVisible && (
          <div className="md:hidden mt-4 space-y-4 border-t border-gray-700 dark:border-gray-300 pt-4">
            <div className="space-y-2">
              <span className="text-sm">Status:</span>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 dark:bg-gray-300 text-gray-300 dark:text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-400'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 dark:bg-gray-300 border border-gray-700 dark:border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white dark:text-gray-800"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-sm bg-gray-700 dark:bg-gray-300 text-gray-300 dark:text-gray-700 rounded-md hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Podcasts grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader size={36} className="animate-spin text-indigo-500 mb-4" />
            <p>Loading podcasts...</p>
          </div>
        </div>
      ) : filteredPodcasts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={{
                podcast_id: podcast.id,
                status: podcast.status,
                url: podcast.url,
                created_at: podcast.created_at,
                duration: podcast.duration,
                topics: podcast.topics
              }} />
            ))}
          </div>

          {/* Load more button */}
          {currentPage * podcastsPerPage < totalPodcasts && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                variant="outline"
                disabled={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-800/30 dark:bg-gray-200/30 rounded-xl border border-gray-700 dark:border-gray-300">
          <div className="mb-4">
            <Filter size={48} className="mx-auto text-gray-500 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No podcasts found</h3>
          <p className="text-gray-400 dark:text-gray-600 mb-4">
            {podcasts.length > 0
              ? 'Try adjusting your filters or search query.'
              : 'You have not created any podcasts yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PodcastListPage;
