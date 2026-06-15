<?php
/* ===================================================================
 * KöhrerGainz - Admin Users API
 * ===================================================================
 * GET    /api/admin/users.php       → Alle User
 * PUT    /api/admin/users.php       → User bearbeiten (Rolle)
 * DELETE /api/admin/users.php?id=x  → User löschen
 * =================================================================== */

require_once __DIR__ . '/../../config.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Admin-Check
if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    jsonResponse(['error' => 'Zugriff verweigert.'], 403);
}

// ===== GET: Alle User =====
if ($method === 'GET') {
    $stmt = $db->query(
        "SELECT id, username, full_name, email, role, total_eco_points, created_at, last_login, is_active 
         FROM users ORDER BY created_at DESC"
    );
    jsonResponse($stmt->fetchAll());
}

// ===== PUT: User bearbeiten =====
if ($method === 'PUT') {
    $data = getRequestBody();
    $id   = (int)($data['id'] ?? 0);
    $role = $data['role'] ?? '';

    if ($id === 0) {
        jsonResponse(['success' => false, 'message' => 'Keine User-ID.'], 400);
    }

    // Enum in DB: 'customer' | 'admin'
    $validRoles = ['customer', 'admin'];
    if (!in_array($role, $validRoles)) {
        jsonResponse(['success' => false, 'message' => 'Ungültige Rolle. Erlaubt: customer, admin'], 400);
    }

    $stmt = $db->prepare("UPDATE users SET role = :role WHERE id = :id");
    $stmt->execute([':role' => $role, ':id' => $id]);

    jsonResponse(['success' => true]);
}

// ===== DELETE: User löschen =====
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id === 0) {
        jsonResponse(['success' => false, 'message' => 'Keine User-ID.'], 400);
    }

    // Eigenen Account nicht löschen
    if ($id === (int)$_SESSION['user_id']) {
        jsonResponse(['success' => false, 'message' => 'Eigenen Account kann man nicht löschen.'], 400);
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Ungültige Anfrage.'], 400);
