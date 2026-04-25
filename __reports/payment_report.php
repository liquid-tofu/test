<?php
session_start();
require __DIR__ . "/../coms/classes.php";

$month = !empty($_POST['month']) ? $_POST['month'] : null;
$year  = !empty($_POST['year'])  ? $_POST['year']  : null;

// configure
$columns = [
  'id' => 'ID',
  'rentid' => 'Rented Code',
  'price' => 'Price',
  'month' => 'Month',
  'year' => 'Year'
];
$tbl_name = "tblpayment";

class PayPortHome extends HometownBoard {
  public $exportMonth = null;
  public $exportYear  = null;

  public function soul($id = null, $name = null) {
    $month = $this->exportMonth ?? (!empty($_POST['month']) ? $_POST['month'] : null);
    $year  = $this->exportYear  ?? (!empty($_POST['year'])  ? $_POST['year']  : null);

    $stmt = $this->conn->prepare("CALL selectFromPayByDate(:m, :y)");
    $stmt->bindValue(':m', $month, $month ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->bindValue(':y', $year,  $year  ? PDO::PARAM_INT : PDO::PARAM_NULL);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }
}
$immortal_gu = new PayPortHome((new WeavingThreat())->connect(), $tbl_name);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
  $immortal_gu->delete_from_table($_POST['delete_id'], $tbl_name);
}

if (isset($_GET['export'])) {
  $month = !empty($_GET['month']) ? $_GET['month'] : null;
  $year  = !empty($_GET['year'])  ? $_GET['year']  : null;
  $immortal_gu->exportMonth = $month;
  $immortal_gu->exportYear  = $year;
  $rows = $immortal_gu->soul();

  $filename = 'payments_' . date('Ymd_His') . '.csv';
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="' . $filename . '"');

  $out = fopen('php://output', 'w');
  fputcsv($out, array_merge(['#'], array_values($columns)));

  $i = 0;
  foreach ($rows as $row) {
    $i++;
    $line = [$i];
    foreach ($columns as $key => $label) {
      $line[] = $row[$key] ?? '';
    }
    fputcsv($out, $line);
  }

  fclose($out);
  exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- configure -->
  <title>Payment Report</title>

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
      <h2>Payment Report</h2>
      <hr>
    </div>

    <fieldset class="container-fluid d-flex align-items-start w-100">
      <legend class="position-absolute top-0 start-0 translate-middle-y px-1 ms-3">Lookup</legend>

      <form action="" method="post">
      <section id="filter-sec" class="d-flex align-items-center gap-4">
        <div class="d-flex align-items-center gap-2">
        <label for="month">Month</label>
        <select id="month" name="month" class="none-btn form-control">
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
            <option value="<?= htmlspecialchars($num) ?>"
              <?= ($month == $num) ? 'selected' : '' ?>>
              <?= htmlspecialchars($name) ?>
            </option>
          <?php endforeach; ?>
        </select>
        </div>

        <div class="d-flex align-items-center gap-2">
        <label for="year">Year</label>
        <input type="number" name="year" id="year" min="2000" max="2030"
                class="form-control rounded"
                placeholder="Enter year"
                value="<?= htmlspecialchars($year); ?>"
                autocomplete="off">
        </div>

        <a id="pay-report-sub" href="<?= $_SERVER['PHP_SELF'] ?>" class="btn" style="margin-right: -15px; background-color: red;">Clear</a>
        <input id="pay-report-sub" type="submit" value="Search" name="submit" class="btn">
      </section>
      </form>
    </fieldset>

    <!-- configure -->
    <?php $immortal_gu->board('id', 'room', $columns, "no_action"); ?>

    <div id="down-btn" class="d-flex gap-2 justify-content-start w-100">
      <a href="/../Index.php" style="background-color: #000;">Back</a>
      <a href="?export=1&month=<?= $month ?>&year=<?= $year ?>" class="btn btn-success">Export CSV</a>
    </div>
  </div>
  </div>

  <script src="/../coms/js.js"></script>
</body>
</html>




