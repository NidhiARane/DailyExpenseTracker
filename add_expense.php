<?php
// add_expense.php
include 'db_config.php'; // Includes database connection and CORS headers

// Get raw POST data (assuming JSON)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON input."]);
    $conn->close();
    exit();
}

// Sanitize and validate input
$amount = filter_var($data['amount'], FILTER_VALIDATE_FLOAT);
$category = $conn->real_escape_string($data['category']);
$expense_date = $conn->real_escape_string($data['expense_date']);
$description = isset($data['description']) ? $conn->real_escape_string($data['description']) : '';

if ($amount === false || $amount <= 0 || empty($category) || empty($expense_date)) {
    echo json_encode(["status" => "error", "message" => "Invalid amount, category, or date."]);
    $conn->close();
    exit();
}

$stmt = $conn->prepare("INSERT INTO expenses (amount, category, expense_date, description) VALUES (?, ?, ?, ?)");
$stmt->bind_param("dsss", $amount, $category, $expense_date, $description);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "New expense added successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>