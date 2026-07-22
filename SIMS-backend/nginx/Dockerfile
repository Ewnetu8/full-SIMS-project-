FROM nginx:alpine

# Install openssl to generate self-signed certificates for development TLS termination
RUN apk add --no-cache openssl

# Create directory for certificate assets
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certs automatically during build
RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=ET/ST=AA/L=AddisAbaba/O=AASTU/OU=AI_Robotics/CN=localhost"

# Copy Nginx proxy settings
COPY nginx.conf /etc/nginx/conf.d/default.conf
