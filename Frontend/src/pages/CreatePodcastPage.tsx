import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AlignLeft, Clock, Languages, Radio, Loader, Search } from 'lucide-react';
import Button from '../components/common/Button';
import VoiceSelector from '../components/podcast/VoiceSelector';
import { voiceApi, podcastApi, VoiceDetail } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth'; // Use our custom hook instead

// Language options with ISO codes and native names
const LANGUAGES = [
  { 
    value: 'ar-SA', 
    label: 'Arabic (العربية)', 
    searchTerms: ['arabic', 'العربية', 'arab', 'arabian', 'saudi', 'عربي', 'عربية']
  },
  { 
    value: 'zh-CN', 
    label: 'Chinese - Mandarin (中文)', 
    searchTerms: ['chinese', 'mandarin', 'china', '中文', 'zhongwen', 'putonghua', '普通话']
  },
  { 
    value: 'en-US', 
    label: 'English (US)', 
    searchTerms: ['english', 'us', 'united states', 'american']
  },
  { 
    value: 'en-GB', 
    label: 'English (UK)', 
    searchTerms: ['english', 'uk', 'british', 'britain']
  },
  { 
    value: 'hi-IN', 
    label: 'Hindi (हिंदी)', 
    searchTerms: ['hindi', 'india', 'हिंदी', 'indian', 'hindustan']
  },
  { 
    value: 'id-ID', 
    label: 'Indonesian (Bahasa Indonesia)', 
    searchTerms: ['indonesian', 'indonesia', 'bahasa']
  },
  { 
    value: 'ja-JP', 
    label: 'Japanese (日本語)', 
    searchTerms: ['japanese', 'japan', '日本語', 'nihongo', 'にほんご']
  },
  { 
    value: 'ko-KR', 
    label: 'Korean (한국어)', 
    searchTerms: ['korean', 'korea', '한국어', 'hangugeo']
  },
  { 
    value: 'ms-MY', 
    label: 'Malay (Bahasa Melayu)', 
    searchTerms: ['malay', 'malaysian', 'malaysia', 'melayu']
  },
  { 
    value: 'fa-IR', 
    label: 'Persian (فارسی)', 
    searchTerms: ['persian', 'farsi', 'iran', 'iranian', 'فارسی']
  },
  { 
    value: 'ru-RU', 
    label: 'Russian (Русский)', 
    searchTerms: ['russian', 'russia', 'русский', 'russkiy']
  },
  { 
    value: 'es-ES', 
    label: 'Spanish (Español)', 
    searchTerms: ['spanish', 'spain', 'español', 'espanol', 'castellano']
  },
  { 
    value: 'es-MX', 
    label: 'Spanish - Mexico (Español)', 
    searchTerms: ['spanish', 'mexico', 'méxico', 'español', 'espanol', 'mexicano']
  },
  { 
    value: 'sw-KE', 
    label: 'Swahili (Kiswahili)', 
    searchTerms: ['swahili', 'kiswahili', 'kenya', 'tanzania', 'east africa']
  },
  { 
    value: 'tr-TR', 
    label: 'Turkish (Türkçe)', 
    searchTerms: ['turkish', 'turkey', 'türkçe', 'turkce']
  },
  { 
    value: 'ur-PK', 
    label: 'Urdu (اردو)', 
    searchTerms: ['urdu', 'pakistan', 'اردو', 'pakistani']
  },
  { 
    value: 'vi-VN', 
    label: 'Vietnamese (Tiếng Việt)', 
    searchTerms: ['vietnamese', 'vietnam', 'tiếng việt', 'tieng viet']
  }
] as const;

// Duration options (in seconds)
const DURATION_OPTIONS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '60 minutes' },
];

type LanguageCode = typeof LANGUAGES[number]['value'];

