import os
import sys
import requests
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("supabase-rls-fix")

def apply_rls_fixes():
    """
    Apply RLS policy fixes to Supabase database
    """
    # Get environment variables
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        logger.error("Supabase URL or Service Role Key not configured")
        print("Error: Supabase URL or Service Role Key not configured")
        print("Please set the environment variables:")
        print("  export VITE_SUPABASE_URL=your_supabase_url")
        print("  export SUPABASE_SERVICE_ROLE_KEY=your_service_key")
        return False
    
    # Read the SQL file
    with open("supabase-rls-fix.sql", "r") as f:
        sql_contents = f.read()
    
    # Split into individual statements
    sql_statements = [stmt.strip() for stmt in sql_contents.split(';') if stmt.strip()]
    
    # PostgreSQL REST API endpoint for SQL queries
    sql_endpoint = f"{supabase_url}/rest/v1/rpc/exec_sql"
    
    headers = {
        "apikey": supabase_service_key,
        "Authorization": f"Bearer {supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "params=single-object"
    }
    
    success_count = 0
    error_count = 0
    
    # Execute each statement
    for i, statement in enumerate(sql_statements, 1):
        # Skip comment lines and blank lines
        if statement.strip().startswith('--') or not statement.strip():
            continue
            
        logger.info(f"Executing statement {i}: {statement[:60]}...")
        
        try:
            # Format for the RPC call
            payload = {
                "query": statement
            }
            
            response = requests.post(sql_endpoint, headers=headers, json=payload)
            
            if response.status_code == 200:
                logger.info(f"Statement {i} executed successfully")
                success_count += 1
            else:
                logger.error(f"Error executing statement {i}: {response.status_code} {response.text}")
                error_count += 1
                
        except Exception as e:
            logger.error(f"Exception executing statement {i}: {str(e)}")
            error_count += 1
    
    logger.info(f"Execution complete. Success: {success_count}, Errors: {error_count}")
    return success_count > 0 and error_count == 0

if __name__ == "__main__":
    print("Applying Supabase RLS fixes...")
    if apply_rls_fixes():
        print("RLS fixes applied successfully!")
    else:
        print("Failed to apply some or all RLS fixes. Check the log for details.")