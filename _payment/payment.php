<?php
session_start();
require __DIR__ . "/../coms/classes.php";

$search = $_GET['search'] ?? '';

// configure
$columns = [
  'id' => 'ID',
  'rentid' => 'Rented Code',
  'price' => 'Price',
  'month' => 'Month',
  'year' => 'Year'
];
$tbl_name = "tblpayment";
$immortal_gu = new HometownBoard((new WeavingThreat())->connect(), $tbl_name);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
  $immortal_gu->delete_from_table($_POST['delete_id'], $tbl_name);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- configure -->
  <title>Payment List</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <script defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>

  <link rel="stylesheet" href="/../styles/gen.css">
</head>
<body class="mt-5 mb-5">
  <?php
  // notification
  if (isset($_SESSION['message'])) {
    echo '<div class="popup-message">' . htmlspecialchars($_SESSION['message']) . '</div>';
    unset($_SESSION['message']);
  }
  ?>

  <div class="page-wrapper">
  <div id="tbl-con" class="container-md d-flex flex-column align-items-center justify-content-center text-center py-3 gap-3 rounded-3">
    <div id="title" class="w-100">
      <!-- configure -->
      <h2>List Payment Info</h2>
      <hr>
    </div>

    <fieldset class="container-fluid d-flex align-items-start w-100">
      <legend class="position-absolute top-0 start-0 translate-middle-y px-1 ms-3">Lookup</legend>
      <?php require __DIR__ . "/../coms/search_bar.php"; ?>
    </fieldset>

    <!-- configure -->
    <?php $immortal_gu->board('id', 'rentid', $columns, "editpayment.php"); ?>

    <div id="down-btn" class="d-flex gap-2 justify-content-start w-100">
      <a href="/../Index.php">Back</a>
      <?= "<a href='Add" . pathinfo(__FILE__, PATHINFO_FILENAME) . ".php'>Add New</a>" ?>
    </div>
  </div>
  </div>

  <script src="/../coms/js.js"></script>
</body>
</html>




