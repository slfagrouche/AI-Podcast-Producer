import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

const STATIC_BASE_URL = 'http://localhost:8000';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(20).fill(0));

  // Effect to handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    // Initial volume
    audio.volume = volume;
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Construct full URL
  const fullUrl = src.startsWith('http') ? src : `${STATIC_BASE_URL}${src}`;
  
  // Effect to handle play/pause
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
      startVisualizer();
    } else {
      audioRef.current?.pause();
      stopVisualizer();
    }
  }, [isPlaying]);
  
  // Effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Audio visualizer simulation
  const visualizerIntervalRef = useRef<number | null>(null);
  
  const startVisualizer = () => {
    if (visualizerIntervalRef.current) return;
    
    visualizerIntervalRef.current = window.setInterval(() => {
      // Simulate audio frequency data
      const newData = Array(20).fill(0).map(() => {
        return isPlaying ? Math.random() * 0.8 + 0.2 : 0;
      });
      setVisualizerData(newData);
    }, 100);
  };
  
  const stopVisualizer = () => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
      setVisualizerData(Array(20).fill(0));
    }
  };
  
  // Clean up visualizer on unmount
  useEffect(() => {
    return () => {
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current);
      }
    };
  }, []);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  return (
    <div className="w-full rounded-xl bg-gray-800/60 dark:bg-gray-200/60 backdrop-blur-sm p-6 my-8 shadow-lg border border-gray-700 dark:border-gray-300">
      <audio ref={audioRef} src={fullUrl} />
      
      {title && (
        <div className="text-lg font-medium mb-4 text-white dark:text-gray-800">{title}</div>
      )}
      
      {/* Visualizer */}
      <div className="h-16 mb-4 flex items-end justify-center space-x-1">
        {visualizerData.map((value, index) => (
          <div
            key={index}
            className="w-2 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-100 ease-out"
            style={{ 
              height: `${value * 100}%`,
              opacity: isPlaying ? 1 : 0.5
            }}
          ></div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-700 dark:bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-sm text-gray-400 dark:text-gray-600 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => skip(-10)}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            aria-label="Skip backward 10 seconds"
          >
            <SkipBack size={20} className="text-gray-300 dark:text-gray-700" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-transform hover:scale-105 active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={24} className="text-white" />
            ) : (
              <Play size={24} className="text-white ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={() => skip(10)}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward size={20} className="text-gray-300 dark:text-gray-700" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} className="text-gray-300 dark:text-gray-700" />
            ) : (
              <Volume2 size={20} className="text-gray-300 dark:text-gray-700" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-700 dark:bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;