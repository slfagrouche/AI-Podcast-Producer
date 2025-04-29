import os
import logging
from supabase import create_client, Client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("check-database")

def check_database_podcasts():
    """
    Utility to check what podcasts exist in the database and their user IDs
    """
    # Get environment variables
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        print(f"Supabase URL: {'Set' if supabase_url else 'Not set'}")
        print(f"Supabase Service Key: {'Set' if supabase_service_key else 'Not set'}")
        logger.error("Supabase URL or Service Role Key not configured")
        return {"error": "Supabase configuration is missing"}
    
    print(f"Connecting to Supabase URL: {supabase_url}")
    
    # Initialize Supabase client with service key to bypass RLS
    supabase = create_client(supabase_url, supabase_service_key)
    
    try:
        # Get all podcasts
        print("Querying podcasts table...")
        response = supabase.table("podcasts").select("id, user_id, status, url").execute()
        
        if not response.data:
            print("No podcast records found in the database")
            return {"podcasts": []}
        
        # Display all podcasts and their user_ids
        podcasts = response.data
        print(f"Found {len(podcasts)} podcasts in the database")
        
        # Print each podcast ID, user ID, and status
        print("\nPodcast details:")
        for podcast in podcasts:
            print(f"ID: {podcast.get('id')}, User: {podcast.get('user_id')}, Status: {podcast.get('status')}, URL: {podcast.get('url', 'None')}")
        
        # Get unique user IDs
        user_ids = set(podcast.get('user_id') for podcast in podcasts if podcast.get('user_id'))
        print(f"\nUnique user IDs: {user_ids}")
        
        # Count by user_id
        user_counts = {}
        for podcast in podcasts:
            user_id = podcast.get('user_id')
            if user_id:
                user_counts[user_id] = user_counts.get(user_id, 0) + 1
                
        print(f"Podcast counts by user: {user_counts}")
        
        # Count by status
        status_counts = {}
        for podcast in podcasts:
            status = podcast.get('status')
            if status:
                status_counts[status] = status_counts.get(status, 0) + 1
                
        print(f"Podcast counts by status: {status_counts}")
        
        # Now test querying as if we were the frontend
        print("\nTesting frontend query for user_id=user_2wNeXyyGo1hYZZuoZ2QlV7yZwbO...")
        frontend_response = supabase.table("podcasts").select("*").eq("user_id", "user_2wNeXyyGo1hYZZuoZ2QlV7yZwbO").execute()
        
        if not frontend_response.data:
            print("Frontend query returned NO results - this confirms the RLS policy issue")
        else:
            print(f"Frontend query returned {len(frontend_response.data)} podcasts")
            
        return {
            "podcasts": podcasts,
            "unique_user_ids": list(user_ids),
            "user_counts": user_counts,
            "status_counts": status_counts
        }
        
    except Exception as e:
        print(f"Error checking database: {str(e)}")
        logger.error(f"Error checking database: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    print("Checking database podcasts...")
    results = check_database_podcasts()
    print(f"\nCheck complete!")