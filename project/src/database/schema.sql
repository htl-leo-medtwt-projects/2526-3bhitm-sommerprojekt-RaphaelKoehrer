CREATE DATABASE IF NOT EXISTS fitness_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitness_shop;

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(80) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(120) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status ENUM('pending', 'paid', 'shipped', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

INSERT INTO products (name, slug, description, category, price, stock, image_url, is_active)
VALUES
('Whey Protein Vanilla 1kg', 'whey-protein-vanilla-1kg', 'High protein powder for muscle growth and recovery.', 'Protein', 34.90, 50, 'img/whey-vanilla.png', TRUE),
('Creatine Monohydrate 500g', 'creatine-monohydrate-500g', 'Pure creatine monohydrate for strength and performance.', 'Creatine', 21.90, 80, 'img/creatine-500g.png', TRUE),
('Workout Shaker 700ml', 'workout-shaker-700ml', 'Leak-proof shaker bottle for gym and travel.', 'Accessories', 8.90, 120, 'img/shaker-700ml.png', TRUE);
