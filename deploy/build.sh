#!/bin/bash
set -e

echo "===> Building Angular frontend..."
cd frontend
npm ci
npm run build -- --configuration production
cd ..

echo "===> Copying frontend build into Spring Boot static resources..."
rm -rf backend/src/main/resources/static
mkdir -p backend/src/main/resources/static
cp -r frontend/dist/electronics-store-ui/* backend/src/main/resources/static/

echo "===> Building Spring Boot backend (with frontend bundled)..."
cd backend
mvn clean package -DskipTests
cd ..

echo "===> Verifying frontend is bundled in the jar..."
JAR_FILE=$(find backend/target -maxdepth 1 -name "*.jar" | head -n 1)
if unzip -l "$JAR_FILE" | grep -q "static/index.html"; then
  echo "✅ Frontend successfully bundled in $JAR_FILE"
else
  echo "❌ ERROR: static/index.html not found in jar. Build failed to bundle frontend."
  exit 1
fi

echo "===> Build complete: $JAR_FILE"
