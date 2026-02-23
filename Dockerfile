# Use the lightweight Nginx image
FROM nginx:alpine

# Copy your index.html into the Nginx public folder
COPY index.html /usr/share/nginx/html/index.html

# Cloud Run expects the container to listen on port 8080 by default
# We configure Nginx to listen on 8080 instead of 80
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
