"""
Image generation using the Gemini API (google-genai) with gemini-3.1-flash-image-preview.
Falls back to placeholder images if GEMINI_API_KEY isn't set.
"""
import os
import uuid
import random
import time
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-image-preview")

GEMINI_AVAILABLE = False
gemini_client = None
genai_types = None
GEMINI_INIT_ERROR = ""

if GEMINI_API_KEY:
    try:
        from google import genai
        from google.genai import types as _genai_types
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        genai_types = _genai_types
        GEMINI_AVAILABLE = True
    except ImportError as e:
        GEMINI_INIT_ERROR = f"ImportError: {e}"
        print(f"⚠️  google-genai not installed: {e}. Using placeholder images.")
    except Exception as e:
        GEMINI_INIT_ERROR = f"{type(e).__name__}: {e}"
        print(f"⚠️  Gemini init failed: {e}. Using placeholder images.")
else:
    GEMINI_INIT_ERROR = "GEMINI_API_KEY not set"
    print("⚠️  GEMINI_API_KEY not set. Using placeholder images.")


def generate_guess_image(prompt: str, save_path: str = None):
    """
    Generate an image from a prompt using the Gemini API.
    Falls back to a colored placeholder if the API isn't available.
    save_path: optional file path. If None, generates a unique name.
    """
    if save_path is None:
        save_path = f"temp_gen_{uuid.uuid4().hex[:8]}.png"

    if GEMINI_AVAILABLE:
        return _gemini_generate(prompt, save_path)
    return _placeholder_generate(prompt, save_path)


def _gemini_generate(prompt: str, save_path: str):
    """Generate image with Gemini API, with retry logic."""
    max_retries = 2
    enhanced_prompt = prompt
    if len(prompt.strip()) < 20:
        enhanced_prompt = f"{prompt}, detailed digital illustration, high quality"

    for attempt in range(max_retries + 1):
        start = time.time()
        try:
            print(f"🎨 Gemini generating ({GEMINI_MODEL}): {enhanced_prompt[:60]}... (attempt {attempt + 1})")
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=enhanced_prompt,
            )
            elapsed = time.time() - start

            for cand in (response.candidates or []):
                content = getattr(cand, "content", None)
                if not content:
                    continue
                for part in (content.parts or []):
                    inline = getattr(part, "inline_data", None)
                    if inline and getattr(inline, "data", None):
                        img_bytes = inline.data
                        with open(save_path, "wb") as f:
                            f.write(img_bytes)
                        print(f"✅ Image saved to {save_path} ({len(img_bytes)} bytes in {elapsed:.1f}s)")
                        return save_path

            print(f"⚠️  No image parts in response after {elapsed:.1f}s")
        except Exception as e:
            elapsed = time.time() - start
            print(f"⚠️  Attempt {attempt + 1} failed after {elapsed:.1f}s: {type(e).__name__}: {e}")

        if attempt < max_retries:
            time.sleep(1)

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
            draw.line([(i, 0), (512, 512 - i)], fill=(r - 30, g - 30, b - 30), width=2)

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