const CreatePodcastPage: React.FC = () => {
  const { user } = useUser();
  const { token } = useAuth(); // Use our custom hook that provides the token
  // Form state
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [duration, setDuration] = useState<number>(300);
  const [hostVoice, setHostVoice] = useState<string>('');
  const [coHostVoice, setCoHostVoice] = useState<string>('');
  const [language, setLanguage] = useState<LanguageCode>('en-US');
  const [languageSearch, setLanguageSearch] = useState('');
  const [activeSection, setActiveSection] = useState<'topics' | 'voices' | 'settings'>('topics');

  // UI state
  const [voices, setVoices] = useState<VoiceDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();

  // Filter languages based on search
  const filteredLanguages = LANGUAGES.filter(lang => {
    const searchLower = languageSearch.toLowerCase();
    return lang.searchTerms.some(term => term.toLowerCase().includes(searchLower)) ||
           lang.label.toLowerCase().includes(searchLower);
  });

  // Fetch available voices
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        const response = await voiceApi.getAll();
        const fetchedVoices = response.data;
        setVoices(fetchedVoices);
        
        if (fetchedVoices.length >= 2) {
          setHostVoice(fetchedVoices[0].voice_id);
          setCoHostVoice(fetchedVoices[1].voice_id);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
        toast.error('Failed to load available voices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a podcast.');
      return;
    }

    if (topics.length === 0) {
      toast.error('Please add at least one topic.');
      return;
    }
    
    if (!hostVoice) {
      toast.error('Please select a host voice.');
      return;
    }
    
    if (!coHostVoice) {
      toast.error('Please select a co-host voice.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const podcastData = {
        topics,
        duration,
        host_voice: hostVoice,
        co_host_voice: coHostVoice,
        language
      };

      // Simplified: We don't need to pass the token, just the user ID
      const response = await podcastApi.create(podcastData, user.id);
      toast.success('Podcast creation started! You will be redirected to the waiting page.');
      
      // Store the creation time in localStorage - will be used for progress estimation
      localStorage.setItem(`podcast_created_${response.data.podcast_id || response.data.id}`, Date.now().toString());
      
      // Navigate to the podcast details page with a "waiting" query parameter
      navigate(`/podcasts/${response.data.podcast_id || response.data.id}?autoRefresh=true`);
    } catch (error) {
      console.error('Failed to create podcast:', error);
      toast.error(`Failed to create podcast: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader size={36} className="animate-spin text-indigo-500 mb-4" />
          <p>Loading voice options...</p>
        </div>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-12">
      <div className="flex items-center space-x-4">
        {['topics', 'voices', 'settings'].map((step, index) => (
          <React.Fragment key={step}>
            <button
              onClick={() => setActiveSection(step as typeof activeSection)}
              className={`flex flex-col items-center group ${
                activeSection === step ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-200 ${
                activeSection === step
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-400 text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-400'
              }`}>
                {index + 1}
              </div>
              <span className={`mt-2 text-sm capitalize ${
                activeSection === step
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-400 group-hover:text-indigo-400'
              }`}>
                {step}
              </span>
            </button>
            {index < 2 && (
              <div className={`w-24 h-0.5 mt-5 ${
                index < ['topics', 'voices', 'settings'].indexOf(activeSection)
                  ? 'bg-indigo-600'
                  : 'bg-gray-400'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Create a New Podcast
        </h1>
        <p className="text-lg text-gray-400 dark:text-gray-600 max-w-2xl mx-auto">
          Customize your podcast's content, duration, and voices to generate a personalized audio experience.
        </p>
      </div>

      {renderStepIndicator()}
      
      <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 dark:from-gray-200/50 dark:to-gray-100/50 rounded-2xl p-8 shadow-xl border border-gray-700/50 dark:border-gray-300/50 backdrop-blur-sm">
        {activeSection === 'topics' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center mb-4">
                <AlignLeft size={20} className="text-indigo-400 dark:text-indigo-600" />
                <h2 className="text-xl font-semibold ml-2">Topics</h2>
              </div>
              
              <div className="flex">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                  placeholder="Enter a topic (e.g., technology, AI, science)"
                  className="flex-1 bg-gray-900/50 dark:bg-white/50 border border-gray-700 dark:border-gray-300 rounded-l-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-xl transition-colors text-lg font-medium"
                >
                  Add
                </button>
              </div>
              
              <div className="mt-6">
                <div className="flex flex-wrap gap-3">
                  {topics.map((topic, index) => (
                    <div
                      key={index}
                      className="group relative inline-flex items-center bg-indigo-900/30 dark:bg-indigo-100/30 text-indigo-200 dark:text-indigo-800 px-4 py-2 rounded-xl text-base transition-all hover:bg-indigo-900/40 dark:hover:bg-indigo-100/40"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(index)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {topics.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-600 mt-4">
                    No topics added yet. Add at least one topic to create a podcast.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'voices' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VoiceSelector
                voices={voices}
                label="Host Voice"
                selectedVoice={hostVoice}
                onChange={setHostVoice}
              />
              <VoiceSelector
                voices={voices}
                label="Co-Host Voice"
                selectedVoice={coHostVoice}
                onChange={setCoHostVoice}
              />
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center mb-4">
                <Clock size={20} className="text-indigo-400 dark:text-indigo-600" />
                <h2 className="text-xl font-semibold ml-2">Duration</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value)}
                    className={`py-3 px-4 rounded-xl text-center transition-all duration-200 ${
                      duration === option.value
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center mb-4">
                <Languages size={20} className="text-indigo-400 dark:text-indigo-600" />
                <h2 className="text-xl font-semibold ml-2">Language</h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400 dark:text-gray-600" />
                  </div>
                  <input
                    type="text"
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    placeholder="Search languages by name (e.g. Arabic, 中文, Español...)"
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 dark:bg-white/50 border border-gray-700 dark:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                    dir="auto"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredLanguages.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLanguage(option.value)}
                      className={`p-4 rounded-xl text-center transition-all duration-200 ${
                        language === option.value
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-300'
                      }`}
                      dir="auto"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {filteredLanguages.length === 0 && (
                  <p className="text-center text-gray-400 dark:text-gray-600 py-4">
                    No languages match your search. Try typing in English, native script, or country name.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => {
              const sections: Array<'topics' | 'voices' | 'settings'> = ['topics', 'voices', 'settings'];
              const currentIndex = sections.indexOf(activeSection);
              if (currentIndex > 0) {
                setActiveSection(sections[currentIndex - 1]);
              }
            }}
            className={`px-6 py-3 rounded-xl transition-all duration-200 ${
              activeSection === 'topics'
                ? 'opacity-0 pointer-events-none'
                : 'bg-gray-800/50 dark:bg-gray-200/50 hover:bg-gray-700 dark:hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {activeSection === 'settings' ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || topics.length === 0 || !hostVoice || !coHostVoice}
              loading={isSubmitting}
              size="lg"
              className="px-8 py-3 rounded-xl"
            >
              <Radio size={20} className="mr-2" />
              Generate Podcast
            </Button>
          ) : (
            <button
              onClick={() => {
                const sections: Array<'topics' | 'voices' | 'settings'> = ['topics', 'voices', 'settings'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1]);
                }
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePodcastPage;
