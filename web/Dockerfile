FROM php:8.2-apache

# Enable mysqli extension for database connectivity
RUN docker-php-ext-install mysqli

# Copy website files into the Apache document root
COPY html/ /var/www/html/

# Expose port 80
EXPOSE 80
