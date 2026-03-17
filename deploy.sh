#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="gynecology-chatbot"
REGION="asia-northeast3" # Seoul

echo "🚀 Deploying $SERVICE_NAME to Cloud Run in $REGION..."

# 1. Build the image using Cloud Build
echo "📦 Building Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# 2. Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080

echo "✅ Deployment complete!"
gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'
