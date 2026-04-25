<?php
session_start();
require __DIR__ . "/../coms/classes.php";

$conn = (new WeavingThreat())->connect();

if (isset($_POST['submit'])) {
  $name  = $_POST['name'];
  $room = $_POST['room'];
  $date = $_POST['rent_date'];

  try {
    $stmt = $conn->prepare("CALL insertToRent(:name, :room, :date)");
    $stmt->bindValue(':name', $name, PDO::PARAM_STR);
    $stmt->bindValue(':room', $room, PDO::PARAM_STR);
    $stmt->bindValue(':date', $date, PDO::PARAM_STR);

    if ($stmt->execute()) {
      $_SESSION['message'] = "Successfully inserted a data row";
      header("Location: rent.php");
      exit;
    }
  } catch (PDOException $e) {
    $_SESSION['message']  = "Inserting fail!";
    $_SESSION['old']    = ['name' => $name, 'room' => $room, 'rent_date' => $date];
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
  <title>Add Rent</title>

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
  <h2>Add New Rent</h2>

  <form method="post">
    <div class="mb-3">
      <label class="add-form-label">Name</label>
      <select name="name" class="none-btn form-control">
        <option value="">-- Select Customer Name --</option>
        <?php
        $nameq = $conn->prepare("SELECT `name` FROM tblcustomer");
        $nameq->execute();
        $name_result = $nameq->fetchAll(PDO::FETCH_ASSOC);

        foreach ($name_result as $val):
          $lower = strtolower($val['name']);
        ?>
          <option value="<?= htmlspecialchars($lower) ?>">
            <?= htmlspecialchars(ucfirst($lower)) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="mb-3">
      <label class="add-form-label">Room</label>
      <select name="room" class="none-btn form-control">
        <option value="">-- Select A Room --</option>
        <?php
        $roomq = $conn->prepare("SELECT room FROM tblroom");
        $roomq->execute();
        $room_result = $roomq->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($room_result as $val):
          $lower = strtolower($val['room']);
        ?>
          <option value="<?= htmlspecialchars($lower) ?>">
            <?= htmlspecialchars(ucfirst($lower)) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="mb-3">
      <label class="add-form-label">Rent Date</label>
      <input type="date" name="rent_date" class="none-btn form-control" placeholder="Enter nationality" value="<?= htmlspecialchars($_POST['rent_date'] ?? '') ?>">
    </div>

    <div id="down-btn" class="d-flex gap-2 justify-content-start w-100">
      <a href="rent.php" class="btn">Back</a>
      <input type="submit" name="submit" value="Save">
    </div>
  </form>
</div>
</body>
</html>

