<?php
// get_expenses.php
include 'db_config.php'; // Includes database connection and CORS headers

$month = isset($_GET['month']) ? $conn->real_escape_string($_GET['month']) : null;
$year = isset($_GET['year']) ? $conn->real_escape_string($_GET['year']) : null;

$sql = "SELECT id, amount, category, expense_date, description FROM expenses";
$where_clauses = [];
$params = [];
$types = "";

if ($month && $year) {
    $where_clauses[] = "MONTH(expense_date) = ? AND YEAR(expense_date) = ?";
    $params[] = $month;
    $params[] = $year;
    $types .= "ii";
} elseif ($month) { // If only month is provided, assume current year
    $where_clauses[] = "MONTH(expense_date) = ? AND YEAR(expense_date) = ?";
    $params[] = $month;
    $params[] = date('Y'); // Current year
    $types .= "ii";
} elseif ($year) { // If only year is provided
    $where_clauses[] = "YEAR(expense_date) = ?";
    $params[] = $year;
    $types .= "i";
} else { // Default to current month and year if no filter
    $where_clauses[] = "MONTH(expense_date) = ? AND YEAR(expense_date) = ?";
    $params[] = date('m'); // Current month
    $params[] = date('Y'); // Current year
    $types .= "ii";
}

if (!empty($where_clauses)) {
    $sql .= " WHERE " . implode(" AND ", $where_clauses);
}

$sql .= " ORDER BY expense_date DESC"; // Order by date, newest first

$stmt = $conn->prepare($sql);

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$expenses = [];
while($row = $result->fetch_assoc()) {
    $expenses[] = $row;
}

echo json_encode($expenses);

$stmt->close();
$conn->close();
?>