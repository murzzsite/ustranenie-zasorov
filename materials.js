/* Плашка cookie: тот же выбор (pk_cookie), что и на главной. */
(function () {
  var choice = null;
  try { choice = localStorage.getItem('pk_cookie'); } catch (e) {}
  if (choice) return;
  var bar = document.createElement('div');
  bar.className = 'cookie';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Использование cookie');
  bar.innerHTML = '<p>Мы используем cookie, чтобы сайт работал. Подробнее в <a href="/privacy.html#cookie">политике конфиденциальности</a>.</p><div class="cookie__actions"><button type="button" class="m-btn" data-c="all">Принять</button><button type="button" class="m-btn m-btn--ghost" data-c="necessary">Только необходимые</button></div>';
  document.body.appendChild(bar);
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]');
    if (!b) return;
    try { localStorage.setItem('pk_cookie', b.getAttribute('data-c')); } catch (err) {}
    bar.remove();
  });
})();
