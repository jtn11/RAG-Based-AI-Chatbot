FROM python:3.10-slim

# Install system dependencies required for building pip packages 
# like chroma-hnswlib if needed
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Render automatically sets the PORT environment variable)
EXPOSE 8000

# Start Uvicorn pointing to main.py
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
