import json
import logging
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel
from mangum import Mangum

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

app = FastAPI()


# Pydantic model for platform request
class PlatformRequest(BaseModel):
    name: str
    version: Optional[str] = "1.0.0"
    description: Optional[str] = ""


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "example-python-lambda"}


@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Hello from Python Lambda!"}


@app.post("/platform")
def platform(request: PlatformRequest):
    """Platform endpoint that processes platform data"""
    try:
        logger.info(f"Processing platform request: {request.dict()}")

        # Create a response based on the platform data
        response_message = f"Welcome to {request.name}!"

        if request.version:
            response_message += f" Running version {request.version}."

        if request.description:
            response_message += f" Description: {request.description}"

        # Add some platform stats
        platform_info = {
            "message": response_message,
            "platform": {
                "name": request.name,
                "version": request.version,
                "description": request.description,
                "status": "active",
                "uptime": "99.9%",
            },
            "metadata": {
                "processed_at": "2024-01-01T00:00:00Z",
                "lambda_version": "python3.12",
                "region": "us-east-1",
            },
        }

        return platform_info

    except Exception as e:
        logger.exception("Error processing platform request: %s", e)
        raise


# Create the Mangum handler for Lambda proxy integration
lambda_handler = Mangum(app)
