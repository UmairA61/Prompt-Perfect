# Prompt Perfect 🎨✨

**The ultimate multiplayer challenge to master the art of prompting.**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://prompt-perfect-three.vercel.app/)
[![GitHub](https://img.shields.io/badge/Source-GitHub-blue?style=flat-square&logo=github)](https://github.com/UmairA61/Prompt-Perfect)
<img width="806" height="396" alt="image" src="https://github.com/user-attachments/assets/274fd10d-2fcf-4872-ae20-1a44d4db6b34" />


## Demo Video

[![Watch the demo](https://img.youtube.com/vi/ePE3gbgyHQg/hqdefault.jpg)](https://youtu.be/ePE3gbgyHQg)
---

## 🌟 Project Inspiration

In an era where Generative AI is reshaping industries, **prompt engineering** has emerged as a fundamental bridge between human intent and machine execution. However, learning to "talk to AI" often feels like a solitary, trial-and-error process. 

**Prompt Perfect** was born from the desire to gamify AI literacy. By turning the challenge of image recreation into a competitive social experience, we provide:

### 🚀 Impact & Usefulness
*   **Real-World Relevance:** As AI becomes ubiquitous, the ability to articulate precise descriptions is a high-value skill in creative, technical, and professional fields.
*   **Potential Impact:** It serves as an interactive playground for educators, hobbyists, and professionals to understand the nuances of diffusion models (how specific words change lighting, composition, and style).
*   **User Value:** Players aren't just playing a game; they are developing a mental model for how AI interprets language, all while having fun with friends.

---

## 🛠️ Tech Stack

Built with a high-concurrency architecture to ensure a seamless, real-time multiplayer experience.

*   **Frontend:** React 19 + Vite (JavaScript, HTML5, CSS3)
*   **Backend:** FastAPI (Python) with high-concurrency WebSocket support
*   **AI Engine:** Google Gemini (Imagen 3/4 for synthesis, 2.0 Flash Vision for semantic judging)
*   **Real-time:** WebSockets for instant game state synchronization
*   **Design & Media:** Figma (UI/UX) & Remotion (Programmatic video production)
*   **Infrastructure:** Vercel (Frontend & Serverless deployment)

---

## ✨ Features

-   **Multiplayer Lobbies:** Join friends via simple 6-character codes.
-   **Live Game State:** See who's ready, who's submitted, and who's currently "cooking" their prompts.
-   **AI-Powered Scoring:** Unlike simple pixel matching, our Gemini-based judge understands *meaning*. If the target is a "blue dragon," and you prompt "azure lizard," the judge recognizes the semantic closeness.
-   **Dynamic Gallery:** View every player's attempt side-by-side with the target image.
-   **Global Leaderboard:** Track scores across multiple rounds to crown the "Prompt Master."

---

## 🔄 Project Flow

1.  **Enter the Lobby:** Players gather and prepare for the challenge.
<img width="806" height="453" alt="image" src="https://github.com/user-attachments/assets/a4d23868-5e06-4942-b222-a752e81ae489" />


2.  **Analyze the Target:** A unique, AI-generated image is presented. Players have 60 seconds to "reverse-engineer" the prompt.
<img width="806" height="453" alt="image" src="https://github.com/user-attachments/assets/ad4b263e-56b3-4331-942c-444870739ae2" />


3.  **Submission:** Players craft their best prompt and submit.
<img width="806" height="453" alt="image" src="https://github.com/user-attachments/assets/20b43e61-f480-4292-9f7f-0e9d11ac6dcc" />


4.  **The Reveal & Judging:** The server generates images for all players simultaneously. The Gemini Vision Judge compares each attempt to the target.
<img width="806" height="453" alt="image" src="https://github.com/user-attachments/assets/e581458b-e8b6-4402-be52-a767cfc1a646" />


5.  **Victory:** The final leaderboard shows who best understood the AI's "brain."
<img width="806" height="453" alt="image" src="https://github.com/user-attachments/assets/fe34bad1-2f8e-4eb9-a4ec-75ff91df1fb7" />


---

## 🎮 How to Play

1.  Create a lobby or join an existing one using a code.
2.  Once the host starts the game, look at the **Target Image**.
3.  Write a prompt that you think will generate an image exactly like the target.
4.  Wait for the AI to "draw" everyone's guesses.
5.  Check your score and try to climb the leaderboard!

---

🏆 *Created for the GDGHacks 2026 @ UOFG.*
*Best UI/UX Winner*
