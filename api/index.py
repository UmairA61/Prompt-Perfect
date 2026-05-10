"""
Prompt Perfect — Vercel Serverless API
Single FastAPI function handling all game logic.
Image generation uses the Gemini API (google-genai) with an API key.
Images are returned as base64 data URLs embedded in JSON to avoid
stateless-serverless in-memory storage issues.
"""
import os
import uuid
import time
import random
import string
import io
import base64
import traceback
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── Gemini API Setup ──────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-image-preview")

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
    except Exception as e:
        GEMINI_INIT_ERROR = f"{type(e).__name__}: {e}"
else:
    GEMINI_INIT_ERROR = "GEMINI_API_KEY environment variable not set"

app = FastAPI(title="Prompt Perfect")

# ── In-Memory Stores ─────────────────────────────────────────────────────
lobbies: dict = {}  # code -> GameLobby

# ── Target Image Pool ────────────────────────────────────────────────────
TARGET_IMAGES = [
    {"id": "fantasy_1", "category": "Fantasy", "prompt": "A majestic dragon perched on a crystal mountain under a double moon sky, digital art"},
    {"id": "fantasy_2", "category": "Fantasy", "prompt": "An enchanted forest with glowing mushrooms and fireflies at twilight, fantasy painting"},
    {"id": "scifi_1", "category": "Sci-fi", "prompt": "A futuristic city floating above clouds at sunset with neon lights and flying cars"},
    {"id": "scifi_2", "category": "Sci-fi", "prompt": "A lone astronaut standing on an alien planet looking at a massive ringed planet in the sky"},
    {"id": "funny_1", "category": "Funny / Absurd", "prompt": "A cat wearing a tiny business suit giving a PowerPoint presentation to dogs"},
    {"id": "funny_2", "category": "Funny / Absurd", "prompt": "A penguin riding a skateboard through a shopping mall while wearing sunglasses"},
    {"id": "cinematic_1", "category": "Cinematic", "prompt": "A silhouette of a person standing on a cliff overlooking a vast ocean at golden hour, cinematic photography"},
    {"id": "cinematic_2", "category": "Cinematic", "prompt": "A rainy city street at night with neon reflections on wet pavement, moody film noir"},
    {"id": "mystery_1", "category": "Mystery", "prompt": "An abandoned Victorian mansion on a foggy hilltop with a single candle in the window"},
    {"id": "mystery_2", "category": "Mystery", "prompt": "A mysterious ancient door covered in glowing runes deep inside a dark cave"},
    {"id": "cute_1", "category": "Cute / Cozy", "prompt": "A tiny cottage with a thatched roof surrounded by wildflowers with smoke from the chimney"},
    {"id": "cute_2", "category": "Cute / Cozy", "prompt": "A fluffy baby fox sleeping next to a stack of books by a warm fireplace"},
]


# ── Image Generation ──────────────────────────────────────────────────────
def generate_image_data_url(prompt: str) -> str:
    """Generate an image via Gemini API (google-genai) and return as data URL."""
    if not GEMINI_AVAILABLE:
        print(f"[IMG] Gemini not available: {GEMINI_INIT_ERROR}. Using placeholder.")
        return _bytes_to_data_url(_make_placeholder(prompt))

    gen_prompt = prompt.strip()
    if len(gen_prompt) < 15:
        gen_prompt = f"{gen_prompt}, detailed digital illustration, vibrant colors, high quality, 4k"

    start = time.time()
    try:
        print(f"[IMG] Gemini generate model={GEMINI_MODEL} prompt='{gen_prompt[:60]}...'")
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=gen_prompt,
            config=genai_types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
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
                    mime = getattr(inline, "mime_type", None) or "image/png"
                    print(f"[IMG] SUCCESS Gemini: {len(img_bytes)} bytes ({mime}) in {elapsed:.1f}s")
                    b64 = base64.b64encode(img_bytes).decode("ascii")
                    return f"data:{mime};base64,{b64}"

        print(f"[IMG] Gemini returned no image parts after {elapsed:.1f}s")
    except Exception as e:
        elapsed = time.time() - start
        print(f"[IMG] Gemini FAILED after {elapsed:.1f}s: {type(e).__name__}: {e}")
        traceback.print_exc()

    print(f"[IMG] Falling back to placeholder for '{prompt[:50]}'")
    return _bytes_to_data_url(_make_placeholder(prompt))


def _bytes_to_data_url(img_bytes: bytes) -> str:
    """Convert raw PNG bytes to a data URL."""
    b64 = base64.b64encode(img_bytes).decode("ascii")
    return f"data:image/png;base64,{b64}"


