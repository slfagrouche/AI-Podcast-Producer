import React, { useState } from 'react';
import { Filter } from 'lucide-react';

interface VoiceLabels {
  accent?: string;
  description?: string;
  age?: string;
  gender?: string;
  use_case?: string;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: VoiceLabels;
}

interface VoiceSelectorProps {
  voices: Voice[];
  label: string;
  selectedVoice: string;
  onChange: (voiceId: string) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  label,
  selectedVoice,
  onChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<VoiceLabels>({});

  // Extract unique values for each filter
  const filterOptions = voices.reduce((acc, voice) => {
    if (voice.labels) {
      Object.entries(voice.labels).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = new Set();
        if (value) acc[key].add(value);
      });
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  // Filter voices based on selected criteria
  const filteredVoices = voices.filter(voice => {
    return Object.entries(filters).every(([key, value]) => {
      return !value || voice.labels[key as keyof VoiceLabels] === value;
    });
  });

  const handleFilterChange = (category: keyof VoiceLabels, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category] === value ? undefined : value
    }));
  };

  const getVoiceCharacteristics = (voice: Voice) => {
    return Object.entries(voice.labels)
      .filter(([key]) => key !== 'use_case')
      .map(([, value]) => value);
  };

  return (
    <div className="relative">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold">{label}</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Filter size={16} className="mr-1.5" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Hexagonal accent shapes */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-[2rem] rotate-45 -z-10" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-[2rem] rotate-12 -z-10" />

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-800/30 dark:bg-gray-200/30 rounded-xl border border-gray-700/50 dark:border-gray-300/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(filterOptions).map(([category, values]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium capitalize text-gray-400 dark:text-gray-600">
                  {category.replace('_', ' ')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(values).map(value => (
                    <button
                      key={value}
                      onClick={() => handleFilterChange(category as keyof VoiceLabels, value)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                        filters[category as keyof VoiceLabels] === value
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 hover:bg-gray-700/70 dark:hover:bg-gray-300/70'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredVoices.map((voice) => {
          const characteristics = getVoiceCharacteristics(voice);
          return (
            <label
              key={voice.voice_id}
              className={`relative cursor-pointer group transition-all duration-200 ${
                selectedVoice === voice.voice_id
                  ? 'scale-[1.02]'
                  : 'hover:scale-[1.01]'
              }`}
            >
              <input
                type="radio"
                name={label.replace(/\s+/g, '-').toLowerCase()}
                value={voice.voice_id}
                checked={selectedVoice === voice.voice_id}
                onChange={() => onChange(voice.voice_id)}
                className="sr-only"
              />
              
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedVoice === voice.voice_id
                  ? 'bg-indigo-900/20 dark:bg-indigo-100/20 border-indigo-500'
                  : 'bg-gray-800/30 dark:bg-gray-200/30 border-transparent group-hover:border-indigo-500/50'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{voice.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {characteristics.map((char, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-xs px-2 py-1 rounded-md bg-gray-700/50 dark:bg-gray-300/50 text-gray-300 dark:text-gray-700"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                    {voice.labels.use_case && (
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        selectedVoice === voice.voice_id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-700/70 dark:bg-gray-300/70 text-gray-300 dark:text-gray-700'
                      }`}>
                        {voice.labels.use_case}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                <div className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
                  selectedVoice === voice.voice_id
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-50'
                }`}>
                  <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedVoice === voice.voice_id
                        ? 'bg-indigo-500'
                        : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {filteredVoices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 dark:text-gray-600">
            No voices match the selected filters. Try adjusting your filters to see more options.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
