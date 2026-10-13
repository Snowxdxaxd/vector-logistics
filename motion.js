const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = motionPreference.matches;
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.append(progressBar);
const motionButton = document.createElement('button');
motionButton.className = 'motion-toggle';
document.body.append(motionButton);
const journey = document.createElement('section');
journey.className = 'journey';
journey.setAttribute('aria-label', 'Путь вашего груза');
journey.innerHTML = `<div class="journey-sticky"><div class="journey-top"><span>V / ОТ ТОЧКИ А ДО ТОЧКИ Б</span><span>ПРОКРУТИТЕ, ЧТОБЫ ПРОЙТИ МАРШРУТ ↓</span></div><div class="journey-copy"><span class="eyebrow">ЛОГИСТИКА В ДВИЖЕНИИ</span><h2>Один груз.<br><span>Целая история.</span></h2><p class="journey-description">Принимаем груз, проверяем документы и собираем маршрут. Каждая деталь на своём месте.</p><div class="journey-stages"><span class="active">01 / ОТПРАВКА</span><span>02 / В ПУТИ</span><span>03 / ДОСТАВКА</span></div></div><div class="journey-diagram" aria-hidden="true"><div class="journey-core">↗</div><div class="journey-orbit"></div><span class="journey-node a">ORIGIN / A</span><span class="journey-node b">DESTINATION / B</span><span class="journey-node c">VECTOR / CONNECTED</span></div><div class="journey-meter"><span></span></div><div class="journey-count" aria-hidden="true">000 / 100</div></div>`;
document.querySelector('.services').before(journey);
const journeyStages = [...journey.querySelectorAll('.journey-stages span')];
const descriptions = [
  'Принимаем груз, проверяем документы и собираем маршрут. Каждая деталь на своём месте.',
  'Соединяем воздух, море и сушу. Координируем передачу груза, чтобы путь оставался непрерывным.',
  'Последняя миля — тоже наша задача. Доводим маршрут до двери и передаём груз получателю.'
];
let stage = -1;
function playTransition(element, frames, options) {
  element.getAnimations().forEach(animation => animation.cancel());
  if (!motionPaused) return element.animate(frames, options);
}
const revealElements = document.querySelectorAll('.section h2, .about-text, .values>div, .section-heading>p, .service-list details, .network-layout, .steps article, .faq-list, .contact-title');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
revealElements.forEach((element, index) => {
  element.classList.add('reveal');
  element.style.setProperty('--reveal-delay', `${index % 3 * 60}ms`);
  revealObserver.observe(element);
});
function syncMotion() {
  document.body.classList.toggle('motion-enabled', !motionPaused);
  document.body.classList.toggle('motion-paused', motionPaused);
  journey.classList.toggle('static', motionPaused);
  motionButton.textContent = motionPaused ? '▶ Включить анимацию' : 'Ⅱ Пауза анимации';
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  if (motionPaused) document.getAnimations().forEach(animation => {
    if (animation.effect?.target?.classList.contains('reveal')) animation.finish();
  });
  updateScroll();
  drawRoutes(0);
  manageLoop();
}
motionButton.addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
motionPreference.addEventListener('change', event => { motionPaused = event.matches; syncMotion(); });
let scrollQueued = false;
function updateScroll() {
  scrollQueued = false;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${maxScroll > 0 ? scrollY / maxScroll : 0})`;
  if (journey.getClientRects().length === 0) return;
  const box = journey.getBoundingClientRect();
  const progress = motionPaused ? 0 : Math.max(0, Math.min(1, -box.top / Math.max(1, box.height - innerHeight)));
  journey.style.setProperty('--journey-progress', progress);
  journey.style.setProperty('--journey-angle', `${progress * 330}deg`);
  journey.querySelector('.journey-count').textContent = `${String(Math.round(progress * 100)).padStart(3, '0')} / 100`;
  const nextStage = Math.min(2, Math.floor(progress * 3));
  if (stage !== nextStage) {
    stage = nextStage;
    journeyStages.forEach((item, index) => item.classList.toggle('active', stage === index));
    const description = journey.querySelector('.journey-description');
    description.textContent = descriptions[stage];
    playTransition(description, [{ opacity: .2, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
  }
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener('resize', updateScroll);
document.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => {
  playTransition(document.getElementById('route-content'), [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
}));
const accordionStates = new WeakMap();
function toggleDetails(details, open) {
  const previous = accordionStates.get(details);
  previous?.animation?.cancel();
  const summary = details.querySelector('summary');
  const start = details.getBoundingClientRect().height;
  details.style.height = '';
  details.open = true;
  const end = open ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
  accordionStates.set(details, { open });
  if (motionPaused) { details.open = open; return; }
  details.style.overflow = 'hidden';
  const animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 420, easing: 'cubic-bezier(.25,1,.3,1)' });
  accordionStates.set(details, { open, animation });
  animation.onfinish = () => {
    details.open = open;
    details.style.overflow = '';
    accordionStates.set(details, { open });
  };
}
document.querySelectorAll('.service-list details, .faq-list details').forEach(details => {
  details.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const open = !(accordionStates.get(details)?.open ?? details.open);
    if (open && details.closest('.service-list')) {
      document.querySelectorAll('.service-list details').forEach(other => {
        if (other !== details && other.open) toggleDetails(other, false);
      });
    }
    toggleDetails(details, open);
  });
});

const routeCanvas = document.getElementById('route-canvas');
const routeContext = routeCanvas.getContext('2d');
let canvasWidth = 1, canvasHeight = 1;
let sceneVisible = true, animationFrame = 0, lastTime = 0;
let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
const hero = document.querySelector('.hero');
hero.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || motionPaused) return;
  pointerX = event.clientX / innerWidth - .5;
  pointerY = event.clientY / innerHeight - .5;
}, { passive: true });
hero.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
function routePoint(t, lane) {
  const angle = (t * 1.65 - .82) * Math.PI;
  const spread = lane * .029;
  return { x: .48 + Math.sin(angle) * (.28 + spread), y: .49 + Math.cos(angle * 1.1) * .27 + lane * .027 + Math.sin(t * Math.PI * 2) * .075 };
}
function drawRoutes(time) {
  if (!routeContext) return;
  const ctx = routeContext, w = canvasWidth, h = canvasHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(smoothX * 28, smoothY * 18);
  const gradient = ctx.createRadialGradient(w*.55,h*.52,0,w*.55,h*.52,w*.55);
  gradient.addColorStop(0,'#5e8e3526');gradient.addColorStop(1,'#10181500');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#afc49328';
  for(let x=20;x<w;x+=32)for(let y=20;y<h;y+=32){ctx.beginPath();ctx.arc(x,y,.65,0,Math.PI*2);ctx.fill();}
  for(let lane=-5;lane<=5;lane++) {
    ctx.beginPath();
    for(let step=0;step<=100;step++) {
      const p=routePoint(step/100,lane);
      if(step===0)ctx.moveTo(p.x*w,p.y*h);else ctx.lineTo(p.x*w,p.y*h);
    }
    ctx.strokeStyle=lane===0?'#d5ff90aa':'#9bbb6a40';ctx.lineWidth=lane===0?1.6:.8;ctx.stroke();
    for(let dot=0;dot<3;dot++) {
      const t=(time*.000045+dot/3+lane*.016+1)%1;
      const p=routePoint(t,lane);
      ctx.fillStyle=lane%2===0?'#d5ff90':'#8eae7e';ctx.shadowColor='#c6ed79';ctx.shadowBlur=lane===0?14:0;
      ctx.fillRect(p.x*w-2,p.y*h-2,lane===0?6:3,lane===0?6:3);ctx.shadowBlur=0;
    }
  }
  const center=routePoint(.5,0);
  ctx.save();ctx.translate(center.x*w,center.y*h);ctx.rotate(-.28+smoothX*.1);
  const unit=Math.min(w,h)*.16;
  ctx.fillStyle='#20341f';ctx.strokeStyle='#c6ed7988';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-unit,-unit*.48);ctx.lineTo(0,-unit*.95);ctx.lineTo(unit,-unit*.48);ctx.lineTo(unit,unit*.48);ctx.lineTo(0,unit*.95);ctx.lineTo(-unit,unit*.48);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-unit,-unit*.48);ctx.lineTo(0,0);ctx.lineTo(unit,-unit*.48);ctx.moveTo(0,0);ctx.lineTo(0,unit*.95);ctx.stroke();
  for(let n=1;n<7;n++){const x=unit*n/7;ctx.beginPath();ctx.moveTo(x,-x*.48);ctx.lineTo(x,unit*.95-x*.47);ctx.strokeStyle='#c6ed792f';ctx.stroke();}
  ctx.fillStyle='#c6ed79';ctx.font=`600 ${Math.max(10,unit*.18)}px monospace`;ctx.fillText('V / 001',-unit*.78,unit*.12);ctx.restore();
  ctx.font='9px monospace';ctx.fillStyle='#b1c59e';
  [['A / ORIGIN',.025],['B / DESTINATION',.97]].forEach(([label,t])=>{const p=routePoint(t,0);ctx.fillText(label,p.x*w-35,p.y*h-20);ctx.strokeStyle='#c6ed79';ctx.strokeRect(p.x*w-5,p.y*h-5,10,10);});
  ctx.restore();
}
function animationLoop(time) {
  animationFrame = 0;
  if (time - lastTime > 32) {
    smoothX += (pointerX - smoothX) * .045;
    smoothY += (pointerY - smoothY) * .045;
    drawRoutes(time);lastTime = time;
  }
  manageLoop();
}
function manageLoop() {
  if (motionPaused || !sceneVisible || document.hidden) {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  } else if (!animationFrame) animationFrame = requestAnimationFrame(animationLoop);
}
new ResizeObserver(() => {
  const box=routeCanvas.getBoundingClientRect();canvasWidth=box.width;canvasHeight=box.height;
  const ratio=Math.min(devicePixelRatio||1,1.5);
  routeCanvas.width=Math.round(canvasWidth*ratio);routeCanvas.height=Math.round(canvasHeight*ratio);
  routeContext?.setTransform(ratio,0,0,ratio,0,0);drawRoutes(0);
}).observe(routeCanvas);
new IntersectionObserver(entries => { sceneVisible=entries[0].isIntersecting;manageLoop(); }).observe(routeCanvas);
document.addEventListener('visibilitychange',manageLoop);
syncMotion();