def _make_placeholder(prompt: str) -> bytes:
    """Generate a colored placeholder PNG."""
    try:
        from PIL import Image, ImageDraw
        r, g, b = random.randint(100, 220), random.randint(100, 220), random.randint(100, 220)
        img = Image.new("RGB", (512, 512), (r, g, b))
        draw = ImageDraw.Draw(img)
        for i in range(0, 512, 64):
            draw.line([(i, 0), (512, 512 - i)], fill=(r - 30, g - 30, b - 30), width=2)
        text = prompt[:60] + ("..." if len(prompt) > 60 else "")
        draw.rectangle([(20, 400), (492, 492)], fill=(0, 0, 0))
        draw.text((30, 420), text, fill=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception:
        return base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )


# ── Game State ────────────────────────────────────────────────────────────
class GamePhase:
    LOBBY = "lobby"
    ROUND_ACTIVE = "round_active"
    GENERATING = "generating"
    RESULTS = "results"
    LEADERBOARD = "leaderboard"


class Player:
    def __init__(self, player_id: str, name: str, is_host: bool = False):
        self.id = player_id
        self.name = name
        self.is_host = is_host
        self.ready = False
        self.points = 0
        self.current_prompt = None
        self.current_score = None
        self.color = random.choice(["pink", "sky", "lime", "lemon", "violet", "orange"])
        self.initials = name[:2].upper()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "initials": self.initials,
            "color": self.color,
            "is_host": self.is_host,
            "ready": self.ready,
            "points": self.points,
        }


class GameLobby:
    def __init__(self, code: str, host_id: str, host_name: str, settings: dict):
        self.code = code
        self.host_id = host_id
        self.settings = settings
        self.phase = GamePhase.LOBBY
        self.players: dict[str, Player] = {}

        self.current_round = 0
        self.total_rounds = settings.get("rounds", 5)
        self.max_players = settings.get("max_players", 8)
        self.category = settings.get("category", "Sci-fi")
        self.used_target_ids: list[str] = []

        self.target_image = None
        self.target_image_data_url = None  # base64 data URL
        self.round_start_time = None
        self.submissions: dict[str, dict] = {}
        self.round_results = []
        self.round_history = []

        # Event queues for polling (replaces WebSocket)
        self.event_queues: dict[str, list] = {}
        self.last_seen: dict[str, float] = {}

        # Add host
        host = Player(host_id, host_name, is_host=True)
        host.ready = True
        self.players[host_id] = host
        self.event_queues[host_id] = []
        self.last_seen[host_id] = time.time()

    def to_dict(self):
        return {
            "code": self.code,
            "phase": self.phase,
            "host_id": self.host_id,
            "settings": self.settings,
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "players": {pid: p.to_dict() for pid, p in self.players.items()},
            "target_image_url": self.target_image_data_url,
            "round_start_time": self.round_start_time,
            "submissions_count": len(self.submissions),
            "round_results": self.round_results,
            "round_history": self.round_history,
        }


def push_event(lobby: GameLobby, event: dict, exclude: str = None):
    """Push an event to all players' queues."""
    for pid in lobby.players:
        if pid != exclude:
            if pid not in lobby.event_queues:
                lobby.event_queues[pid] = []
            lobby.event_queues[pid].append(event)


def generate_lobby_code() -> str:
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=3)) + "-" + "".join(
            random.choices(string.digits, k=3)
        )
        if code not in lobbies:
            return code


def pick_target_image(lobby: GameLobby) -> dict:
    """Select a target image for the round."""
    category = lobby.category
    available = [t for t in TARGET_IMAGES if t["category"] == category and t["id"] not in lobby.used_target_ids]
    if not available:
        available = [t for t in TARGET_IMAGES if t["category"] == category]
        lobby.used_target_ids = []
    if not available:
        available = [t for t in TARGET_IMAGES if t["id"] not in lobby.used_target_ids]
    target = random.choice(available)
    lobby.used_target_ids.append(target["id"])
    return target


