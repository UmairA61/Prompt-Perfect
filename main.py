"""
Prompt Perfect — Game Server
FastAPI backend with WebSocket multiplayer, AI image generation, and CLIP comparison.
"""
import os
import uuid
import json
import time
import random
import string
import asyncio
import base64
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from imageComp import get_round_winner
from imageGen import generate_guess_image

load_dotenv()

app = FastAPI(title="Prompt Perfect")

# ── Directories ──────────────────────────────────────────────────────────
GENERATED_DIR = Path("generated_images")
GENERATED_DIR.mkdir(exist_ok=True)
TARGET_DIR = Path("target_images")
TARGET_DIR.mkdir(exist_ok=True)

# Serve generated images
app.mount("/images/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")
app.mount("/images/targets", StaticFiles(directory=str(TARGET_DIR)), name="targets")

# ── Target Image Pool ────────────────────────────────────────────────────
# Each entry: { "filename": str, "category": str, "prompt": str }
# These are the images players will try to recreate
TARGET_IMAGES = [
    {
        "id": "fantasy_1",
        "category": "Fantasy",
        "prompt": "A majestic dragon perched on a crystal mountain under a double moon sky, digital art",
        "filename": None,  # Will be generated on first use
    },
    {
        "id": "fantasy_2",
        "category": "Fantasy",
        "prompt": "An enchanted forest with glowing mushrooms and fireflies at twilight, fantasy painting",
        "filename": None,
    },
    {
        "id": "scifi_1",
        "category": "Sci-fi",
        "prompt": "A futuristic city floating above clouds at sunset with neon lights and flying cars",
        "filename": None,
    },
    {
        "id": "scifi_2",
        "category": "Sci-fi",
        "prompt": "A lone astronaut standing on an alien planet looking at a massive ringed planet in the sky",
        "filename": None,
    },
    {
        "id": "funny_1",
        "category": "Funny / Absurd",
        "prompt": "A cat wearing a tiny business suit giving a PowerPoint presentation to dogs",
        "filename": None,
    },
    {
        "id": "funny_2",
        "category": "Funny / Absurd",
        "prompt": "A penguin riding a skateboard through a shopping mall while wearing sunglasses",
        "filename": None,
    },
    {
        "id": "cinematic_1",
        "category": "Cinematic",
        "prompt": "A silhouette of a person standing on a cliff overlooking a vast ocean at golden hour, cinematic photography",
        "filename": None,
    },
    {
        "id": "cinematic_2",
        "category": "Cinematic",
        "prompt": "A rainy city street at night with neon reflections on wet pavement, moody film noir",
        "filename": None,
    },
    {
        "id": "mystery_1",
        "category": "Mystery",
        "prompt": "An abandoned Victorian mansion on a foggy hilltop with a single candle in the window",
        "filename": None,
    },
    {
        "id": "mystery_2",
        "category": "Mystery",
        "prompt": "A mysterious ancient door covered in glowing runes deep inside a dark cave",
        "filename": None,
    },
    {
        "id": "cute_1",
        "category": "Cute / Cozy",
        "prompt": "A tiny cottage with a thatched roof surrounded by wildflowers with smoke from the chimney",
        "filename": None,
    },
    {
        "id": "cute_2",
        "category": "Cute / Cozy",
        "prompt": "A fluffy baby fox sleeping next to a stack of books by a warm fireplace",
        "filename": None,
    },
]


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
        self.current_image_path = None
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
        self.settings = settings  # rounds, max_players, category
        self.phase = GamePhase.LOBBY
        self.players: dict[str, Player] = {}
        self.connections: dict[str, WebSocket] = {}

        # Round state
        self.current_round = 0
        self.total_rounds = settings.get("rounds", 5)
        self.max_players = settings.get("max_players", 8)
        self.category = settings.get("category", "Sci-fi")
        self.used_target_ids: list[str] = []

        # Current round data
        self.target_image = None  # {id, prompt, filename, url}
        self.round_start_time = None
        self.submissions: dict[str, dict] = {}  # player_id -> {prompt, image_path, score}
        self.round_results = []
        self.round_history = []  # [{round, winner_name, winner_score}]

        # Add host
        host = Player(host_id, host_name, is_host=True)
        host.ready = True
        self.players[host_id] = host

    def to_dict(self):
        return {
            "code": self.code,
            "phase": self.phase,
            "host_id": self.host_id,
            "settings": self.settings,
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "players": {pid: p.to_dict() for pid, p in self.players.items()},
            "target_image_url": f"/images/targets/{self.target_image['filename']}" if self.target_image and self.target_image.get("filename") else None,
            "round_start_time": self.round_start_time,
            "submissions_count": len(self.submissions),
            "round_results": self.round_results,
            "round_history": self.round_history,
        }


