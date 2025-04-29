import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (token?: string) => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// Types for our Supabase tables
export interface PodcastRecord {
  id: string;
  created_at: string;
  user_id: string;
  status: 'processing' | 'completed' | 'failed';
  duration: number;
  url?: string;
  topics: string[];
  metadata?: {
    topics: string[];
    article_count: number;
    target_duration_seconds: number;
    target_word_count: number;
    sources: Array<{
      url: string;
      title: string;
      source: string;
    }>;
    recording_date: string;
  };
  transcript?: string;
  message?: string;
  host_voice?: string;
  co_host_voice?: string;
  language?: string;
}

// Helper functions for podcast operations
export const podcastOperations = {
  async create(userId: string, podcastData: Partial<PodcastRecord>) {
    try {
      // Use the API endpoint instead of direct Supabase client
      // This will bypass RLS policies since the backend will handle authorization
      const response = await fetch('/api/podcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...podcastData, 
          user_id: userId 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in podcastOperations.create:', error);
      throw error;
    }
  },

  async getById(podcastId: string) {
    if (!podcastId) {
      throw new Error('Podcast ID is required');
    }
    
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (error) throw error;
    return data;
  },

  async getByUser(userId: string, page = 1, limit = 10) {
    if (!userId) {
      console.error('getByUser called without a userId');
      return { data: [], count: 0 };
    }
    
    console.log(`Querying Supabase for podcasts with user_id: ${userId}`);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data, error, count } = await supabase
        .from('podcasts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log(`Found ${count || 0} podcasts for user ${userId}`);
      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error in getByUser:', error);
      throw error;
    }
  },

  async updateStatus(podcastId: string, status: PodcastRecord['status'], message?: string) {
    const { data, error } = await supabase
      .from('podcasts')
      .update({ status, message })
      .eq('id', podcastId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAudio(podcastId: string, audioFile: File) {
    const { data, error } = await supabase
      .storage
      .from('podcast-audio')
      .upload(`${podcastId}.mp3`, audioFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    return data;
  }
};
