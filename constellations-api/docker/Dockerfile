# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY ../package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY ../src ./src

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]
