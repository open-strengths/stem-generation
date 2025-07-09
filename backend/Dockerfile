FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml ./

# Install uv
RUN pip install uv

# Install dependencies
RUN uv sync

# Copy source code
COPY ./backend .

# Set environment variables
ENV PYTHONPATH=/app

# Command to run the application
CMD ["sh", "-c", "uv run fastapi run app/main.py"]
