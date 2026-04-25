<section id="search-sec" class="d-flex align-items-center gap-2">
  <label for="search-bar">Input</label>
  <div>
    <input type="text" name="search-bar" id="search-bar"
            class="form-control rounded"
            placeholder="Search by name or id"
            value="<?= htmlspecialchars($search) ?>"
            autocomplete="off">
    <button type="button" id="clear" class="btn rounded">Clear</button>
    <button type="button" id="search" class="btn">
      <i class="bi bi-search"></i>
    </button>
  </div>
</section>
