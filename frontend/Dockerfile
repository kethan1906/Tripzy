FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ARG VITE_ML_SERVICE_URL
ARG VITE_MAPBOX_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ML_SERVICE_URL=$VITE_ML_SERVICE_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
