FROM php:8.2-apache

# Installiere system dependencies und PDO MySQL
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install mysqli pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Aktiviere Apache Rewrite Module
RUN a2enmod rewrite

# PHP Konfiguration für Entwicklung
RUN echo "display_errors = On" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "error_reporting = E_ALL" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "display_startup_errors = On" >> /usr/local/etc/php/conf.d/custom.ini

# Setze Arbeitsverzeichnis
WORKDIR /var/www/html

# Expose Port 80
EXPOSE 80