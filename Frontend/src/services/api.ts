import { podcastOperations, PodcastRecord } from './supabase';

export type { PodcastRecord };

export interface VoiceDetail {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  sample_url: string;
}

export interface HealthStatus {
  status: 'healthy';
  version: string;
}

// Voice API endpoints
export const voiceApi = {
  async getAll(): Promise<{ data: VoiceDetail[] }> {
    try {
      const response = await fetch('/api/voices');
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle both array and object responses
      const voices = Array.isArray(data) ? data : data.voices || [];
      return { data: voices };
    } catch (error) {
      console.error('Error fetching voices:', error);
      return { data: [] }; // Return empty array instead of throwing
    }
  }
};

// Health check endpoint
export const healthApi = {
  async check(): Promise<HealthStatus> {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
};

// Podcast operations using Supabase
export const podcastApi = {
  async create(
    data: { 
      topics: string[];
      duration: number;
      host_voice: string;
      co_host_voice: string;
      language: string;
    },
    userId: string,
    token?: string
  ) {
    try {
      // Call the backend API directly, sending all the necessary data
      const response = await fetch('/api/podcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          user_id: userId
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.detail || JSON.stringify(errorData)}`;
        } catch (e) {
          // If we can't parse the error as JSON, just use the status text
        }
        throw new Error(`Failed to create podcast: ${errorMessage}`);
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: unknown) {
      console.error('Error creating podcast:', error);
      throw error;
    }
  },

  async getById(podcastId: string) {
    try {
      // Use backend API instead of direct Supabase client to handle podcast processing states better
      const response = await fetch(`/api/podcasts/${podcastId}`);
      
      // Non-2xx status will throw an error here, but we want to handle 404 specially
      if (response.status === 404) {
        // This might be a podcast that's still initializing and not yet in the database
        // For better UX, we'll tell the frontend it's likely in a processing state
        const uuid = podcastId.toLowerCase().trim();
        // Check if this looks like a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(uuid)) {
          // If it's a valid UUID, assume it might be processing
          console.log(`Podcast ${podcastId} not found, but assuming it's being generated...`);
          return { 
            data: {
              id: podcastId,
              status: 'processing',
              topics: [],
              message: "Your podcast is being generated. Please wait...",
              created_at: new Date().toISOString(),
              user_id: ""
            } 
          };
        } else {
          // If it doesn't look like a valid UUID, it's likely a true 404
          throw new Error(`Podcast not found: ${podcastId}`);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch podcast: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching podcast:', error);
      throw error;
    }
  },

  async getByUser(userId: string, page = 1, limit = 10) {
    try {
      const { data, count } = await podcastOperations.getByUser(userId, page, limit);
      return { data, total: count };
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      throw error;
    }
  },

  async downloadAudio(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to download audio');
    }
    return response.blob();
  }
};
