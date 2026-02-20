FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy server and static files
COPY server.js ./
COPY html/ ./html/

# Expose port 80
EXPOSE 80

CMD ["node", "server.js"]
