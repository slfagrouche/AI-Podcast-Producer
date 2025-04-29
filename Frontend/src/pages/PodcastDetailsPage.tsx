import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Download, Loader, ChevronLeft, Tag, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import AudioPlayer from '../components/common/AudioPlayer';
import SourcesList from '../components/podcast/SourcesList';
import { podcastApi } from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from '../utils/date';

// Polling interval in milliseconds
const POLLING_INTERVAL = 5000;
// Base URL for static files
const STATIC_BASE_URL = 'http://localhost:8000';
// Estimated processing time in milliseconds for podcast generation
// This will be adjusted based on podcast duration
const BASE_PROCESSING_TIME = 30000; // 30 seconds minimum
const PROCESSING_TIME_PER_MINUTE = 30000; // Extra 30 seconds per minute of podcast

const PodcastDetailsPage: React.FC = () => {
  const { podcastId } = useParams<{ podcastId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoRefresh = searchParams.get('autoRefresh') === 'true';
  
  const [podcast, setPodcast] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pollingActive, setPollingActive] = useState<boolean>(false);
  const [waitingForGeneration, setWaitingForGeneration] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'sources'>('transcript');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  
  // Fun loading messages with more time to read and simpler slang
  const loadingQuotes = [
    "Hey, we're mixing your podcast... Just chill for a sec ✌️",
    "Cooking up your audio with extra sauce! 🔥",
    "Your podcast is in the oven... gonna be straight fire! 🎧",
    "Adding that special audio magic to your content...",
    "Take it easy while we drop these beats...",
    "Just stirring the podcast pot with our secret recipe...",
    "Turning your topics into pure audio gold... No rush!",
    "This content's gonna be lit! Hang tight 😎",
    "Good vibes coming through while we craft your masterpiece...",
    "Almost ready... just adding the final touches ✨"
  ];
  
  // Rotate through quotes slowly (every 5 seconds)
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex(prevIndex => 
          prevIndex === loadingQuotes.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // 5 seconds per quote
      
      return () => clearInterval(interval);
    }
  }, [loading, loadingQuotes.length]);
  
  // Calculate progress percentage and estimated time remaining
  const updateProgressEstimation = useCallback(() => {
    if (!podcastId || !waitingForGeneration) return;
    
    const creationTimeStr = localStorage.getItem(`podcast_created_${podcastId}`);
    if (!creationTimeStr) return;
    
    const creationTime = parseInt(creationTimeStr, 10);
    const now = Date.now();
    const elapsed = now - creationTime;
    
    // Estimate total processing time based on duration if we have it
    let estimatedTotalTime = BASE_PROCESSING_TIME;
    if (podcast?.duration) {
      // Add more time for longer podcasts
      const durationMinutes = podcast.duration / 60; 
      estimatedTotalTime += durationMinutes * PROCESSING_TIME_PER_MINUTE;
    } else {
      // Default to 3 minutes if we don't know the duration
      estimatedTotalTime += 3 * PROCESSING_TIME_PER_MINUTE;
    }
    
    // Calculate progress percentage (cap at 95% until actually complete)
    const rawPercent = Math.min((elapsed / estimatedTotalTime) * 100, 95);
    setProgressPercent(Math.floor(rawPercent));
    
    // Estimate time remaining
    if (elapsed < estimatedTotalTime) {
      const remaining = estimatedTotalTime - elapsed;
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      if (remainingSeconds < 60) {
        setEstimatedTimeRemaining(`${remainingSeconds} seconds`);
      } else {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        setEstimatedTimeRemaining(`${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} seconds`);
      }
    } else {
      setEstimatedTimeRemaining('almost done');
    }
  }, [podcastId, waitingForGeneration, podcast]);
  
  // Fetch podcast details
  const fetchPodcastDetails = useCallback(async () => {
    if (!podcastId) {
      setLoading(false);
      toast.error('No podcast ID provided');
      return;
    }
    
    try {
      const response = await podcastApi.getById(podcastId);
      setNotFound(false);
      setPodcast(response.data);
      setErrorMsg(null);
      
      // Set polling based on status
      if (response.data.status === 'processing') {
        setPollingActive(true);
        setWaitingForGeneration(true);
        // If we have autoRefresh in URL and podcast is completed, remove it
      } else {
        setPollingActive(false);
        setWaitingForGeneration(false);
        
        // If podcast is completed and we have autoRefresh in URL, clear it
        if (response.data.status === 'completed' && autoRefresh) {
          setSearchParams(prev => {
            prev.delete('autoRefresh');
            return prev;
          });
          toast.success('Your podcast is ready!', { duration: 5000 });
        }
      }
      
      // Update progress estimation
      updateProgressEstimation();
    } catch (error: any) {
      console.error('Failed to fetch podcast details:', error);
      
      // Check if it's a 404 error or if the error message contains 'not found'
      const errorMessage = error.message?.toLowerCase() || '';
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        // True 404 - podcast doesn't exist
        setNotFound(true);
        setWaitingForGeneration(false);
      } else {
        // This could be a podcast that's still initializing in the database
        // For better UX, assume it might be processing if we have a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (podcastId && uuidRegex.test(podcastId)) {
          setWaitingForGeneration(true);
          setPollingActive(true);
          setErrorMsg("We're setting up your podcast. This may take a moment.");
          // Don't set notFound to true, since we're assuming it's being generated
          
          // Update progress estimation
          updateProgressEstimation();
        } else {
          setWaitingForGeneration(false);
          setNotFound(true);
          setErrorMsg("The podcast ID is invalid or the podcast has been removed.");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [podcastId, autoRefresh, setSearchParams, updateProgressEstimation]);
  
  // Initial fetch when component loads
  useEffect(() => {
    if (!podcastId || podcastId === 'undefined') {
      setLoading(false);
      setNotFound(true);
      toast.error('Invalid podcast ID');
      return;
    }
    
    fetchPodcastDetails();
    
    // If autoRefresh is true in URL, make sure polling is active
    if (autoRefresh) {
      setPollingActive(true);
      setWaitingForGeneration(true);
    }
  }, [podcastId, autoRefresh, fetchPodcastDetails]);
  
  // Set up polling if needed - this will refresh until the podcast is ready
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
    let progressUpdateInterval: NodeJS.Timeout | null = null;
    
    if (pollingActive) {
      // Setup main polling for podcast status
      pollingInterval = setInterval(fetchPodcastDetails, POLLING_INTERVAL);
      
      // Setup more frequent updates for progress bar
      progressUpdateInterval = setInterval(updateProgressEstimation, 1000);
      
      // Show toast that we're waiting for processing (only on first poll)
      toast('Podcast is being processed. We\'ll update when it\'s ready.', {
        icon: '⏳',
        duration: 3000,
      });
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
      }
    };
  }, [pollingActive, fetchPodcastDetails, updateProgressEstimation]);
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  // Download podcast
  const handleDownload = () => {
    if (!podcast || !podcast.url) return;
    
    const fullUrl = podcast.url.startsWith('http') ? podcast.url : `${STATIC_BASE_URL}${podcast.url}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = `podcast-${podcast.podcast_id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-75 animate-pulse" style={{ animationDuration: '3s' }}></div>
            <Loader size={48} className="animate-spin text-indigo-500 relative" style={{ animationDuration: '2s' }} />
          </div>
          <div className="h-20"> {/* Fixed height container to prevent layout shifts */}
            <p className="text-xl font-medium bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent transition-opacity duration-1000">
              {loadingQuotes[currentQuoteIndex]}
            </p>
          </div>
          <p className="mt-2 text-gray-400 dark:text-gray-500">
            Sit back and relax... we're working on your Podcast!
          </p>
        </div>
      </div>
    );
  }

  // Show special waiting state for podcasts being generated
  if (waitingForGeneration && !podcast) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 px-6">
        <div className="bg-indigo-900/30 dark:bg-indigo-100/30 p-8 rounded-xl border border-indigo-700 dark:border-indigo-300">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-25"></div>
              <Loader size={48} className="animate-spin text-indigo-500 relative" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Your Podcast is Being Created</h2>
              <p className="text-gray-300 dark:text-gray-700">
                {errorMsg || "We're generating your podcast. This process usually takes 2-3 minutes."}
              </p>
              
              {/* Progress bar */}
              <div className="w-full max-w-md mx-auto mt-6 mb-2">
                <div className="w-full bg-gray-700 dark:bg-gray-300 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-400 dark:text-gray-600">
                  <span>{progressPercent}% complete</span>
                  {estimatedTimeRemaining && (
                    <span>Estimated time remaining: {estimatedTimeRemaining}</span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-400 dark:text-gray-600 text-sm mt-2">
                This page will automatically update once your podcast is ready. Please don't close this window.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/podcasts">
                <Button variant="outline">
                  View All Podcasts
                </Button>
              </Link>
              <Button onClick={() => fetchPodcastDetails()}>
                Check Status Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show waiting state for podcasts that are processing but we have some data
  if (podcast?.status === 'processing') {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 px-6">
        <div className="bg-indigo-900/30 dark:bg-indigo-100/30 p-8 rounded-xl border border-indigo-700 dark:border-indigo-300">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-25"></div>
              <Loader size={48} className="animate-spin text-indigo-500 relative" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Your Podcast is Being Created</h2>
              <p className="text-gray-300 dark:text-gray-700">
                {podcast.message || "We're generating your podcast on these topics:"}
              </p>
              
              {/* Show topics if available */}
              {podcast.topics && podcast.topics.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 my-3">
                  {podcast.topics.map((topic: string, index: number) => (
                    <span key={index} className="bg-indigo-800/50 dark:bg-indigo-200/50 px-3 py-1 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Progress bar */}
              <div className="w-full max-w-md mx-auto mt-6 mb-2">
                <div className="w-full bg-gray-700 dark:bg-gray-300 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-400 dark:text-gray-600">
                  <span>{progressPercent}% complete</span>
                  {estimatedTimeRemaining && (
                    <span>Estimated time remaining: {estimatedTimeRemaining}</span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-400 dark:text-gray-600 text-sm mt-2">
                This page will automatically update once your podcast is ready. Please don't close this window.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/podcasts">
                <Button variant="outline">
                  View All Podcasts
                </Button>
              </Link>
              <Button onClick={() => fetchPodcastDetails()}>
                Check Status Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !podcast) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Podcast Not Found</h2>
        <p className="mb-6">{errorMsg || "The podcast you're looking for doesn't exist or has been removed."}</p>
        <Link to="/podcasts">
          <Button>Back to Podcasts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <Link to="/podcasts" className="inline-flex items-center text-indigo-400 dark:text-indigo-600 hover:text-indigo-300 dark:hover:text-indigo-700 mb-6 transition-colors">
        <ChevronLeft size={20} className="mr-1" />
        Back to Podcasts
      </Link>
      
      {/* Status banner for processing podcasts */}
      {podcast.status === 'processing' && (
        <div className="mb-6 p-4 bg-yellow-900/30 dark:bg-yellow-100/30 border border-yellow-800 dark:border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Loader size={20} className="animate-spin text-yellow-500 mr-3" />
            <div>
              <h3 className="font-medium">Podcast is being processed</h3>
              <p className="text-sm text-gray-400 dark:text-gray-600">
                We're generating your podcast. This page will automatically update when it's ready.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Failed status */}
      {podcast.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-900/30 dark:bg-red-100/30 border border-red-800 dark:border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">❌</div>
            <div>
              <h3 className="font-medium">Podcast generation failed</h3>
              <p className="text-sm text-gray-400 dark:text-gray-600">
                Something went wrong while generating your podcast. Please try creating a new one.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Audio player and metadata */}
        <div className="lg:col-span-1 space-y-6">
          {/* Podcast audio player (if completed) */}
          {podcast.status === 'completed' && podcast.url && (
            <AudioPlayer 
              src={podcast.url.startsWith('http') ? podcast.url : `${STATIC_BASE_URL}${podcast.url}`}
              title="Your Podcast"
            />
          )}
          
          {/* Metadata card */}
          <div className="bg-gray-800/50 dark:bg-gray-200/50 rounded-xl p-5 border border-gray-700 dark:border-gray-300">
            <h2 className="text-xl font-bold mb-4">Podcast Details</h2>
            
            <div className="space-y-4 text-sm">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 dark:text-gray-600">Status:</span>
                <span className={`capitalize font-medium ${
                  podcast.status === 'completed' 
                    ? 'text-green-400 dark:text-green-600' 
                    : podcast.status === 'processing'
                    ? 'text-yellow-400 dark:text-yellow-600'
                    : 'text-red-400 dark:text-red-600'
                }`}>{podcast.status}</span>
              </div>
              
              {/* Created date */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 dark:text-gray-600">Created:</span>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1 text-gray-500 dark:text-gray-500" />
                  <span>{formatDistanceToNow(new Date(podcast.created_at))} ago</span>
                </div>
              </div>
              
              {/* Duration */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 dark:text-gray-600">Duration:</span>
                <div className="flex items-center">
                  <Clock size={14} className="mr-1 text-gray-500 dark:text-gray-500" />
                  <span>{formatDuration(podcast.duration)}</span>
                </div>
              </div>
              
              {/* Topics */}
              <div>
                <span className="text-gray-400 dark:text-gray-600 block mb-2">Topics:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {podcast.metadata?.topics?.map((topic: string, index: number) => (
                    <div key={index} className="inline-flex items-center">
                      <Tag size={12} className="mr-1 text-indigo-400 dark:text-indigo-600" />
                      <span className="text-sm">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Download button (if completed) */}
              {podcast.status === 'completed' && podcast.url && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  fullWidth
                  className="mt-4"
                >
                  <Download size={16} className="mr-2" />
                  Download Podcast
                </Button>
              )}
            </div>
          </div>
          
          {/* Sources list (for smaller screens, shown in tab) */}
          <div className="block lg:hidden">
            {podcast.metadata?.sources && (
              <SourcesList sources={podcast.metadata.sources} />
            )}
          </div>
        </div>
        
        {/* Right column - Transcript and sources */}
        <div className="lg:col-span-2">
          {/* Tabs (mobile only) */}
          <div className="flex lg:hidden mb-4 border-b border-gray-700 dark:border-gray-300">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'transcript'
                  ? 'text-indigo-400 dark:text-indigo-600 border-b-2 border-indigo-400 dark:border-indigo-600'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'sources'
                  ? 'text-indigo-400 dark:text-indigo-600 border-b-2 border-indigo-400 dark:border-indigo-600'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              onClick={() => setActiveTab('sources')}
            >
              Sources
            </button>
          </div>
          
          {/* Transcript */}
          <div className={`lg:block ${activeTab === 'transcript' ? 'block' : 'hidden'}`}>
            <div className="bg-gray-800/50 dark:bg-gray-200/50 rounded-xl p-5 border border-gray-700 dark:border-gray-300">
              <h2 className="text-xl font-bold mb-4">Transcript</h2>
              
              {podcast.status === 'completed' ? (
                podcast.transcript ? (
                  <div className="prose prose-invert dark:prose-light max-w-none text-gray-300 dark:text-gray-700 leading-relaxed">
                    {podcast.transcript.split('\n').map((paragraph: string, idx: number) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 dark:text-gray-600">No transcript available for this podcast.</p>
                )
              ) : (
                <p className="text-gray-400 dark:text-gray-600">
                  {podcast.status === 'processing' 
                    ? 'Transcript will be available once the podcast is processed.'
                    : 'Transcript generation failed.'}
                </p>
              )}
            </div>
          </div>
          
          {/* Sources (mobile tab) */}
          <div className={`lg:hidden ${activeTab === 'sources' ? 'block' : 'hidden'}`}>
            {podcast.metadata?.sources && (
              <SourcesList sources={podcast.metadata.sources} />
            )}
          </div>
          
          {/* Sources (desktop - always visible) */}
          <div className="hidden lg:block mt-6">
            {podcast.metadata?.sources && (
              <SourcesList sources={podcast.metadata.sources} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodcastDetailsPage;