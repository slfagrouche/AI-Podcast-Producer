# AI Podcast Producer

![AI Podcast Producer](https://img.shields.io/badge/AI-Podcast%20Producer-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## 🎙️ Project Overview

AI Podcast Producer is a cutting-edge application that automatically generates engaging podcasts from news articles using artificial intelligence. The system transforms text-based news into conversational audio content, creating a natural-sounding podcast with host and co-host dynamics.

### 🚀 Quick Demo

1. Choose your podcast topics (e.g., Technology, Finance, Health)
2. Select voice personalities for host and co-host
3. Set your desired podcast duration
4. Click generate and get a fully produced podcast in minutes!

## 🎯 Problem Statement

In today's fast-paced world, people struggle to stay informed about multiple topics while on the go. Reading numerous articles is time-consuming, and existing text-to-speech solutions sound robotic and monotonous. Content creators and businesses also face challenges:

- **Time constraints**: Creating quality podcasts requires significant time for research, scripting, recording, and editing
- **Technical barriers**: Traditional podcast production requires specialized equipment and editing skills
- **Scaling issues**: Producing multiple podcast episodes consistently is challenging
- **Content diversity**: Covering a wide range of topics requires extensive research

## 💡 Our Solution

AI Podcast Producer solves these challenges by offering:

1. **Automated content collection**: Gathers the latest articles on your chosen topics
2. **Intelligent processing**: Transforms articles into conversational scripts with a natural flow
3. **Realistic voices**: Uses ElevenLabs' advanced text-to-speech technology for lifelike, engaging voices
4. **Multi-speaker format**: Creates dynamic conversations between host and co-host
5. **Custom durations**: Generates podcasts of any length from 1 to 60 minutes
6. **Multilingual support**: Creates podcasts in multiple languages
7. **Zero equipment needed**: Everything happens in the cloud - no microphone or editing required

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API and custom hooks
- **UI/UX**: Tailwind CSS for styling
- **Animations**: Framer Motion for smooth transitions
- **Authentication**: Clerk for user management
- **API Communication**: Axios for HTTP requests
- **Toast Notifications**: React Hot Toast
- **Build Tool**: Vite for fast development and optimized builds
- **Icons**: Lucide React for consistent UI elements

### Backend
- **Framework**: FastAPI (Python)
- **Authentication**: JWT with OAuth2
- **Database**: Supabase (PostgreSQL)
- **Content Generation**: OpenAI GPT-4
- **Text-to-Speech**: ElevenLabs API
- **News Collection**: NewsAPI
- **Audio Processing**: pydub library
- **Storage**: Local file system for podcast files
- **Deployment**: Docker containerization

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- API keys for:
  - OpenAI
  - ElevenLabs
  - NewsAPI (optional)
  - Supabase project

### Setting Up Supabase
1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Set up the database schema and policies by running the following SQL in the Supabase SQL Editor:

```sql
-- Create the podcasts table with correct data types
CREATE TABLE IF NOT EXISTS public.podcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL, -- Using TEXT for compatibility with auth providers
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  duration INTEGER NOT NULL,
  url TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  host_voice TEXT NOT NULL,
  co_host_voice TEXT NOT NULL,
  language TEXT NOT NULL,
  metadata JSONB,
  transcript TEXT,
  message TEXT
);

-- Enable Row Level Security
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own podcasts
CREATE POLICY "Users can view their own podcasts" 
ON podcasts FOR SELECT 
USING (auth.uid()::text = user_id);

-- Create policy that allows users to create their own podcasts
CREATE POLICY "Users can insert their own podcasts" 
ON podcasts FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create policy that allows users to update their own podcasts
CREATE POLICY "Users can update their own podcasts" 
ON podcasts FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Optional: For development/testing only - allows service role to access all records
-- Remove this in production!
CREATE POLICY "Service role access to all podcasts" 
ON podcasts 
USING (auth.role() = 'service_role');

-- Add table comment
COMMENT ON TABLE podcasts IS 'Table for storing podcast information with RLS policies for user data protection';
```

3. Save your Supabase URL and anon key in your environment variables (needed for both frontend and backend)

### Frontend Setup
```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Create a .env file with your environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd Backend

# Create a virtual environment
python -m venv backend_venv
source backend_venv/bin/activate  # On Windows: backend_venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file with your API credentials
cp .env.example .env
# Edit .env with your API keys

# Start the server
python main.py
```

## 🖥️ Project Structure

```
AI-Podcast-Producer/
├── Frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── index.html             # HTML entry point
├── Backend/
│   ├── api/                   # FastAPI routes and models
│   ├── src/                   # Core functionality modules
│   ├── config/                # Configuration files
│   ├── data/                  # Data files
│   ├── static/                # Generated podcasts
│   ├── tests/                 # Test suite
│   └── main.py                # Entry point
└── README.md                  # Project documentation
```

## 🚀 Features

### Content Generation
- **Topic-Based News Collection**: Gather relevant articles based on user-specified topics
- **Intelligent Summarization**: Extract key points while maintaining context
- **Conversational Format**: Transform articles into engaging dialogues
- **Natural Transitions**: Smooth flow between different news items

### Audio Production
- **Multiple Voice Options**: Choose from a variety of realistic voices
- **Dynamic Conversations**: Host and co-host interaction with distinct personalities
- **Proper Pacing**: Natural pauses and emphasis in speech
- **Audio Enhancement**: Output quality suitable for podcast distribution

### User Experience
- **Simple Interface**: Easy topic selection and podcast customization
- **Real-Time Progress**: Track podcast generation with percentage completion
- **Preview Capability**: Sample voices before generating full podcasts
- **Download Options**: Save podcasts for offline listening

## 🔄 Workflow

1. **Content Collection**: The system gathers recent news articles on specified topics
2. **Content Processing**: Articles are processed and transformed into a conversational script
3. **Voice Generation**: The script is converted to natural-sounding speech
4. **Audio Production**: Multiple speech segments are combined with appropriate pacing
5. **Delivery**: The completed podcast is made available for streaming or download

## 🔍 Technical Deep Dive

### Backend Architecture

The backend follows a modular design with clear separation of concerns:

1. **API Layer** (`/api/`):
   - REST endpoints for podcast generation and retrieval
   - Request validation and error handling
   - Authentication and authorization

2. **Core Services** (`/src/`):
   - `news_collector.py`: Gathers and filters news articles
   - `content_processor.py`: Transforms news into podcast scripts
   - `chat.py`: Manages conversational models
   - `audio.py`: Handles text-to-speech and audio processing

3. **Integration Points**:
   - OpenAI API for content processing
   - ElevenLabs API for voice synthesis
   - Supabase for data persistence
   - NewsAPI for article collection

### Frontend Architecture

The frontend implements a component-based architecture:

1. **Page Components**:
   - `CreatePodcastPage.tsx`: Interface for podcast generation
   - `PodcastDetailsPage.tsx`: Displays podcast information and player
   - `PodcastListPage.tsx`: Shows all user-generated podcasts

2. **Core Components**:
   - `AudioPlayer.tsx`: Custom audio player with controls
   - `VoiceSelector.tsx`: Interface for voice selection with previews
   - `PodcastProgressBar.tsx`: Real-time generation progress tracking

3. **Service Layer**:
   - API abstraction for backend communication
   - Authentication and user management
   - Error handling and state persistence

## 🔒 Security Considerations

- **Authentication**: JWT-based authentication for user sessions
- **API Security**: Rate limiting to prevent abuse
- **Data Validation**: Input sanitization and validation
- **Error Handling**: Proper error boundaries and fallbacks
- **Environment Isolation**: Separation of development and production environments

## 📊 Performance Optimizations

- **Asynchronous Processing**: Background tasks for long-running operations
- **Caching**: Frequently accessed data is cached to improve response times
- **Lazy Loading**: Components and resources are loaded only when needed
- **Resource Management**: Efficient handling of API requests and responses
- **Build Optimization**: Production builds are minified and optimized

## 🧩 Integration Options

- **Content Management Systems**: Integrate with CMS for managed content sources
- **Publishing Platforms**: Automatically distribute to podcast platforms
- **Analytics Tools**: Track listening statistics and engagement
- **Social Media**: Share generated podcasts across platforms
- **Custom Websites**: Embed players on any website

## 📚 Documentation

For more detailed instructions and API documentation:

- [Backend Documentation](Backend/Documentation.md) - Complete API reference and backend setup guide
- [Supabase Integration Guide](Backend/supabase-alter.sql) - Database schema and policy setup

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📬 Contact

Have questions or feedback? Reach out via:
- GitHub Issues 
- Email: SaidLfagrouche@gmail.com

---
