# peerprep

peer-paired mock interview platform. get matched with an engineer at your level, solve a real interview question together over live video and a shared code editor.

**live demo**: https://peerprep-rho.vercel.app

---

## architecture
client (react + vite)          vercel
 ↓ https / wss
backend (node + express)       render
 ├── socket.io (realtime)
 ├── y-websocket (crdt sync)
├── mongodb (atlas)
└── redis (upstash)
↓ http (internal)
ml service (python + fastapi)  render
└── tfidf recommender


---

## tech stack

**frontend**: react, vite, tailwindcss, zustand, react-router, socket.io-client, yjs, y-websocket, monaco editor, excalidraw, webrtc

**backend**: node 20, express, socket.io, mongoose, ioredis, jsonwebtoken, y-websocket (vendored), bcryptjs

**ml service**: python 3.12, fastapi, scikit-learn (tfidf), numpy, uvicorn

**infrastructure**: mongodb atlas, upstash redis, vercel (frontend), render (backend + ml)

---

## key engineering decisions

### webrtc with polite-peer signaling
1:1 peer-to-peer video using webrtc. implemented the polite-peer pattern to handle simultaneous offer collisions — the second peer to join always initiates. signaling over existing socket.io authenticated connection. ice candidates buffered until remote description is set. stun (google) + turn (openrelay) for nat traversal.

### yjs crdts for collaborative editing
code editor (monaco) and whiteboard (excalidraw) both sync via yjs, a crdt library. concurrent edits merge mathematically — no conflicts. two separate y-websocket rooms per session: one for code (`session:<id>:code`), one for whiteboard (`session:<id>:whiteboard`). namespaced to avoid protocol collisions. y-websocket vendored directly into the server to resolve a yjs v13/v14 version mismatch with `@y/websocket-server`.

### redis-backed matchmaking with race-condition-safe proposals
matchmaking queue stored in redis sorted set. matchmaker ticks every 2s, scores all waiting pairs using a weighted compatibility function (topic overlap, experience level, language overlap, role similarity), proposes the best match above a 0.4 threshold. proposal accept flow uses a per-proposal redis lock (`SET NX`) to prevent double-matching when both users accept simultaneously.

### elo-style per-topic skill rating
each user maintains a rating per topic (starting 1000). after each session, ratings update using peer feedback (1-5 stars) and difficulty feedback (too easy / right / too hard). k-factor decays from 32 to 8 as confidence grows. only topics covered by the attempted question update.

### two-stage question recommender
node proxy calls python fastapi ml service. ml service fits a tfidf vectorizer over all 45 questions. user's weak topics (rating < 1000) form a query string, cosine similarity scores candidates. final score: `0.35 * semantic + 0.40 * topic_overlap + 0.25 * difficulty_fit`. falls back gracefully to random questions if ml service is cold.

---

## features

- **smart matching**: scored on topics, experience level, programming languages, role, and availability
- **live video**: webrtc p2p video call with screen share, mute, camera toggle, voice activity indicator
- **collaborative editor**: monaco editor with real-time yjs sync, shared cursors, language switcher
- **collaborative whiteboard**: excalidraw with real-time yjs sync
- **question bank**: 45 curated problems across dsa, system design, behavioral, and ml fundamentals
- **session history**: code snapshot, question attempted, duration saved at session end
- **feedback system**: post-session peer rating and difficulty feedback
- **skill ratings**: per-topic elo-style ratings updated after every session
- **recommendations**: personalized question recommendations based on skill ratings and history

---

## running locally

### prerequisites
- node 20+
- python 3.12
- mongodb atlas account (free tier)
- upstash redis account (free tier)
- google cloud project with oauth credentials

### backend
```bash
cd server
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, REDIS_URL, ML_SERVICE_URL
npm run dev
```

### ml service
```bash
cd ml
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### frontend
```bash
cd client
npm install
cp .env.example .env
# fill in VITE_API_URL=http://localhost:4000, VITE_GOOGLE_CLIENT_ID
npm run dev
```

### seed questions
```bash
cd server
node scripts/seedQuestions.mjs
```

---

## project structure
peerprep/
├── client/          # react + vite frontend
├── server/          # node + express backend
│   ├── src/
│   │   ├── config/       # db, redis
│   │   ├── controllers/  # auth, matchmaking, sessions, feedback, skills, recommendations
│   │   ├── middleware/   # auth, error
│   │   ├── models/       # user, profile, session, question, feedback, skill rating
│   │   ├── routes/
│   │   ├── services/     # matchmaker, scoring, queue, skill rating
│   │   └── sockets/      # socket.io, signaling, y-websocket (vendored)
│   └── scripts/          # seed questions
└── ml/              # python fastapi ml service
└── main.py           # tfidf recommender

---

## known limitations

- ml service cold starts in ~5s on render free tier after 15min inactivity
- backend free tier spins down after 15min inactivity (first request takes ~30s)
- webrtc works on localhost and most networks with turn relay
- whiteboard sync has a 250ms debounce to avoid mid-stroke interference
- skill ratings require at least one completed session with a question selected

---

## what i would do differently at scale

- replace o(n²) matchmaker with bucketed pre-filtering by topic and level
- use a proper sfu (livekit or mediasoup) instead of mesh webrtc for 3+ participants
- run the ml service on a machine with >512mb ram to use sentence-transformers instead of tfidf
- add a proper job queue (bullmq) for the matchmaker instead of setinterval
- replace the yjs in-memory doc store with redis for horizontal scaling

---

built by nitish patil — ramaiah institute of technology, bengaluru