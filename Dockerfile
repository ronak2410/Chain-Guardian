# 1. Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# 2. Build the Python Backend & Bundle
FROM python:3.10-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy the compiled React frontend into the backend folder so FastAPI can serve it
COPY --from=frontend-builder /app/frontend/dist ./backend/frontend/dist

# Hugging Face Spaces mandates port 7860
EXPOSE 7860

WORKDIR /app/backend

# Start FastAPI on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
