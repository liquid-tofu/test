<?php
session_start();
require __DIR__ . "/../coms/classes.php";

$id = $_POST['id'] ?? $_GET['id'] ?? null;
$conn = (new WeavingThreat())->connect();

try {
  $stmt = $conn->prepare("CALL selectFromTableByID(:table, :id)");
  $stmt->bindValue(':table', 'tblroom');
  $stmt->bindValue(':id', $id, PDO::PARAM_INT);
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
  $_SESSION['message']  = "The query to database cannot complete!";
  header("Location: room.php");
  exit;
}

if (isset($_POST['submit'])) {
  $room  = $_POST['room'];
  $price = $_POST['price'];

  try {
    $stmt = $conn->prepare("CALL updateForRoom(:room, :price, :id)");
    $stmt->bindValue(':room', $room, PDO::PARAM_STR);
    $stmt->bindValue(':price', $price, PDO::PARAM_STR);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);

    if ($stmt->execute()) {
      $_SESSION['message'] = "Successfully updated";
      header("Location: room.php");
      exit;
    }
  } catch (PDOException $e) {
    $_SESSION['message']  = "Inserting fail!";
    $_SESSION['old']    = ['room' => $room, 'price' => $price];
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
  }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edit Room</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <script defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>

  <link rel="stylesheet" href="/../styles/addit.css">
</head>
<body class="d-flex justify-content-center p-5">
<?php
// notification
if (isset($_SESSION['message'])) {
  echo '<div class="popup-message">' . htmlspecialchars($_SESSION['message']) . '</div>';
  unset($_SESSION['message']);
}
?>

<div class="container border border-primary rounded p-5 w-100">
  <h2>Edit Room</h2>

  <form method="post">
    <input type="hidden" name="id" value="<?= $id ?>">

    <div class="mb-3">
      <label class="add-form-label">Room</label>
      <input type="text" name="room" class="none-btn form-control" placeholder="Enter name" value="<?= htmlspecialchars($row['room'] ?? '') ?>">
    </div>

    <div class="mb-3">
      <label class="add-form-label">Price</label>
      <input type="number" name="price" class="none-btn form-control" placeholder="Enter price" min="0" max="1000000" step="0.01" value="<?= htmlspecialchars($row['price'] ?? '') ?>">
    </div>

    <div id="down-btn" class="d-flex gap-2 justify-content-start w-100">
      <a href="room.php" class="btn">Back</a>
      <input type="submit" name="submit" value="Update">
    </div>
  </form>
</div>
</body>
</html>

