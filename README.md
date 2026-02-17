Demo video :-
https://drive.google.com/file/d/1Gm6D5T4XnOIr7xpxMWxim8zWp1pDfEpx/view?usp=sharing

i have uploaded the video on drive here's the link.

BrainBolt 🚀
Adaptive Infinite Quiz Platform

BrainBolt is an adaptive infinite quiz platform that serves one question at a time and dynamically adjusts difficulty based on user performance.

The system prevents instability (difficulty ping-pong), supports streak multipliers, and maintains real-time leaderboards for both total score and max streak.

🚀 Features

    Adaptive difficulty algorithm with stabilization (confidence score + rolling window + hysteresis)

    One-question-at-a-time quiz flow

    Streak-based scoring multiplier (capped)

    Real-time leaderboards (score & streak)

    Idempotent answer submission

    Optimistic locking using stateVersion

    Redis caching (user state, question pools, leaderboards)

    Rate limiting (sliding window)

    Fully Dockerized stack

🏗 Tech Stack

    Frontend & Backend:

    Next.js 14 (App Router)

    React + TypeScript

    Database:

    MongoDB

    Caching & Rate Limiting:

    Redis

    Containerization:

    Docker + Docker Compose

📦 How to Run (Single Command)

    Make sure Docker is installed.

    Run:-

    docker compose up --build

    Then open:

    http://localhost:3000

    This command:

    Starts MongoDB

    Starts Redis

    Builds the Next.js app

    Seeds questions automatically

    Runs the full stack