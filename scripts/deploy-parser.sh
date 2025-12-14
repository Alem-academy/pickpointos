#!/bin/bash

# Exit on error
set -e

PROJECT_ID="gen-lang-client-0534671855"
REGION="europe-west1"
SERVICE_NAME="pvz-parser-service"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment for $SERVICE_NAME..."

# Define gcloud path
GCLOUD="./google-cloud-sdk/bin/gcloud"

# 1. Build Docker image
echo "📦 Building Docker image..."
$GCLOUD builds submit --tag $IMAGE_NAME ./parser --project $PROJECT_ID

# 2. Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
$GCLOUD run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --service-account "pvz-dashboard-reader@$PROJECT_ID.iam.gserviceaccount.com" \
  --add-cloudsql-instances "$PROJECT_ID:$REGION:pvz-analytics-db" \
  --set-env-vars "DB_USER=postgres,DB_NAME=postgres,DB_SSL=false,GOOGLE_SHEET_ID=1RqrxGhAHJVAPy6-H4O-jCF-Hvu_FtRgqO_3iZ4mxJ0o,INSTANCE_CONNECTION_NAME=$PROJECT_ID:$REGION:pvz-analytics-db" \
  --set-secrets "DB_PASSWORD=DB_PASSWORD:latest"

echo "✅ Deployment completed successfully!"
