from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from imageComp import get_round_winner
from imageGen import generate_guess_image

app = FastAPI()

# Define the data structure for incoming requests
class JudgeRequest(BaseModel):
    original_image: str  # Can be a filename or a URL
    player_guesses: list[str]

@app.get("/")
def home():
    return {"status": "Online"}

@app.post("/judge")
async def judge_round(request: JudgeRequest):
    try:
        # Pass data to your imageComp logic
        leaderboard = get_round_winner(request.original_image, request.player_guesses)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
class PromptRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate_art(request: PromptRequest):
    # Pass the prompt from the user to your AI function
    path = generate_guess_image(request.prompt)
    
    if path:
        return {"status": "success", "image_path": path}
    else:
        raise HTTPException(status_code=500, detail="AI generation failed")