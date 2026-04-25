const curMainPath = window.location.pathname.split('/').pop();
const clear = document.getElementById('clear');
const search = document.getElementById('search-bar');
const searchBtn = document.getElementById('search');

// update clear when page reload
function updateClearButton() {
  if (clear && search) {
    clear.style.display = search.value ? 'block' : 'none';
  }
}
// handle input event
function buildParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (search?.value) {
    params.set('search', search.value);
  } else {
    params.delete('search');
  }

  return params;
}

// add event for each type
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  if (search && params.get('search')) {
    search.value = params.get('search');
  }
  updateClearButton();
});
search?.addEventListener('input', () => {
  if (clear) clear.style.display = search.value ? 'block' : 'none';
});
search?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); window.location.href = curMainPath + '?' + buildParams(); }
});
clear?.addEventListener('click', () => {
  if (search) search.value = '';
  const params = new URLSearchParams(window.location.search);
  params.delete('search');
  window.location.href = curMainPath + '?' + params.toString();
});
searchBtn?.addEventListener('click', () => {
  window.location.href = curMainPath + '?' + buildParams();
});

