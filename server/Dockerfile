# Use Node.js official image
FROM node:18

# Create app directory
WORKDIR /app

# Copy backend files
COPY . .

# Install dependencies
RUN npm install

# Expose port (adjust if your app uses a different port)
EXPOSE 5000

# Start the backend server
CMD ["node", "index.js"]
