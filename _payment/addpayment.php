<?php
session_start();
require __DIR__ . "/../coms/classes.php";

$conn = (new WeavingThreat())->connect();

if (isset($_POST['submit'])) {
  $code  = $_POST['rentid'];
  $price = $_POST['price'];
  $month = $_POST['month'];
  $year = $_POST['year'];

  try {
    $stmt = $conn->prepare("CALL insertToPay(:code, :price, :month, :year)");
    $stmt->bindValue(':code', $code, PDO::PARAM_INT);
    $stmt->bindValue(':price', $price, PDO::PARAM_STR);
    $stmt->bindValue(':month', $month, PDO::PARAM_INT);
    $stmt->bindValue(':year', $year, PDO::PARAM_INT);

    if ($stmt->execute()) {
      $_SESSION['message'] = "Successfully inserted a data row";
      header("Location: payment.php");
      exit;
    }
  } catch (PDOException $e) {
    $_SESSION['message']  = "Inserting fail!";
    $_SESSION['old']    = ['rentid' => $code, 'price' => $price, 'month' => $month, 'year' => $year];
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
  <title>Add Payment</title>

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
  <h2>Add New Payment</h2>

  <form method="post">
    <div class="mb-3">
      <label class="add-form-label">Rented Code</label>
      <select name="rentid" class="none-btn form-control">
        <option value="">-- Select Rented ID --</option>
        <?php
        $codeq = $conn->prepare("SELECT id FROM tblrent");
        $codeq->execute();
        $code_result = $codeq->fetchAll(PDO::FETCH_ASSOC);

        foreach ($code_result as $val):
        ?>
          <option value="<?= htmlspecialchars($val['id']) ?>">
            <?= htmlspecialchars($val['id']) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="mb-3">
      <label class="add-form-label">Price</label>
      <input type="number" step="0.01" min="0" max="1000000" name="price" class="none-btn form-control" placeholder="Enter price" value="<?= htmlspecialchars($_POST['price'] ?? '') ?>">
    </div>

    <div class="mb-3">
      <label class="add-form-label">Month</label>
      <select name="month" class="none-btn form-control">
        <option value="">-- Select Month --</option>
        <?php
        $months = [
          'January'   => 1,
          'February'  => 2,
          'March'     => 3,
          'April'     => 4,
          'May'       => 5,
          'June'      => 6,
          'July'      => 7,
          'August'    => 8,
          'September' => 9,
          'October'   => 10,
          'November'  => 11,
          'December'  => 12,
        ];

        foreach ($months as $name => $num):
        ?>
          <option value="<?= htmlspecialchars($num) ?>">
            <?= htmlspecialchars($name) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="mb-3">
      <label class="add-form-label">Year</label>
      <input type="number" step="1" min="2000" max="2030" name="year" class="none-btn form-control" placeholder="Enter year" value="<?= htmlspecialchars($_POST['year'] ?? '') ?>">
    </div>

    <div id="down-btn" class="d-flex gap-2 justify-content-start w-100">
      <a href="payment.php" class="btn">Back</a>
      <input type="submit" name="submit" value="Save">
    </div>
  </form>
</div>
</body>
</html>

