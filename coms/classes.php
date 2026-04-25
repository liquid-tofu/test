<?php
class WeavingThreat {
  private $servername = "localhost";
  private $database = "rentroom_db";
  private $username = "root";
  private $password = "kira7!23A5";

  public $conn;

  public function connect() {
    $this->conn = null;

    try {
      $this->conn = new PDO(
        "mysql:host={$this->servername};dbname={$this->database}",
        $this->username,
        $this->password
      );
      $this->conn->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
    }
    catch (PDOException $e) {
      echo "Connection failed: " . $e->getMessage();
    }

    return $this->conn;
  }
}

class HometownBoard {
  public $conn;
  public $table;

  public function __construct($connection, $table) {
    $this->conn = $connection;
    $this->table = $table;
  }

  public function soul($id, $name) {
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sql = "SELECT * FROM {$this->table}";

    if ($search !== '') {
      $sql .= " WHERE {$id} = :id
                OR {$name} LIKE CONCAT('%', :name, '%')";
      $result = $this->conn->prepare($sql);
      $result->bindValue(':id', $search);
      $result->bindValue(':name', $search);
    }
    else {
      $result = $this->conn->prepare($sql);
    }

    $result->execute();
    return $result->fetchAll(PDO::FETCH_ASSOC);
  }

  public function board($id, $name, array $columns, $editUrl = '') {
    echo "<table id=\"table\" class=\"table table-bordered table-hover table-sm w-100 mt-1\"><thead><tr>";

    echo "<th>" . htmlspecialchars('#') . "</th>";
    foreach ($columns as $value) {
      echo "<th>" . htmlspecialchars($value) . "</th>";
    }

    if ($editUrl != 'no_action') {
      echo "<th>" . htmlspecialchars('Actions') . "</th>";
      echo "</tr></thead>";
    };

    $rows = $this->soul($id, $name);

    echo "<tbody>";
    foreach ($rows as $index => $row) {
      echo "<tr>";
      echo "<td>" . ($index + 1) . "</td>";

      foreach ($columns as $key => $label) {
        echo "<td>" . htmlspecialchars($this->formatCell($key, $row[$key] ?? '')) . "</td>";
      }

      if ($editUrl != 'no_action') {
        echo "<td class='text-center align-middle' style='white-space:nowrap'>
          <div class='d-flex align-items-center justify-content-center gap-1'>
            <a href='{$editUrl}?id={$row[$id]}' class='btn btn-warning btn-sm py-0'>Edit</a>
            <span>|</span>";
        echo "<form method='POST' onsubmit='return confirm(\"Are you sure?\")'>
          <input type='hidden' name='delete_id' value='" . $row[$id] . "'>
          <button type='submit' class='btn btn-danger btn-sm py-0'>Delete</button>
        </form>";
        echo "</div></td>";
      };
      echo "</tr>";
    }
    if (!$rows) {
      echo "<tr><td colspan=\"" . (count($columns) + 2) . "\">No results found</td></tr>";
    }
    echo "</tbody></table>";
  }

  public function delete_from_table($id, $table) {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }

    try {
      if (!$id) {
        header("Location: {$_SERVER['PHP_SELF']}");
        exit;
      }

      $stmt = $this->conn->prepare("CALL deletefromtable(:table, :id)");
      $stmt->bindValue(':table', $table, PDO::PARAM_STR);
      $stmt->bindValue(':id', $id, PDO::PARAM_INT);

      if ($stmt->execute()) {
        $_SESSION['message'] = "Successfully deleted a data with id: {$id}";
        header("Location: {$_SERVER['PHP_SELF']}");
        exit;
      }
    } catch (PDOException $e) {
      $_SESSION['message'] = "Deleting fail!";
        header("Location: {$_SERVER['PHP_SELF']}");
        exit;
    }
  }

  protected function formatCell($key, $value) {
    if ($key === 'price') {
      return '$' . number_format((float)$value, 2);
    }
    return $value;
  }
}
?>



