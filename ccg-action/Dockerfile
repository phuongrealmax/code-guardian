# CCG GitHub Action Docker Image
FROM node:20-alpine

LABEL maintainer="CodeGuardian Studio"
LABEL description="Claude Code Guardian - AI-Safe Code Analysis"
LABEL version="1.0.0"

# Install git (needed for diff analysis)
RUN apk add --no-cache git bash jq curl

# Create app directory
WORKDIR /app

# Install CCG globally
RUN npm install -g codeguardian-studio@latest

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
