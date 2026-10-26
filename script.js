const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/9GJAX8MQ2D';

(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';

  /* ---------- шапка, меню ---------- */
  const bar = $('#bar');
  const burger = $('#burger');
  const nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.textContent = 'Меню';
  }));

  /* ---------- порядок появления первого экрана ---------- */
  $$('[data-in]').forEach(el => el.style.setProperty('--n', el.dataset.in));
  $$('.board .ln').forEach((el, i) => el.firstElementChild.style.setProperty('--l', i));
  let readied = false;
  const ready = () => {
    if (readied) return;
    readied = true;
    root.classList.add('is-ready');
    setTimeout(() => $('#heroShutter')?.classList.add('in'), 450);
    setTimeout(() => $('#heroShutter2')?.classList.add('in'), 800);
  };
  if (document.fonts?.ready) document.fonts.ready.then(() => requestAnimationFrame(ready));
  setTimeout(ready, 1400);

  /* ---------- появление при прокрутке ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.matches('[data-r]')) {
        const sibs = $$('[data-r]', el.parentElement).filter(n => n.parentElement === el.parentElement);
        el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 0.08 + 's');
      }
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r], .shutter:not(#heroShutter):not(#heroShutter2), .stair__item, .slip, .foot__chars').forEach(el => io.observe(el));

  /* ---------- счётчики ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      countIO.unobserve(el);
      const to = parseInt(el.dataset.count, 10);
      if (reduce || Number.isNaN(to)) return;
      const t0 = performance.now() + 150;
      const dur = 1500;
      el.textContent = '0';
      const tick = t => {
        const p = Math.max(0, Math.min(1, (t - t0) / dur));
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- телефон в подвале по символам ---------- */
  const chars = $('[data-chars]');
  if (chars) {
    const txt = chars.textContent;
    chars.textContent = '';
    [...txt].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'c';
      s.style.setProperty('--k', i);
      s.textContent = ch;
      chars.appendChild(s);
    });
  }

  /* ---------- прокрутка: панель и параллакс ---------- */
  const heroH = () => ($('.board')?.offsetHeight || 700) * 0.75;
  const px = $$('[data-speed]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      bar?.classList.toggle('is-on', window.scrollY > heroH());
      if (reduce || window.innerWidth < 900) return;
      const vh = window.innerHeight;
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const off = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-off * Number(el.dataset.speed)).toFixed(1)}px, 0)`;
      });
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- маска телефона ---------- */
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  /* ---------- калькулятор-смета ---------- */
  const PRICE = { sink: 4900, wc: 5300, hard: 8000, unk: 5000 };
  const NAMES = {
    sink: 'Раковина или мойка',
    wc: 'Унитаз, ванна, душ',
    hard: 'Стояк, сложный засор',
    out: 'Наружная сеть, колодец',
    unk: 'Засор, причина не ясна',
  };
  const form = $('#calcForm');
  const rowsEl = $('#slipRows');
  const totalEl = $('#slipTotal');
  const dateEl = $('#slipDate');
  const qOut = $('#qOut');
  const kmWrap = $('#kmWrap');
  const calcField = $('#calcField');
  const formCalc = $('#formCalc');
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  let shownTotal = 0;
  let lastKey = '';
  let current = { rows: [], total: 0, obj: '' };

  const val = name => form.querySelector(`input[name="${name}"]:checked`)?.value;

  const roll = to => {
    const from = shownTotal;
    shownTotal = to;
    if (reduce || from === to) { totalEl.textContent = 'от ' + fmt(to); return; }
    const t0 = performance.now();
    const dur = 650;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      totalEl.textContent = 'от ' + fmt(Math.round(from + (to - from) * e));
      if (p < 1 && shownTotal === to) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const compute = () => {
    const prob = val('prob');
    const obj = val('obj');
    const geo = val('geo');
    const rows = [];
    let total = 0;

    qOut.hidden = prob !== 'out';
    kmWrap.hidden = geo !== 'far';

    if (prob === 'out') {
      const per = Number(val('dia'));
      const m = Number($('#metres').value);
      $('#mVal').textContent = m;
      rows.push([`Прочистка, ${m} м по ${fmt(per)}`, per * m]);
      total += per * m;
    } else {
      rows.push([NAMES[prob], PRICE[prob]]);
      total += PRICE[prob];
    }
    if ($('#cam').checked) { rows.push(['Видеодиагностика трубы', 5000]); total += 5000; }
    if (geo === 'far') {
      const km = Number($('#km').value);
      $('#kmVal').textContent = km;
      rows.push([`Выезд за город, ${km} км по ${fmt(50)}`, km * 50]);
      total += km * 50;
    } else {
      rows.push(['Выезд и диагностика мастера', 0]);
    }
    total = Math.max(total, 2500);

    const key = JSON.stringify(rows);
    dateEl.textContent = `${today}, ${obj}`;
    if (key !== lastKey) {
      lastKey = key;
      rowsEl.innerHTML = '';
      rows.forEach(([name, sum], i) => {
        const li = document.createElement('li');
        li.className = 'is-new';
        li.style.setProperty('--k', i);
        const a = document.createElement('span');
        a.textContent = name;
        const b = document.createElement('span');
        b.textContent = fmt(sum);
        li.append(a, b);
        rowsEl.appendChild(li);
      });
    }
    roll(total);
    current = { rows, total, obj };
  };

  form?.addEventListener('input', compute);
  form?.addEventListener('change', compute);
  compute();
  totalEl.textContent = 'от ' + fmt(current.total);

  const summary = () =>
    `${current.obj}. ` + current.rows.map(([n, s]) => `${n}: ${fmt(s)}`).join('; ') + `. Ориентир: от ${fmt(current.total)}`;

  const setCalc = text => {
    calcField.value = text;
    formCalc.textContent = text;
    formCalc.hidden = !text;
  };
  $('#slipGo')?.addEventListener('click', () => setCalc('Смета на сайте: ' + summary()));
  $$('[data-topic]').forEach(a => a.addEventListener('click', () => setCalc('Тема: ' + a.dataset.topic)));

  /* ---------- отправка заявки ---------- */
  const lead = $('#leadForm');
  const status = $('#formStatus');
  lead?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = lead.querySelector('button[type="submit"]');
    const payload = {};
    new FormData(lead).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone || payload.phone.replace(/\D/g, '').length < 11) {
      status.textContent = 'Укажите имя и телефон полностью.';
      return;
    }
    const extra = payload.calc || '';
    payload.comment = [payload.comment, extra].filter(Boolean).join('\n');
    delete payload.calc;
    delete payload._gotcha;

    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    status.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      status.textContent = 'Заявка отправлена. Перезвоним в ближайшее время.';
      lead.reset();
      setCalc('');
    } catch (err) {
      console.error(err);
      status.textContent = 'Не получилось отправить. Позвоните: +7 (904) 386-16-99';
    } finally {
      setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 2500);
    }
  });
})();
