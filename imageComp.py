import torch
from sentence_transformers import SentenceTransformer, util
from PIL import Image

# Use the device-agnostic check we discussed
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
model = SentenceTransformer('clip-ViT-B-32', device=device)

def get_round_winner(original_img_path, guess_img_paths):

    # 1. Load all images into a list
    images = [Image.open(original_img_path)]
    for path in guess_img_paths:
        images.append(Image.open(path))

    # 2. Batch Encode (The efficient way)
    # This turns all images into a matrix of embeddings in one go
    embeddings = model.encode(images, convert_to_tensor=True)

    # 3. Separate the original from the guesses
    original_emb = embeddings[0]
    guess_embs = embeddings[1:]

    # 4. Compute similarities for everyone at once
    # util.cos_sim can compare one vector against many vectors
    scores = util.cos_sim(original_emb, guess_embs)[0]

    # 5. Format results
    results = []
    for i, score in enumerate(scores):
        results.append({
            "player_id": i + 1,
            "score": round(score.item() * 100, 2)
        })

    # Sort to find the winner (Highest score first)
    results.sort(key=lambda x: x['score'], reverse=True)
    return results