# In-memory store
lobbies: dict[str, GameLobby] = {}


def generate_lobby_code() -> str:
    """Generate a unique 3-letter + 3-digit lobby code."""
    while True:
        code = "".join(random.choices(string.ascii_uppercase, k=3)) + "-" + "".join(
            random.choices(string.digits, k=3)
        )
        if code not in lobbies:
            return code


# ── WebSocket Manager ─────────────────────────────────────────────────────
async def broadcast(lobby: GameLobby, message: dict, exclude: str = None):
    """Send a message to all connected players in a lobby."""
    dead = []
    for pid, ws in lobby.connections.items():
        if pid == exclude:
            continue
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(pid)
    for pid in dead:
        lobby.connections.pop(pid, None)


async def send_to(lobby: GameLobby, player_id: str, message: dict):
    """Send a message to a specific player."""
    ws = lobby.connections.get(player_id)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            lobby.connections.pop(player_id, None)


# ── REST Endpoints ────────────────────────────────────────────────────────
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


@app.get("/")
def home():
    return {"status": "Prompt Perfect Server Online"}


@app.post("/lobby/create")
async def create_lobby(req: CreateLobbyRequest):
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


@app.post("/lobby/join")
async def join_lobby(req: JoinLobbyRequest):
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

    # Broadcast to existing players
    await broadcast(
        lobby,
        {
            "type": "player_joined",
            "player": player.to_dict(),
            "player_count": len(lobby.players),
        },
    )

    return {"player_id": player_id, "lobby": lobby.to_dict()}


@app.get("/lobby/{code}")
async def get_lobby(code: str):
    lobby = lobbies.get(code.upper())
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    return {"lobby": lobby.to_dict()}


@app.post("/round/submit")
async def submit_prompt(req: SubmitPromptRequest):
    lobby = lobbies.get(req.lobby_code.upper())
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    if lobby.phase != GamePhase.ROUND_ACTIVE:
        raise HTTPException(status_code=400, detail="Round not active")
    if req.player_id not in lobby.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if req.player_id in lobby.submissions:
        raise HTTPException(status_code=400, detail="Already submitted")

    lobby.submissions[req.player_id] = {
        "prompt": req.prompt,
        "image_path": None,
        "score": None,
    }

    # Broadcast submission count
    await broadcast(
        lobby,
        {
            "type": "prompt_submitted",
            "player_id": req.player_id,
            "player_name": lobby.players[req.player_id].name,
            "submissions_count": len(lobby.submissions),
            "total_players": len(lobby.players),
        },
    )

    # If all players submitted, trigger generation
    if len(lobby.submissions) >= len(lobby.players):
        asyncio.create_task(run_generation(lobby))

    return {"status": "submitted"}


# ── Game Flow ─────────────────────────────────────────────────────────────
async def pick_target_image(lobby: GameLobby):
    """Select and generate a target image for the round."""
    category = lobby.category
    available = [
        t for t in TARGET_IMAGES
        if t["category"] == category and t["id"] not in lobby.used_target_ids
    ]

    if not available:
        # Reset used pool if we've seen all
        available = [t for t in TARGET_IMAGES if t["category"] == category]
        lobby.used_target_ids = []

    if not available:
        # Fallback to any category
        available = [t for t in TARGET_IMAGES if t["id"] not in lobby.used_target_ids]

    target = random.choice(available)
    lobby.used_target_ids.append(target["id"])

    # Generate the target image if not already on disk
    filename = f"target_{target['id']}.png"
    filepath = TARGET_DIR / filename

    if not filepath.exists():
        try:
            print(f"🎯 Generating target image: {target['prompt']}")
            result = generate_guess_image(target["prompt"], save_path=str(filepath))
            if not result:
                from PIL import Image as PILImage
                img = PILImage.new("RGB", (512, 512), (100, 150, 200))
                img.save(str(filepath))
        except Exception as e:
            print(f"❌ Error generating target: {e}")
            from PIL import Image as PILImage
            img = PILImage.new("RGB", (512, 512), (100, 150, 200))
            img.save(str(filepath))

    target["filename"] = filename
    return target


