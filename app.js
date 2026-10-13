const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.header nav');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.classList.toggle('is-open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Открыть меню');
}));
const dialog = document.getElementById('quote-dialog');
const form = document.getElementById('quote-form');
const formView = document.getElementById('form-view');
const successView = document.getElementById('success-view');
let requestText = '';
document.querySelectorAll('[data-quote]').forEach(button => button.addEventListener('click', () => {
  formView.hidden = false;
  successView.hidden = true;
  if (button.dataset.service) form.elements.transport.value = button.dataset.service;
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  requestText = `Черновик заявки на перевозку\n\nМаршрут: ${data.get('origin')} → ${data.get('destination')}\nТранспорт: ${data.get('transport')}\nВес: ${data.get('weight')} кг\nИмя: ${data.get('name')}\nEmail: ${data.get('email')}\n\nДемонстрационный сайт ВЕКТОР. Заявка не отправлена.`;
  document.getElementById('request-summary').textContent = requestText;
  formView.hidden = true;
  successView.hidden = false;
  document.getElementById('download-request').focus();
});
document.getElementById('back-to-form').addEventListener('click', () => {
  formView.hidden = false;
  successView.hidden = true;
  form.elements.origin.focus();
});
document.getElementById('download-request').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([requestText], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vector-request.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
const regions = {
  china: ['Китай → Россия', 'От производственной линии до вашего склада. Авиа, море и автомобильные маршруты для регулярных и разовых поставок.', 'АВИА / МОРЕ / АВТО'],
  asia: ['Азия → Россия', 'Вьетнам, Таиланд, Малайзия и Сингапур. Подбираем морские и авиационные маршруты с консолидацией и доставкой до склада.', 'АВИА / МОРЕ'],
  east: ['Ближний Восток → Россия', 'ОАЭ и другие страны региона. Организуем поставки через ключевые транспортные узлы с сопровождением документов.', 'АВИА / МОРЕ / МУЛЬТИМОДАЛЬНЫЕ']
};
document.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-region]').forEach(tab => {
    const selected = tab === button;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-pressed', String(selected));
  });
  const [title, description, modes] = regions[button.dataset.region];
  const panel = document.getElementById('route-content');
  panel.querySelector('h3').textContent = title;
  panel.querySelector('p').textContent = description;
  panel.querySelector('.route-modes').textContent = modes;
}));
