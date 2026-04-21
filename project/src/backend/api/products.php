<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$search = isset($_GET['search']) ? trim((string) $_GET['search']) : '';
$category = isset($_GET['category']) ? trim((string) $_GET['category']) : '';

if ($id > 0) {
    $stmt = $conn->prepare('SELECT product_id, name, slug, description, category, price, stock, image_url, is_active, created_at, updated_at FROM products WHERE product_id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Produkt nicht gefunden']);
        $conn->close();
        exit;
    }

    echo json_encode(['success' => true, 'product' => $product]);
    $conn->close();
    exit;
}

$sql = 'SELECT product_id, name, slug, description, category, price, stock, image_url, is_active, created_at, updated_at FROM products WHERE is_active = 1';
$params = [];
$types = '';

if ($search !== '') {
    $sql .= ' AND (name LIKE ? OR description LIKE ?)';
    $searchLike = '%' . $search . '%';
    $params[] = $searchLike;
    $params[] = $searchLike;
    $types .= 'ss';
}

if ($category !== '') {
    $sql .= ' AND category = ?';
    $params[] = $category;
    $types .= 's';
}

$sql .= ' ORDER BY created_at DESC';

$stmt = $conn->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();
$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}
$stmt->close();

$categoriesResult = $conn->query('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC');
$categories = [];
while ($categoryRow = $categoriesResult->fetch_assoc()) {
    $categories[] = $categoryRow['category'];
}

echo json_encode([
    'success' => true,
    'count' => count($products),
    'categories' => $categories,
    'products' => $products
]);

$conn->close();
?>
