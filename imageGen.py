"""
Image generation using HuggingFace Inference API.
Falls back to placeholder images if HF_TOKEN isn't set.
"""
import os
import uuid
import random
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
hf_token = os.getenv("HF_TOKEN")

HF_AVAILABLE = False

if hf_token:
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(api_key=hf_token)
        HF_AVAILABLE = True
    except ImportError:
        print("⚠️  huggingface_hub not installed. Using placeholder images.")
else:
    print("⚠️  HF_TOKEN not set. Using placeholder images.")


def generate_guess_image(prompt: str, save_path: str = None):
    """
    Uses Hugging Face to generate an image from a player's prompt.
    Falls back to a colored placeholder if HF isn't available.
    save_path: optional specific file path to save to. If None, generates a unique name.
    """
    if save_path is None:
        save_path = f"temp_gen_{uuid.uuid4().hex[:8]}.png"

    if HF_AVAILABLE:
        return _hf_generate(prompt, save_path)
    else:
        return _placeholder_generate(prompt, save_path)


def _hf_generate(prompt: str, save_path: str):
    """Generate with HuggingFace, with retry logic for robustness."""
    max_retries = 2
    # Enhance short/vague prompts to improve generation success
    enhanced_prompt = prompt
    if len(prompt.strip()) < 20:
        enhanced_prompt = f"{prompt}, detailed digital illustration, high quality"

    for attempt in range(max_retries + 1):
        try:
            print(f"🎨 Generating image for: {enhanced_prompt}... (attempt {attempt + 1})")
            
            image = client.text_to_image(
                enhanced_prompt,
                model="black-forest-labs/FLUX.1-schnell"
            )
            
            image.save(save_path)
            print(f"✅ Image saved to {save_path}")
            return save_path
            
        except Exception as e:
            print(f"⚠️  Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries:
                time.sleep(1)  # Brief pause before retry
            else:
                print(f"❌ All retries failed for: {prompt}")
                return _placeholder_generate(prompt, save_path)


def _placeholder_generate(prompt: str, save_path: str):
    """Generate a simple colored placeholder image for dev/demo."""
    try:
        from PIL import Image, ImageDraw
        
        r = random.randint(100, 220)
        g = random.randint(100, 220)
        b = random.randint(100, 220)
        
        img = Image.new("RGB", (512, 512), (r, g, b))
        draw = ImageDraw.Draw(img)
        
        for i in range(0, 512, 64):
            draw.line([(i, 0), (512, 512 - i)], fill=(r-30, g-30, b-30), width=2)
        
        text = prompt[:60] + ("..." if len(prompt) > 60 else "")
        draw.rectangle([(20, 400), (492, 492)], fill=(0, 0, 0))
        draw.text((30, 420), text, fill=(255, 255, 255))
        draw.text((30, 30), "DEMO MODE", fill=(255, 255, 255))
        
        img.save(save_path)
        return save_path
    except Exception as e:
        print(f"❌ Placeholder generation failed: {e}")
        return None


if __name__ == "__main__":
    test_path = generate_guess_image("test prompt")
    if test_path:
        print(f"✅ Success! Image saved to {test_path}")