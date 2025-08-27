# Use official Node.js LTS image
FROM node:22

# Set working directory
WORKDIR /app/constellations-api

# Copy package.json and package-lock.json (if present)
COPY /constellations-api/package*.json ./
COPY ../lib-constellations ../lib-constellations

# Install dependencies
RUN cd ../lib-constellations && npm install 
RUN npm install

# Copy the rest of the application code
COPY /constellations-api/src ./src

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
