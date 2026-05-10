import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# 1. Load the token from your .env file
load_dotenv()
hf_token = os.getenv("HF_TOKEN")

# 2. Initialize the client
client = InferenceClient(api_key=hf_token)

def generate_guess_image(prompt: str):
    """
    Uses Hugging Face to generate an image from a player's prompt.
    """
    try:
        print(f"🎨 Generating image for: {prompt}...")
        
        # Using FLUX.1-schnell (optimzed for speed)
        image = client.text_to_image(
            prompt,
            model="black-forest-labs/FLUX.1-schnell"
        )
        
        # Save locally so imageComp.py can access it
        save_path = "current_guess.png"
        image.save(save_path)
        return save_path
        
    except Exception as e:
        print(f"❌ Error generating image: {e}")
        return None

if __name__ == "__main__":
    # This part only runs if you run this file directly
    test_path = generate_guess_image("umair alam")
    if test_path:
        print(f"✅ Success! Image saved to {test_path}")