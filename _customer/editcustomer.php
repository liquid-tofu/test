<?php
session_start();
require __DIR__ . "/../coms/classes.php";

$id = $_POST['id'] ?? $_GET['id'] ?? null;
$conn = (new WeavingThreat())->connect();

try {
  $stmt = $conn->prepare("CALL selectFromTableByID(:table, :id)");
  $stmt->bindValue(':table', 'tblcustomer');
  $stmt->bindValue(':id', $id, PDO::PARAM_INT);
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
  die($e->getMessage());
  $_SESSION['message']  = "The query to database cannot complete!";
  header("Location: customer.php");
  exit;
}

if (isset($_POST['submit'])) {
  $conn = (new WeavingThreat())->connect();
  $name  = $_POST['name'];
  $gen = $_POST['gen'];
  $cont = $_POST['cont'];
  $nat = $_POST['nat'];

  try {
    $stmt = $conn->prepare("CALL updateForCus(:name, :gen, :cont, :nat, :id)");
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':gen', $gen, PDO::PARAM_STR);
    $stmt->bindValue(':cont', $cont, PDO::PARAM_STR);
    $stmt->bindValue(':nat', $nat, PDO::PARAM_STR);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);

    if ($stmt->execute()) {
      $_SESSION['message'] = "Successfully updated";
      header("Location: customer.php");
      exit;
    }
  } catch (PDOException $e) {
    $_SESSION['message']  = "Inserting fail!";
    $_SESSION['old']    = ['name' => $name, 'gen' => $gen, 'cont' => $cont, 'nat' => $nat];
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
  <title>Edit Customer</title>

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
  <h2>Edit Customer</h2>

  <form method="post">
    <input type="hidden" name="id" value="<?= $id ?>">

    <div class="mb-3">
      <label class="add-form-label">Name</label>
      <input type="text" name="name" class="none-btn form-control" placeholder="Enter name" value="<?= htmlspecialchars($row['name'] ?? '') ?>">
    </div>

    <div class="mb-3">
      <label class="add-form-label">Gender</label>
      <select name="gen" class="none-btn form-control">
        <option value="">-- Select Name --</option>
        <option value="Male" selected>Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="add-form-label">Contact</label>
      <input type="text" name="cont" class="none-btn form-control" placeholder="Enter contact" value="<?= htmlspecialchars($row['contact'] ?? '') ?>">
    </div>

    <div class="mb-3">
      <label class="add-form-label">National</label>
      <input type="text" name="nat" class="none-btn form-control" placeholder="Enter nationality" value="<?= htmlspecialchars($row['national'] ?? '') ?>">
    </div>

    <div id="down-btn" class="d-flex gap-2 justify-content-start w-100">
      <a href="customer.php" class="btn">Back</a>
      <input type="submit" name="submit" value="Update">
    </div>
  </form>
</div>
</body>
</html>

