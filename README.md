DocSpace 🚀

A full-stack web application built with a Node.js + Express backend and a modern frontend (Vite/React), fully Dockerized for easy development and collaboration.

💡 One command setup — no need to install Node.js or manage dependencies locally.

⸻

🧱 Tech Stack

Backend
	•	Node.js
	•	Express
	•	JWT Authentication
	•	bcrypt
	•	MongoDB / API-ready (if applicable)

Frontend
	•	React (Vite)
	•	Modern ES Modules

DevOps
	•	Docker
	•	Docker Compose

⸻

📁 Project Structure

DocSpace/
├── docker-compose.yml        # Orchestrates frontend + backend
│
├── back/
│   └── server/
│       ├── Dockerfile        # Backend Docker setup
│       ├── .dockerignore
│       ├── package.json
│       ├── package-lock.json
│       ├── server.js
│       ├── .env.example
│       └── .env              # (NOT committed)
│
└── front/
    ├── Dockerfile            # Frontend Docker setup
    ├── .dockerignore
    ├── package.json
    ├── package-lock.json
    └── src/


⸻

⚙️ Prerequisites

You only need:
	•	Docker Desktop (Mac / Windows / Linux)

👉 No Node.js, npm, or other tools required.

⸻

🚀 Getting Started (For Collaborators)

1️⃣ Clone the repository

git clone <REPO_URL>
cd DocSpace


⸻

2️⃣ Setup environment variables

Create a .env file for the backend:

cp back/server/.env.example back/server/.env

Edit the .env file and add required secrets (JWT secret, DB URL, etc.).

⚠️ Never commit .env files.

⸻

3️⃣ Run the full project (ONE command)

docker compose up --build

⏳ First run may take a few minutes (Docker builds images).

⸻

4️⃣ Access the app

Service	URL
Backend	http://localhost:3000
Frontend	http://localhost:5173


⸻

🔁 Daily Development Commands

Start containers

docker compose up

Stop containers

docker compose down

Rebuild after dependency changes

docker compose up --build

View running containers

docker ps


⸻

🧪 Running Services Individually (Optional)

Backend only

cd back/server
docker build -t backend-server .
docker run -p 3000:3000 backend-server

Frontend only

cd front
docker build -t frontend-app .
docker run -p 5173:5173 frontend-app


⸻

🛑 Common Issues & Fixes

❌ no configuration file provided: not found

✔ Make sure:
	•	You are inside the DocSpace/ directory
	•	docker-compose.yml exists
	•	Docker Desktop is running

⸻

❌ Port already in use

Stop existing containers:

docker compose down

Or change ports in docker-compose.yml.

⸻

❌ Containers not updating after code change

Rebuild:

docker compose up --build


⸻

🔐 Security Notes
	•	.env files are ignored by Git
	•	Do not expose secrets in Dockerfiles
	•	Use .env.example for sharing variable names

⸻

👥 Collaboration Rules
	•	Do NOT commit node_modules
	•	Do NOT commit .env
	•	Always use Docker to run the project
	•	Update .env.example if new env variables are added

⸻

🧠 Why Docker?
	•	Same environment for everyone
	•	No “works on my machine” issues
	•	Easy onboarding for new collaborators
	•	Production-ready workflow

⸻

📌 Future Improvements
	•	Production frontend build (Nginx)
	•	Database container (MongoDB / PostgreSQL)
	•	Hot reload with Docker volumes
	•	CI/CD pipeline

⸻

📄 License

ISC License

⸻

🙌 Maintainers

Built with ❤️ by the DocSpace team.