async def start_round(lobby: GameLobby):
    """Start a new round."""
    lobby.current_round += 1
    lobby.phase = GamePhase.ROUND_ACTIVE
    lobby.submissions = {}
    lobby.round_results = []

    # Pick target image
    lobby.target_image = await pick_target_image(lobby)
    lobby.round_start_time = time.time()

    await broadcast(
        lobby,
        {
            "type": "round_started",
            "round": lobby.current_round,
            "total_rounds": lobby.total_rounds,
            "target_image_url": f"/images/targets/{lobby.target_image['filename']}",
            "time_limit": 60,
        },
    )

    # Start timer - auto-end round after 65 seconds (5s grace)
    asyncio.create_task(round_timer(lobby, lobby.current_round))


async def round_timer(lobby: GameLobby, round_number: int):
    """Auto-trigger generation when timer expires."""
    await asyncio.sleep(65)
    # Only proceed if we're still in the same round and phase
    if lobby.current_round == round_number and lobby.phase == GamePhase.ROUND_ACTIVE:
        print(f"⏰ Timer expired for round {round_number}, triggering generation")
        await run_generation(lobby)


async def run_generation(lobby: GameLobby):
    """Generate images for all submitted prompts and compare."""
    lobby.phase = GamePhase.GENERATING

    await broadcast(lobby, {"type": "generating_started"})

    target_path = str(TARGET_DIR / lobby.target_image["filename"])
    guess_paths = []
    player_order = []

    # Generate images for each player submission
    for player_id, submission in lobby.submissions.items():
        player = lobby.players[player_id]
        try:
            # Generate with unique filename — direct save to avoid race conditions
            filename = f"round{lobby.current_round}_{player_id}.png"
            filepath = GENERATED_DIR / filename

            print(f"🎨 Generating for {player.name}: {submission['prompt']}")
            result = generate_guess_image(submission["prompt"], save_path=str(filepath))
            if not result:
                # Create placeholder on failure
                from PIL import Image as PILImage
                img = PILImage.new("RGB", (512, 512), (200, 100, 100))
                img.save(str(filepath))
            submission["image_path"] = filename
            guess_paths.append(str(filepath))
            player_order.append(player_id)

            await broadcast(
                lobby,
                {
                    "type": "player_generated",
                    "player_id": player_id,
                    "player_name": player.name,
                },
            )
        except Exception as e:
            print(f"❌ Generation error for {player.name}: {e}")

    # Compare all images
    if guess_paths:
        try:
            comparison_results = get_round_winner(target_path, guess_paths)
            # Map results back to players
            for result in comparison_results:
                idx = result["player_id"] - 1  # 1-indexed from imageComp
                if idx < len(player_order):
                    pid = player_order[idx]
                    lobby.submissions[pid]["score"] = result["score"]
                    lobby.players[pid].current_score = result["score"]
        except Exception as e:
            print(f"❌ Comparison error: {e}")
            # Assign random scores as fallback
            for pid in player_order:
                score = round(random.uniform(40, 95), 2)
                lobby.submissions[pid]["score"] = score
                lobby.players[pid].current_score = score

    # Build round results (sorted by score)
    results = []
    for pid, sub in lobby.submissions.items():
        player = lobby.players[pid]
        results.append({
            "player_id": pid,
            "player_name": player.name,
            "player_initials": player.initials,
            "player_color": player.color,
            "prompt": sub["prompt"],
            "image_url": f"/images/generated/{sub['image_path']}" if sub.get("image_path") else None,
            "score": sub.get("score", 0),
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    lobby.round_results = results

    # Award point to winner
    if results:
        winner = results[0]
        lobby.players[winner["player_id"]].points += 1
        lobby.round_history.append({
            "round": lobby.current_round,
            "winner_name": winner["player_name"],
            "winner_score": winner["score"],
        })

    # Players without submissions get 0
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

    await broadcast(
        lobby,
        {
            "type": "results_ready",
            "round": lobby.current_round,
            "target_image_url": f"/images/targets/{lobby.target_image['filename']}",
            "target_prompt": lobby.target_image["prompt"],
            "results": results,
            "round_history": lobby.round_history,
        },
    )


# ── WebSocket Endpoint ────────────────────────────────────────────────────
@app.websocket("/ws/{lobby_code}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, lobby_code: str, player_id: str):
    lobby = lobbies.get(lobby_code.upper())
    if not lobby:
        await websocket.close(code=4004, reason="Lobby not found")
        return

    if player_id not in lobby.players:
        await websocket.close(code=4004, reason="Player not in lobby")
        return

    await websocket.accept()
    lobby.connections[player_id] = websocket

    # Send current state
    await websocket.send_json({
        "type": "state_sync",
        "lobby": lobby.to_dict(),
    })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ready_toggle":
                player = lobby.players.get(player_id)
                if player:
                    player.ready = not player.ready
                    await broadcast(
                        lobby,
                        {
                            "type": "player_ready",
                            "player_id": player_id,
                            "ready": player.ready,
                        },
                    )

            elif msg_type == "start_game":
                if player_id != lobby.host_id:
                    continue
                if lobby.phase != GamePhase.LOBBY:
                    continue
                await start_round(lobby)

            elif msg_type == "next_round":
                if player_id != lobby.host_id:
                    continue
                if lobby.current_round >= lobby.total_rounds:
                    # Game over
                    lobby.phase = GamePhase.LEADERBOARD
                    # Build final leaderboard
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

                    await broadcast(
                        lobby,
                        {
                            "type": "game_over",
                            "leaderboard": leaderboard,
                            "round_history": lobby.round_history,
                        },
                    )
                else:
                    await start_round(lobby)

            elif msg_type == "force_generate":
                # Host can force generation even if not everyone submitted
                if player_id != lobby.host_id:
                    continue
                if lobby.phase == GamePhase.ROUND_ACTIVE and len(lobby.submissions) > 0:
                    asyncio.create_task(run_generation(lobby))

            elif msg_type == "play_again":
                if player_id != lobby.host_id:
                    continue
                # Reset game state
                lobby.current_round = 0
                lobby.used_target_ids = []
                lobby.round_history = []
                lobby.round_results = []
                lobby.submissions = {}
                for p in lobby.players.values():
                    p.points = 0
                    p.current_score = None
                lobby.phase = GamePhase.LOBBY
                await broadcast(lobby, {"type": "game_reset", "lobby": lobby.to_dict()})

            elif msg_type == "close_lobby":
                # Host closes lobby — kick everyone
                if player_id != lobby.host_id:
                    continue
                await broadcast(lobby, {"type": "lobby_closed", "reason": "Host closed the lobby"})
                # Close all WebSocket connections
                for pid, ws in list(lobby.connections.items()):
                    try:
                        await ws.close(code=1000, reason="Lobby closed")
                    except Exception:
                        pass
                lobbies.pop(lobby.code, None)
                return  # Exit WS handler

            elif msg_type == "leave_lobby":
                # Player leaves lobby
                lobby.connections.pop(player_id, None)
                lobby.players.pop(player_id, None)
                await broadcast(lobby, {
                    "type": "player_left",
                    "player_id": player_id,
                    "player_count": len(lobby.players),
                })
                try:
                    await websocket.close(code=1000, reason="You left the lobby")
                except Exception:
                    pass
                return  # Exit WS handler
# fake comment
    except WebSocketDisconnect:
        lobby.connections.pop(player_id, None)
        player = lobby.players.get(player_id)
        if player:
            is_host = (player_id == lobby.host_id)
            # Remove from players if in lobby phase, keep if mid-game for scores
            if lobby.phase == GamePhase.LOBBY:
                lobby.players.pop(player_id, None)

            # Host transfer if host disconnected mid-game
            if is_host and lobby.players:
                new_host_id = next(iter(lobby.players))
                lobby.host_id = new_host_id
                lobby.players[new_host_id].is_host = True
                await broadcast(lobby, {
                    "type": "host_transferred",
                    "new_host_id": new_host_id,
                    "new_host_name": lobby.players[new_host_id].name,
                })
                print(f"👑 Host transferred to {lobby.players[new_host_id].name}")
            elif is_host and not lobby.players:
                # No players left, clean up lobby
                lobbies.pop(lobby.code, None)
                return

            await broadcast(
                lobby,
                {
                    "type": "player_disconnected",
                    "player_id": player_id,
                    "player_name": player.name,
                    "player_count": len(lobby.players),
                },
            )
    except Exception as e:
        print(f"WebSocket error: {e}")
        lobby.connections.pop(player_id, None)


# Keep the original endpoints for backwards compat
class JudgeRequest(BaseModel):
    original_image: str
    player_guesses: list[str]


class PromptRequest(BaseModel):
    prompt: str


@app.post("/judge")
async def judge_round(request: JudgeRequest):
    try:
        leaderboard = get_round_winner(request.original_image, request.player_guesses)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate")
async def generate_art(request: PromptRequest):
    path = generate_guess_image(request.prompt)
    if path:
        return {"status": "success", "image_path": path}
    else:
        raise HTTPException(status_code=500, detail="AI generation failed")