<?php
$_db_host = getenv('DB_HOST') ?: 'db_server';
$_db_username = getenv('DB_USER') ?: 'root';
$_db_password = getenv('DB_PASSWORD') ?: 'rootpassword';
$_db_database = getenv('DB_NAME') ?: 'fitness_shop';

$conn = new mysqli($_db_host, $_db_username, $_db_password, $_db_database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$conn->set_charset('utf8mb4');
?>
