<?php
/* ===================================================================
 * KöhrerGainz - Auth API
 * ===================================================================
 * POST /api/auth.php?action=login    → Login
 * POST /api/auth.php?action=register → Registrierung
 * GET  /api/auth.php?action=session  → Aktuelle Session
 * POST /api/auth.php?action=logout   → Logout
 * =================================================================== */

require_once __DIR__ . '/../config.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ===== LOGIN =====
if ($action === 'login' && $method === 'POST') {
    $data = getRequestBody();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'E-Mail und Passwort erforderlich.'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email AND is_active = 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['success' => false, 'message' => 'Ungültige Anmeldedaten.'], 401);
    }

    // Session setzen
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_role'] = $user['role'];

    // last_login aktualisieren
    $db->prepare("UPDATE users SET last_login = NOW() WHERE id = :id")
       ->execute([':id' => $user['id']]);

    unset($user['password_hash']);
    jsonResponse(['success' => true, 'user' => $user]);
}

// ===== REGISTER =====
if ($action === 'register' && $method === 'POST') {
    $data = getRequestBody();
    $name     = trim($data['name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($name) || empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Alle Felder erforderlich.'], 400);
    }

    if (strlen($password) < 6) {
        jsonResponse(['success' => false, 'message' => 'Passwort muss mindestens 6 Zeichen lang sein.'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Ungültige E-Mail-Adresse.'], 400);
    }

    // Prüfen ob Email schon existiert
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'E-Mail bereits registriert.'], 409);
    }

    // Username aus Name ableiten (eindeutig machen)
    $baseUsername = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    if (empty($baseUsername)) $baseUsername = 'user';
    $username = $baseUsername;
    $counter  = 1;
    while (true) {
        $chk = $db->prepare("SELECT id FROM users WHERE username = :u");
        $chk->execute([':u' => $username]);
        if (!$chk->fetch()) break;
        $username = $baseUsername . $counter++;
    }

    // User anlegen
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare(
        "INSERT INTO users (username, full_name, email, password_hash, role) 
         VALUES (:username, :full_name, :email, :password_hash, 'customer')"
    );
    $stmt->execute([
        ':username'      => $username,
        ':full_name'     => $name,
        ':email'         => $email,
        ':password_hash' => $hashedPassword,
    ]);

    $userId = (int)$db->lastInsertId();

    // Session setzen
    $_SESSION['user_id']   = $userId;
    $_SESSION['user_role'] = 'customer';

    jsonResponse(['success' => true, 'user' => [
        'id'        => $userId,
        'username'  => $username,
        'full_name' => $name,
        'email'     => $email,
        'role'      => 'customer',
    ]], 201);
}

// ===== SESSION =====
if ($action === 'session' && $method === 'GET') {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'user' => null]);
    }

    $stmt = $db->prepare(
        "SELECT id, username, full_name, email, role, total_eco_points, created_at 
         FROM users WHERE id = :id AND is_active = 1"
    );
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    jsonResponse(['success' => (bool)$user, 'user' => $user ?: null]);
}

// ===== LOGOUT =====
if ($action === 'logout' && $method === 'POST') {
    session_destroy();
    jsonResponse(['success' => true]);
}


// ===== ME (per user_id aus localStorage) =====
if ($action === 'me' && $method === 'GET') {
    $userId = (int)($_GET['user_id'] ?? 0);
    if (!$userId) {
        jsonResponse(['success' => false, 'user' => null]);
    }
    $stmt = $db->prepare(
        "SELECT id, username, full_name, email, role, total_eco_points, created_at 
         FROM users WHERE id = :id AND is_active = 1"
    );
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    jsonResponse(['success' => (bool)$user, 'user' => $user ?: null]);
}

jsonResponse(['error' => 'Ungültige Anfrage.'], 400);
