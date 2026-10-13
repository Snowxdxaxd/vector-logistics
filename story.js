/* V/001 — a deterministic, reversible logistics film. No external assets. */
(() => {
  'use strict';
  const boot = () => {
    const hero = document.querySelector('.hero');
    if (!hero || document.getElementById('cargo-story')) return;
    // Loading this script is sufficient; keep the host document untouched.
    if (!document.querySelector('link[data-cargo-style], link[href$="story.css"]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = new URL('story.css', scriptURL).href;
      style.dataset.cargoStyle = '';
      document.head.append(style);
    }
    const chapters = [
      ['loading', 'Каждый путь начинается\nс доверия.', 'Принимаем груз. Проверяем детали. Даём каждому отправлению свой маршрут.', 'Погрузка', 'ORIGIN / 001'],
      ['road', 'Дальше —\nбез лишних остановок.', 'Один контейнер, точный маршрут и контроль на каждом километре.', 'Дорога', 'OVERLAND / 002'],
      ['port', 'Меняем транспорт.\nНе ответственность.', 'Координируем перегрузку в порту. Ваш груз остаётся в одних руках.', 'Порт', 'TRANSFER / 003'],
      ['ocean', 'Расстояние —\nчасть плана.', 'Соединяем берега морскими линиями. Продолжаем следить за главным.', 'Океан', 'OVERSEAS / 004'],
      ['delivery', 'Последняя миля.\nПолный результат.', 'От причала до вашего склада. Завершаем маршрут, а не просто перевозку.', 'Доставка', 'DESTINATION / 005']
    ];
    const section = document.createElement('section');
    section.id = 'cargo-story';
    section.className = 'cargo-story';
    section.setAttribute('aria-label', 'Путь одного контейнера');
    section.innerHTML = `<div class="cargo-stage"><div class="cargo-grain" aria-hidden="true"></div><header class="cargo-heading"><div class="cargo-eyebrow"><span class="cargo-signal"></span> ВЕКТОР / ПУТЬ ОДНОГО ГРУЗА</div><div class="cargo-chapter-code"></div><h2></h2><p class="cargo-description"></p></header><div class="cargo-film"><canvas aria-label="Контейнер V/001: склад, грузовик, портовый кран, судно и склад получателя" role="img"></canvas></div><div class="cargo-manifest" aria-hidden="true"><span>SHIPMENT ID</span><strong>V/001</strong><span>ОДИН ГРУЗ.<br>ВЕСЬ ПУТЬ.</span></div><div class="cargo-bottom"><div class="cargo-controls"><button type="button" class="cargo-play" aria-pressed="false">Смотреть · 40 сек</button><span class="cargo-readout" aria-hidden="true">000%</span><a class="cargo-skip" href="#services">К услугам ↗</a></div><nav class="cargo-chapters" aria-label="Этапы маршрута">${chapters.map((c, i) => `<button type="button" data-seek="${i}" aria-pressed="${i === 0}"><span>0${i + 1}</span>${c[3]}</button>`).join('')}</nav><div class="cargo-track" aria-hidden="true"><i></i></div><div class="cargo-footnote"><span>SCROLL TO TRANSPORT</span><span>ORIGIN ───────────────── DESTINATION</span></div></div></div>`;
    hero.after(section);
    const heroLink = [...hero.querySelectorAll('a')].find(a => /Наши услуги/.test(a.textContent));
    if (heroLink) { heroLink.href = '#cargo-story'; heroLink.textContent = 'Смотреть историю ↓'; }
    const canvas = section.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { section.remove(); return; }
    const stage = section.querySelector('.cargo-stage');
    const film = section.querySelector('.cargo-film');
    const title = section.querySelector('h2');
    const description = section.querySelector('.cargo-description');
    const code = section.querySelector('.cargo-chapter-code');
    const play = section.querySelector('.cargo-play');
    const readout = section.querySelector('.cargo-readout');
    const track = section.querySelector('.cargo-track i');
    const buttons = [...section.querySelectorAll('[data-seek]')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const mix = (a, b, t) => a + (b - a) * t;
    const smooth = t => t * t * (3 - 2 * t);
    const between = (p, a, b) => smooth(clamp((p - a) / (b - a)));
    const frames = [[0, 230, 355], [.045, 230, 250], [.13, 500, 250], [.18, 500, 360], [.22, 500, 360], [.39, 1700, 360], [.42, 1700, 360], [.47, 1700, 190], [.54, 2200, 190], [.59, 2200, 350], [.62, 2200, 350], [.79, 3650, 350], [.81, 3650, 350], [.85, 3650, 185], [.89, 4030, 185], [.92, 4030, 360], [.955, 4490, 360], [.968, 4490, 240], [.984, 4490, 240], [.992, 4660, 240], [1, 4660, 385]];
    function cargoAt(p) {
      for (let i = 1; i < frames.length; i++) {
        if (p <= frames[i][0]) {
          const a = frames[i - 1], b = frames[i], t = between(p, a[0], b[0]);
          return { x: mix(a[1], b[1], t), y: mix(a[2], b[2], t) };
        }
      }
      return { x: 4660, y: 385 };
    }
    function truckPositions(p) {
      return {
        origin: mix(500, 1700, between(p, .22, .39)),
        destination: mix(4030, 4490, between(p, .92, .955)) + 650 * between(p, .969, .984)
      };
    }
    function cranePose(p, start, finish, retractEnd) {
      const cargo = cargoAt(clamp(p, start, finish));
      return {
        x: cargo.x,
        y: cargo.y - 85 * between(p, finish, retractEnd),
        attached: p >= start && p <= finish
      };
    }
    let width = 1200, height = 700, dpr = 1, target = 0, progress = 0;
    let raf = 0, visible = false, playing = false, lastTime = 0, chapter = -1;
    let autoplayStart = 0, autoplayProgress = 0;
    let paused = document.body.classList.contains('motion-paused');
    const staticMode = () => reduce.matches || paused;
    function rect(x, y, w, h, fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    function line(x, y, xx, yy, color, w = 1) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xx, yy); ctx.stroke(); }
    function poly(points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
    function text(value, x, y, size = 12, color = '#8ba997', weight = 400) { ctx.fillStyle = color; ctx.font = `${weight} ${size}px monospace`; ctx.fillText(value, x, y); }
    function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
    function container(x, y, w = 190, h = 90, main = false) {
      const front = main ? '#b7eb55' : '#294c45';
      poly([[x, y], [x + 15, y - 12], [x + w + 15, y - 12], [x + w, y]], main ? '#e1ff94' : '#4a6a59');
      poly([[x + w, y], [x + w + 15, y - 12], [x + w + 15, y + h - 12], [x + w, y + h]], main ? '#739c32' : '#193a34');
      rect(x, y, w, h, front);
      for (let i = 8; i < w - 4; i += 9) { rect(x + i, y + 5, 2, h - 10, main ? '#8ab33f' : '#183e35'); rect(x + i + 2, y + 5, 1, h - 10, main ? '#d8fb86' : '#385b4c'); }
      rect(x + 1, y + 2, w - 2, 3, main ? '#d9ff87' : '#557365');
      rect(x + 1, y + h - 5, w - 2, 4, main ? '#779b32' : '#102d27');
      if (main) {
        rect(x + 18, y + 23, 103, 38, '#b7eb55'); text('V/001', x + 23, y + 51, 28, '#173224', 700);
        text('VECTOR / SEALED', x + 22, y + 76, 7, '#233e26');
        [x + 3, x + w - 8].forEach(xx => { rect(xx, y + 5, 5, 7, '#e4ffa7'); rect(xx, y + h - 12, 5, 7, '#e4ffa7'); });
        rect(x + w - 35, y + 17, 21, 14, '#e2fcb2'); text('42G1', x + w - 33, y + 27, 6, '#314429');
      }
    }
    function warehouse(x, label, destination = false) {
      poly([[x - 30, 340], [x + 145, 268], [x + 445, 300], [x + 380, 345]], '#36534a');
      rect(x, 337, 380, 170, '#213b33');
      poly([[x + 380, 337], [x + 445, 300], [x + 445, 457], [x + 380, 507]], '#142f29');
      for (let i = 10; i < 375; i += 12) line(x + i, 343, x + i, 495, '#304b3f');
      rect(x + 23, 363, 135, 115, '#0b201a');
      rect(x + 170, 363, 175, 115, '#081e19');
      for (let i = 0; i < 4; i++) rect(x + 177, 369 + i * 6, 160, 2, '#35453a');
      rect(x + 22, 350, 323, 3, '#bad989');
      rect(x + 42, 382, 32, 85, '#233c2b'); rect(x + 83, 400, 52, 67, '#344b2d');
      rect(x + 30, 475, 330, 10, '#50634a');
      text(label, x + 24, 330, 16, '#d1dfc4', 700);
      text(destination ? 'DELIVERY / CONFIRMED' : 'ORIGIN / CARGO READY', x + 24, 499, 9, '#9ab295');
      [20, 158, 352].forEach(n => { rect(x + n, 456, 6, 30, '#b5ca78'); rect(x + n, 464, 6, 8, '#182b23'); });
    }
    function wheel(x, y, angle) {
      ellipse(x, y, 18, 18, '#040d0c'); ellipse(x, y, 12, 12, '#52645b'); ellipse(x, y, 7, 7, '#1d2d27');
      for (let k = 0; k < 5; k++) { const a = angle + k * Math.PI * 2 / 5; ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 1.8, 1.8, '#c2cbbb'); }
    }
    function truck(x, startX) {
      ellipse(x + 133, 489, 188, 12, '#061813');
      rect(x - 10, 452, 228, 10, '#617362'); rect(x - 6, 444, 207, 7, '#35473b');
      rect(x + 212, 458, 85, 11, '#172820');
      poly([[x + 225, 450], [x + 225, 382], [x + 269, 382], [x + 294, 415], [x + 302, 463], [x + 220, 463]], '#dce5ca');
      poly([[x + 233, 389], [x + 265, 389], [x + 280, 411], [x + 233, 411]], '#173e37');
      line(x + 253, 389, x + 253, 410, '#668278', 2);
      rect(x + 232, 419, 3, 26, '#9cad95'); rect(x + 238, 420, 10, 3, '#50684f');
      rect(x + 286, 427, 14, 18, '#213b30'); rect(x + 290, 449, 12, 5, '#f2f3b6');
      rect(x + 212, 390, 5, 55, '#80917b'); rect(x + 231, 446, 28, 6, '#53654e');
      text('V', x + 260, 438, 20, '#476331', 700);
      [22, 63, 211, 278].forEach(dx => wheel(x + dx, 471, (x - startX) / 18));
      rect(x + 81, 465, 75, 11, '#273e32');
    }
    function crane(x, trolleyX, cargoY, active) {
      const steel = '#62755a';
      for (const leg of [x, x + 270]) {
        line(leg, 500, leg + 40, 155, steel, 12);
        line(leg + 50, 495, leg + 40, 155, '#354f40', 6);
        for (let y = 200; y < 470; y += 45) line(leg + 12, y + 30, leg + 47, y, '#48604a', 3);
        rect(leg - 12, 493, 80, 11, '#84916b');
      }
      line(x - 90, 156, x + 570, 156, steel, 12);
      line(x - 90, 126, x + 570, 126, '#83926c', 5);
      for (let j = -90; j < 555; j += 40) { line(x + j, 128, x + j + 30, 151, '#62755a', 2); line(x + j + 30, 151, x + j + 40, 128, '#62755a', 2); }
      line(x + 40, 155, x + 105, 60, '#7d8b64', 4); line(x + 105, 60, x + 500, 125, '#7d8b64', 2);
      rect(x + 43, 157, 46, 38, '#87916d'); rect(x + 49, 164, 32, 17, '#16362e');
      const hookX = trolleyX;
      const hookY = cargoY - 16;
      rect(hookX + 39, 145, 108, 17, '#aab88a');
      line(hookX + 47, 160, hookX + 47, hookY, '#aeb992', 1.5);
      line(hookX + 142, 160, hookX + 142, hookY, '#aeb992', 1.5);
      rect(hookX + 12, hookY, 171, 6, '#d7dc9b');
      if (active) { line(hookX + 12, hookY + 6, hookX + 15, cargoY - 2, '#b8c69a', 2); line(hookX + 183, hookY + 6, hookX + 190, cargoY - 2, '#b8c69a', 2); }
      text('VECTOR / TERMINAL', x + 120, 117, 9, '#b5c59d');
    }
    function ship(x, p) {
      // Cargo's x coordinate equals the ship's reference point throughout the crossing.
      const bob = Math.sin(between(p, .62, .79) * Math.PI * 8) * 2;
      ctx.save(); ctx.translate(0, bob);
      ellipse(x + 20, 534, 340, 18, '#0a302b');
      poly([[x - 325, 444], [x + 350, 444], [x + 309, 506], [x + 263, 523], [x - 277, 523], [x - 310, 492]], '#132f29');
      poly([[x - 310, 486], [x + 321, 486], [x + 305, 511], [x + 263, 523], [x - 277, 523]], '#436454');
      line(x - 313, 451, x + 343, 451, '#c9d3a1', 3);
      rect(x - 290, 362, 88, 82, '#b5c3a8'); rect(x - 310, 342, 120, 27, '#d3dac3');
      for (let k = 0; k < 6; k++) rect(x - 301 + k * 17, 347, 12, 11, '#183c36');
      rect(x - 265, 306, 31, 36, '#526b53'); rect(x - 265, 306, 31, 9, '#abc664');
      line(x - 224, 342, x - 224, 281, '#cad5ad', 2); line(x - 247, 297, x - 199, 297, '#cad5ad', 2);
      container(x - 188, 377, 160, 63); container(x - 175, 305, 140, 62);
      container(x + 218, 382, 89, 59);
      for (let i = -310; i < 332; i += 17) line(x + i, 432, x + i, 443, '#859a7e');
      line(x - 310, 432, x + 335, 432, '#859a7e');
      text('VECTOR / HORIZON', x - 100, 480, 17, '#bccaa6', 700);
      text('IMO 001 / GLOBAL FREIGHT', x + 45, 506, 8, '#9db593');
      ctx.restore();
      return bob;
    }
    function draw(p) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const fit = Math.min(width / 1200, height / 700);
      ctx.translate((width - 1200 * fit) / 2, (height - 700 * fit) / 2); ctx.scale(fit, fit);
      const c = cargoAt(p);
      const zoom = .93 - Math.sin(between(p, .35, .8) * Math.PI) * .095;
      const camera = c.x - 470;
      const sky = ctx.createLinearGradient(0, 0, 0, 700);
      sky.addColorStop(0, '#061b18'); sky.addColorStop(.47, '#264b40'); sky.addColorStop(.73, '#799073'); sky.addColorStop(1, '#102c25');
      rect(0, 0, 1200, 700, sky);
      const halo = ctx.createRadialGradient(885 - p * 190, 265, 0, 885 - p * 190, 265, 330);
      halo.addColorStop(0, '#bbca813b'); halo.addColorStop(1, '#bbca8100'); rect(0, 0, 1200, 600, halo);
      ellipse(890 - p * 190, 265, 42, 42, '#d0d6a12b');
      for (let layer = 0; layer < 3; layer++) {
        const points = [[-100, 450]];
        for (let i = -2; i < 18; i++) { const x = i * 115 - (camera * (.06 + layer * .035)) % 115; points.push([x, 330 + layer * 25 - Math.sin(i * 2.2 + layer) * (38 - layer * 8)]); }
        points.push([1400, 500]); poly(points, ['#315447', '#294e40', '#244637'][layer]);
      }
      for (let i = -1; i < 35; i++) {
        const x = i * 57 - (camera * .22) % 57, h = 18 + (Math.sin(i * 5.1) + 1) * 28;
        rect(x, 418 - h, 29, h, '#234338');
        for (let j = 0; j < 3; j++) rect(x + 5 + j * 8, 426 - h, 2, 4, '#82916b55');
      }
      const sea = ctx.createLinearGradient(0, 425, 0, 700); sea.addColorStop(0, '#476f5d'); sea.addColorStop(.35, '#204c40'); sea.addColorStop(1, '#092d27'); rect(0, 428, 1200, 272, sea);
      for (let row = 0; row < 15; row++) {
        const y = 439 + row * 17;
        for (let i = -1; i < 18; i++) {
          const x = i * 85 + Math.sin(row * 4) * 50 - ((camera * .45 + p * 110) % 85);
          line(x, y, x + 15 + row * 2, y + Math.sin(i + row + p * 30) * 2, row % 3 ? '#77a38830' : '#afc59a40', 1 + row / 15);
        }
      }
      ctx.save(); ctx.translate(0, 65); ctx.scale(zoom, zoom); ctx.translate(-camera + (1200 / zoom - 1200) / 2, 0);
      // Both shores coexist in world space. The camera follows a single physical cargo.
      for (const [x, w] of [[-900, 2860], [3970, 2000]]) {
        rect(x, 481, w, 172, '#20392e'); poly([[x, 490], [x + w, 490], [x + w, 530], [x, 530]], '#667254');
        rect(x, 506, w, 8, '#0b251e'); rect(x, 545, w, 76, '#142b23'); line(x, 581, x + w, 581, '#81916a', 2);
        for (let d = x; d < x + w; d += 90) rect(d, 548, 40, 2, '#b6c18b');
      }
      warehouse(-70, '01 / ORIGIN'); warehouse(4520, '05 / DESTINATION', true);
      for (let i = 0; i < 8; i++) {
        const x = 700 + i * 120; line(x, 482, x, 350, '#68806a', 3); line(x, 350, x + 30, 350, '#68806a', 3); rect(x + 25, 350, 13, 3, '#d8e2b0');
      }
      text('EASTBOUND →', 1060, 533, 12, '#a0b88c');
      container(1470, 406, 130, 68); container(1475, 333, 130, 62); container(4190, 404, 180, 74);
      const shipX = mix(2200, 3650, between(p, .62, .79));
      const bob = ship(shipX, p);
      const trucks = truckPositions(p);
      truck(trucks.origin, 500);
      truck(trucks.destination, 4030);
      for (const [x, start, finish, retractEnd] of [[40, 0, .18, .215], [1690, .42, .59, .615], [3790, .81, .92, .938], [4470, .955, 1, 1.01]]) {
        const pose = cranePose(p, start, finish, retractEnd);
        crane(x, pose.x, pose.y, pose.attached);
      }
      const aboard = p >= .59 && p <= .81;
      if (c.y < 340) ellipse(c.x + 95, 486, 105, 8, '#06191088');
      container(c.x, c.y + (aboard ? bob : 0), 190, 90, true);
      if (p > .985) {
        const a = between(p, .985, 1); ctx.globalAlpha = a;
        rect(c.x + 32, c.y - 60, 148, 27, '#b7eb55'); text('DELIVERED / ✓', c.x + 43, c.y - 42, 12, '#173224', 700); ctx.globalAlpha = 1;
      }
      // Foreground glides faster than the landscape, giving the camera depth.
      for (let i = -1; i < 10; i++) { const x = i * 790; rect(x, 616, 250, 20, '#09241d'); line(x, 614, x + 250, 614, '#456046', 3); }
      ctx.restore();
      const vignette = ctx.createLinearGradient(0, 0, 0, 700); vignette.addColorStop(0, '#061b1888'); vignette.addColorStop(.34, '#061b1800'); vignette.addColorStop(.78, '#061b1800'); vignette.addColorStop(1, '#061b18'); rect(0, 0, 1200, 700, vignette);
    }
    function updateUI(p) {
      const n = Math.min(4, Math.floor(p * 5));
      section.dataset.progress = p.toFixed(4);
      section.dataset.chapter = chapters[n][0];
      track.style.transform = `scaleX(${p})`;
      readout.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
      if (chapter !== n) {
        chapter = n; title.textContent = chapters[n][1]; description.textContent = chapters[n][2]; code.textContent = chapters[n][4];
        buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === n)));
      }
    }
    function render() { updateUI(progress); draw(progress); }
    function stop() { playing = false; play.setAttribute('aria-pressed', 'false'); play.textContent = progress >= .999 ? 'Смотреть ещё раз' : 'Смотреть · 40 сек'; }
    function measure() {
      const r = section.getBoundingClientRect();
      visible = r.bottom > 0 && r.top < window.innerHeight;
      if (!staticMode()) target = clamp(-r.top / Math.max(1, section.offsetHeight - stage.offsetHeight));
    }
    function scrollToProgress(p) {
      const y = window.scrollY + section.getBoundingClientRect().top + p * (section.offsetHeight - stage.offsetHeight);
      window.scrollTo({ top: y, behavior: 'instant' });
    }
    function request() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      raf = 0;
      if (!visible || document.hidden) { stop(); return; }
      const dt = Math.min(64, lastTime ? now - lastTime : 16); lastTime = now;
      if (playing && !staticMode()) {
        target = clamp(autoplayProgress + (now - autoplayStart) / 40000);
        scrollToProgress(target);
        if (target >= 1) stop();
      }
      if (!staticMode()) progress = playing ? target : mix(progress, target, 1 - Math.exp(-dt / 80));
      if (Math.abs(progress - target) < .00015) progress = target;
      render();
      if (playing || (!staticMode() && Math.abs(progress - target) > .00015)) request();
      else lastTime = 0;
    }
    function resize() {
      const r = film.getBoundingClientRect(); width = Math.max(1, r.width); height = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      measure(); if (visible) { render(); request(); }
    }
    function modes() {
      paused = document.body.classList.contains('motion-paused');
      section.classList.toggle('cargo-static', staticMode());
      play.disabled = staticMode();
      play.textContent = staticMode() ? 'Выберите этап маршрута' : 'Смотреть · 40 сек';
      stop();
      if (staticMode()) { target = progress; play.textContent = 'Выберите этап маршрута'; }
      measure(); request();
    }
    play.addEventListener('click', () => {
      if (staticMode()) return;
      if (playing) { stop(); return; }
      if (progress > .995) progress = target = 0;
      autoplayProgress = progress; autoplayStart = performance.now(); playing = true;
      play.setAttribute('aria-pressed', 'true'); play.textContent = 'Пауза';
      scrollToProgress(progress); measure(); request();
    });
    const snapshots = [.18, .32, .51, .72, 1];
    buttons.forEach((button, i) => button.addEventListener('click', () => {
      stop(); target = snapshots[i];
      if (staticMode()) { progress = target; render(); }
      else { scrollToProgress(target); measure(); request(); }
    }));
    section.querySelector('.cargo-skip').addEventListener('click', stop);
    window.addEventListener('scroll', () => { measure(); if (!visible) stop(); request(); }, { passive: true });
    ['wheel', 'touchstart', 'pointerdown'].forEach(type => window.addEventListener(type, event => {
      if (type !== 'pointerdown' || !play.contains(event.target)) stop();
    }, { passive: true }));
    window.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(event.key)) stop();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { stop(); if (raf) cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
      else { measure(); request(); }
    });
    window.addEventListener('resize', resize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(film);
    if (typeof IntersectionObserver !== 'undefined') new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; if (visible) { measure(); request(); } else { stop(); if (raf) cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
    }).observe(section);
    new MutationObserver(modes).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (reduce.addEventListener) reduce.addEventListener('change', modes);
    else if (reduce.addListener) reduce.addListener(modes);
    modes(); resize(); updateUI(0);
  };
  const scriptURL = document.currentScript?.src || new URL('story.js', document.baseURI).href;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
