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

## 🏗️ Build & Run the Containers

### ▶️ **For Local Development (Default Setup)**

By default, the frontend is already configured to use:
```
NEXT_PUBLIC_API_BASE_URL=localhost
```

So to run the entire stack locally, you just need:
```bash
docker compose up -d --build
```

That’s it! 🎉  
This will:
- Build all images
- Start the frontend, backend, and MongoDB containers  
- Connect them automatically inside the Docker network

Once started:
- 🌐 **Frontend:** http://localhost:3000  
- ⚙️ **Backend API:** http://localhost:4000  
- 💾 **MongoDB:** port `17017` (internal)

---

### ⚙️ **For Server or Network Deployment**

If you are running on a **remote machine** (for example, `ipgwk10021` or `ipgnb10353`),  
you need to tell the frontend which host to call for API requests.

Run the following commands:
```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=ipgwk10021
docker compose up -d
```

You can replace `ipgwk10021` with any other hostname or IP where the backend will be accessible.

🧠 **Explanation:**
- The `--build-arg` flag overrides the default `NEXT_PUBLIC_API_BASE_URL` value during the frontend build.
- This ensures the frontend knows which server to contact for API calls.

---

## 🧰 Useful Commands

| Purpose | Command |
|----------|----------|
| View running containers | `docker ps` |
| Stop all containers | `docker compose down` |
| Stop and remove containers | `docker compose down` |
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

### 🖥️ Local Development
```bash
# 1. Clone the repository
git clone https://github.com/girishv-ipg/leave-system.git
cd leave-system

# 2. Run the entire stack (default localhost setup)
docker compose up -d --build
```

### 🌐 Server Deployment
```bash
# 1. Build the images with your server hostname
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=ipgwk10021

# 2. Run the stack
docker compose up -d
```

---

## 📜 License
This project is intended for internal IPG use.  
You are free to modify and extend it to suit your needs.