def run_comparison(lobby: GameLobby):
    """Compare all submitted images (random scoring since CLIP isn't available in serverless)."""
    results = []
    for pid, sub in lobby.submissions.items():
        player = lobby.players[pid]
        score = round(random.uniform(45, 95), 2)
        sub["score"] = score
        player.current_score = score
        results.append({
            "player_id": pid,
            "player_name": player.name,
            "player_initials": player.initials,
            "player_color": player.color,
            "prompt": sub["prompt"],
            "image_url": sub.get("image_data_url"),
            "score": score,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    lobby.round_results = results

    if results:
        winner = results[0]
        lobby.players[winner["player_id"]].points += 1
        lobby.round_history.append({
            "round": lobby.current_round,
            "winner_name": winner["player_name"],
            "winner_score": winner["score"],
        })

    # Add entries for players who didn't submit
    for pid in lobby.players:
        if pid not in lobby.submissions:
            results.append({
                "player_id": pid,
                "player_name": lobby.players[pid].name,
                "player_initials": lobby.players[pid].initials,
                "player_color": lobby.players[pid].color,
                "prompt": "(no submission)",
                "image_url": None,
                "score": 0,
            })

    lobby.phase = GamePhase.RESULTS
    push_event(lobby, {
        "type": "results_ready",
        "round": lobby.current_round,
        "target_image_url": lobby.target_image_data_url,
        "target_prompt": lobby.target_image["prompt"],
        "results": results,
        "round_history": lobby.round_history,
    })


# ── Request Models ────────────────────────────────────────────────────────
class CreateLobbyRequest(BaseModel):
    host_name: str
    rounds: int = 5
    max_players: int = 8
    category: str = "Sci-fi"


class JoinLobbyRequest(BaseModel):
    code: str
    player_name: str


class SubmitPromptRequest(BaseModel):
    lobby_code: str
    player_id: str
    prompt: str


class GameActionRequest(BaseModel):
    lobby_code: str
    player_id: str
    action: str  # start_game, next_round, force_generate, play_again, ready_toggle, close_lobby, leave_lobby


# ── API Endpoints ─────────────────────────────────────────────────────────
@app.get("/api")
def root():
    return {
        "status": "Prompt Perfect Server Online",
        "gemini_available": GEMINI_AVAILABLE,
        "gemini_api_key_set": bool(GEMINI_API_KEY),
        "gemini_error": GEMINI_INIT_ERROR if not GEMINI_AVAILABLE else None,
        "model": GEMINI_MODEL,
    }


@app.post("/api/lobby/create")
def create_lobby(req: CreateLobbyRequest):
    code = generate_lobby_code()
    host_id = str(uuid.uuid4())[:8]
    lobby = GameLobby(
        code=code,
        host_id=host_id,
        host_name=req.host_name,
        settings={
            "rounds": req.rounds,
            "max_players": req.max_players,
            "category": req.category,
        },
    )
    lobbies[code] = lobby
    return {"code": code, "host_id": host_id, "lobby": lobby.to_dict()}


@app.post("/api/lobby/join")
def join_lobby(req: JoinLobbyRequest):
    code = req.code.upper().strip()
    lobby = lobbies.get(code)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    if lobby.phase != GamePhase.LOBBY:
        raise HTTPException(status_code=400, detail="Game already in progress")
    if len(lobby.players) >= lobby.max_players:
        raise HTTPException(status_code=400, detail="Lobby is full")

    player_id = str(uuid.uuid4())[:8]
    player = Player(player_id, req.player_name)
    lobby.players[player_id] = player
    lobby.event_queues[player_id] = []
    lobby.last_seen[player_id] = time.time()

    push_event(lobby, {
        "type": "player_joined",
        "player": player.to_dict(),
        "player_count": len(lobby.players),
    }, exclude=player_id)

    return {"player_id": player_id, "lobby": lobby.to_dict()}


@app.get("/api/lobby/{code}")
def get_lobby(code: str):
    lobby = lobbies.get(code.upper())
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    return {"lobby": lobby.to_dict()}


@app.post("/api/round/submit")
def submit_prompt(req: SubmitPromptRequest):
    lobby = lobbies.get(req.lobby_code.upper())
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    if lobby.phase != GamePhase.ROUND_ACTIVE:
        raise HTTPException(status_code=400, detail="Round not active")
    if req.player_id not in lobby.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if req.player_id in lobby.submissions:
        raise HTTPException(status_code=400, detail="Already submitted")

    # Generate this player's image immediately → returns base64 data URL
    image_data_url = generate_image_data_url(req.prompt)

    lobby.submissions[req.player_id] = {
        "prompt": req.prompt,
        "image_data_url": image_data_url,
        "score": None,
    }

    push_event(lobby, {
        "type": "prompt_submitted",
        "player_id": req.player_id,
        "player_name": lobby.players[req.player_id].name,
        "submissions_count": len(lobby.submissions),
        "total_players": len(lobby.players),
    })

    # If all players submitted, run comparison
    if len(lobby.submissions) >= len(lobby.players):
        run_comparison(lobby)

    return {"status": "submitted"}


@app.get("/api/poll/{code}/{player_id}")
def poll_events(code: str, player_id: str):
    lobby = lobbies.get(code.upper())
    if not lobby:
        return {"events": [{"type": "lobby_closed", "reason": "Lobby not found"}], "lobby": None}

    if player_id not in lobby.players:
        return {"events": [{"type": "lobby_closed", "reason": "You are not in this lobby"}], "lobby": None}

    lobby.last_seen[player_id] = time.time()

    events = lobby.event_queues.get(player_id, [])
    lobby.event_queues[player_id] = []

    return {"events": events, "lobby": lobby.to_dict()}


@app.post("/api/game/action")
def game_action(req: GameActionRequest):
    lobby = lobbies.get(req.lobby_code.upper())
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    if req.player_id not in lobby.players:
        raise HTTPException(status_code=404, detail="Player not found")

    action = req.action

    if action == "ready_toggle":
        player = lobby.players.get(req.player_id)
        if player:
            player.ready = not player.ready
            push_event(lobby, {
                "type": "player_ready",
                "player_id": req.player_id,
                "ready": player.ready,
            })

    elif action == "start_game":
        if req.player_id != lobby.host_id:
            raise HTTPException(status_code=403, detail="Only host can start")
        if lobby.phase != GamePhase.LOBBY:
            raise HTTPException(status_code=400, detail="Game not in lobby phase")
        _start_round(lobby)

    elif action == "next_round":
        if req.player_id != lobby.host_id:
            raise HTTPException(status_code=403, detail="Only host can advance")
        if lobby.current_round >= lobby.total_rounds:
            # Game over
            lobby.phase = GamePhase.LEADERBOARD
            leaderboard = []
            for pid, p in lobby.players.items():
                leaderboard.append({
                    "player_id": pid,
                    "player_name": p.name,
                    "player_initials": p.initials,
                    "player_color": p.color,
                    "points": p.points,
                })
            leaderboard.sort(key=lambda x: x["points"], reverse=True)
            push_event(lobby, {
                "type": "game_over",
                "leaderboard": leaderboard,
                "round_history": lobby.round_history,
            })
        else:
            _start_round(lobby)

    elif action == "force_generate":
        if req.player_id != lobby.host_id:
            raise HTTPException(status_code=403, detail="Only host can force generate")
        if lobby.phase == GamePhase.ROUND_ACTIVE and len(lobby.submissions) > 0:
            run_comparison(lobby)

    elif action == "play_again":
        if req.player_id != lobby.host_id:
            raise HTTPException(status_code=403, detail="Only host can restart")
        lobby.current_round = 0
        lobby.used_target_ids = []
        lobby.round_history = []
        lobby.round_results = []
        lobby.submissions = {}
        lobby.target_image_data_url = None
        for p in lobby.players.values():
            p.points = 0
            p.current_score = None
        lobby.phase = GamePhase.LOBBY
        push_event(lobby, {"type": "game_reset", "lobby": lobby.to_dict()})

    elif action == "close_lobby":
        if req.player_id != lobby.host_id:
            raise HTTPException(status_code=403, detail="Only host can close")
        push_event(lobby, {"type": "lobby_closed", "reason": "Host closed the lobby"})
        lobbies.pop(lobby.code, None)

    elif action == "leave_lobby":
        lobby.players.pop(req.player_id, None)
        lobby.event_queues.pop(req.player_id, None)
        lobby.last_seen.pop(req.player_id, None)
        push_event(lobby, {
            "type": "player_left",
            "player_id": req.player_id,
            "player_count": len(lobby.players),
        })

    return {"status": "ok"}


# ── Helpers ───────────────────────────────────────────────────────────────
def _start_round(lobby: GameLobby):
    """Start a new round: pick target, generate target image, notify players."""
    lobby.current_round += 1
    lobby.phase = GamePhase.ROUND_ACTIVE
    lobby.submissions = {}
    lobby.round_results = []

    target = pick_target_image(lobby)
    lobby.target_image = target
    lobby.target_image_data_url = generate_image_data_url(target["prompt"])
    lobby.round_start_time = time.time()

    push_event(lobby, {
        "type": "round_started",
        "round": lobby.current_round,
        "total_rounds": lobby.total_rounds,
        "target_image_url": lobby.target_image_data_url,
        "time_limit": 60,
    })
