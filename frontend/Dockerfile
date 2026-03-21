FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel=error --no-fund --no-audit
ARG BACKEND_URL=http://localhost:8080
COPY . .
RUN sed -i "s|http://localhost:8080|${BACKEND_URL}|g" src/environments/environment.ts
RUN echo "=== environment.ts after sed ===" && cat src/environments/environment.ts
EXPOSE 4200
CMD ["npx", "ng", "serve", "--host=0.0.0.0"]
