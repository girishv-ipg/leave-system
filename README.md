# 🏢 Leave System — Dockerized Setup

This project is a **fully containerized Leave Management System** built with:
- **Next.js (Frontend)**
- **Node.js (Backend)**
- **MongoDB (Database)**

Everything is managed using **Docker Compose**, so you can start the entire system with just a few commands — no manual configuration needed.

---

## 🚀 Quick Start Guide

### 🧩 Prerequisites
Before starting, make sure you have:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## 🏗️ Build the Containers

Run the following command to build the Docker images:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=localhost
```

You can replace `localhost` with your preferred hostname, for example:
```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=ipgwk10021
```
or
```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=ipgnb10353
```

### 🧠 What this does
- The **`NEXT_PUBLIC_API_BASE_URL`** argument tells the frontend where to find the backend API.
- It’s baked into the frontend build during the Docker image creation process.
- Use:
  - `localhost` → for local development.
  - `ipgwk10021`, `ipgnb10353`, or any hostname → for other servers or networked setups.

---

## ▶️ Run the Application

After building, start the containers using:

```bash
docker compose up -d
```

The `-d` flag runs everything in the background (detached mode).

Once started:
- 🌐 **Frontend:** http://localhost:3000  
- ⚙️ **Backend API:** http://localhost:4000  
- 💾 **MongoDB:** port `17017` (internal to Docker)

---

## 🧰 Useful Commands

| Purpose | Command |
|----------|----------|
| View running containers | `docker ps` |
| Stop all containers | `docker compose down` |
| Stop + remove volumes (reset DB) | `docker compose down --volumes` |
| Rebuild images from scratch | `docker compose build --no-cache` |
| View real-time logs | `docker compose logs -f` |

---

## 🧾 Notes

- MongoDB data is stored persistently in the `mongo_data/` folder (automatically ignored by Git).
- Environment variables are defined in the `.env` file.
- If you modify `.env`, always **rebuild** your images to apply changes:
  ```bash
  docker compose build --no-cache
  ```

---

## ✅ Example Workflow

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd leave-system

# 2. Build the Docker images
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=localhost

# 3. Start the stack
docker compose up -d

# 4. Open your browser
# → Frontend: http://localhost:3000
# → Backend: http://localhost:4000
```

---

## 📁 Project Structure (Simplified)

```
leave-system/
├── .env                  # Environment variables
├── docker-compose.yml    # Docker Compose setup
├── Dockerfile            # Frontend Dockerfile (Next.js)
├── Dockerfile-backend    # Backend Dockerfile (Node.js)
├── mongo_data/           # MongoDB persistent data
├── src/                  # Frontend source code
├── server/               # Backend code
└── public/               # Static assets
```

---

## 🧩 Troubleshooting

If you see frontend requests still going to `localhost:3000`, rebuild with:
```bash
docker compose build --no-cache --build-arg NEXT_PUBLIC_API_BASE_URL=localhost
```

If MongoDB fails to connect, ensure your `.env` contains:
```bash
MONGO_URL=mongodb://root:password@mongo:27017/leaveSystem?authSource=admin
```

---

## 📜 License
This project is intended for internal or educational use.  
You are free to modify and extend it to suit your needs.
