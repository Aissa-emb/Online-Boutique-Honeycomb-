#!/bin/bash
set -e

# Upload dSYM files to Embrace for crash symbolication.
# Usage: EMBRACE_API_TOKEN=xxx APP_ID=vowzc ./scripts/upload-dsyms.sh <path-to-build-output>

APP_ID="${APP_ID:-vowzc}"
EMBRACE_API_TOKEN="${EMBRACE_API_TOKEN}"
BUILD_DIR="${1:-quickshop-mobile/ios/build/Build/Products}"

if [ -z "$EMBRACE_API_TOKEN" ]; then
    echo "Error: EMBRACE_API_TOKEN not set"
    exit 1
fi

echo "Searching for dSYM files in: $BUILD_DIR"

find "$BUILD_DIR" -name "*.dSYM" -type d | while read -r dsym; do
    echo "Found dSYM: $dsym"
    dsym_name=$(basename "$dsym")
    
    # Create a zip of the dSYM
    zip_path="/tmp/${dsym_name}.zip"
    cd "$(dirname "$dsym")"
    zip -r "$zip_path" "$dsym_name" > /dev/null 2>&1
    cd - > /dev/null
    
    echo "Uploading $dsym_name to Embrace..."
    
    curl -s -X POST \
        "https://symbols.embrace.io/upload" \
        -H "Content-Type: application/zip" \
        -H "X-Embrace-App: $APP_ID" \
        -H "X-Embrace-Token: $EMBRACE_API_TOKEN" \
        --data-binary "@$zip_path" \
        -w "\nHTTP Status: %{http_code}\n" \
        -o /dev/null
    
    rm -f "$zip_path"
    echo "✅ Uploaded $dsym_name"
done

echo "dSYM upload complete."
