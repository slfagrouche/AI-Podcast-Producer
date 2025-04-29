import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def test_openai_initialization():
    print("Testing OpenAI client initialization")
    
    # The correct way to initialize the OpenAI client without proxies
    # Only passing the API key to avoid proxy configuration issues
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Test a simple completion to verify it works
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ]
        )
        print("Success! OpenAI client initialized correctly.")
        print(f"Response: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_openai_initialization()
