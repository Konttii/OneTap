# OneTap Gaming Club 🎮

## Описание проекта
OneTap — это современный веб-сайт для киберспортивного и игрового клуба. Проект разработан для демонстрации удобного интерфейса бронирования игровых зон, ознакомления с меню, услугами и командой клуба. Дизайн выполнен в агрессивном геймерском стиле с использованием темных тонов и ярких акцентов, что полностью соответствует тематике.

## Живая версия (GitHub Pages)
🔗 https://konttii.github.io/OneTap/

## Структура проекта
В проекте реализовано 2 версии сайта:
1. **Оригинальная версия** (написана на чистом HTML и CSS Flexbox, находится в папке `html/`)
2. **Bootstrap версия** (адаптивная версия с использованием фреймворка Bootstrap 5, находится в папке `one-tap-bootstrap/html/`)

Корневой `index.html` сразу перенаправляет на главную страницу основной версии (`html/index.html`).

### Список HTML-страниц:
- `index.html` — Главная страница клуба.
- `zones.html` — Описание игровых зон (Bootcamp, VIP, Standard).
- `menu.html` — Меню напитков и снеков клуба.
- `services.html` — Услуги и прайс-лист.
- `team.html` — Информация о нашей команде и персонале.
- `contact.html` — Контактные данные и форма обратной связи.
- `media-queries.html` — (только в Bootstrap-версии) Адаптивная типографика и сетка карточек на чистом CSS Media Queries.

## Технологии
- **HTML5** — семантическая разметка страниц.
- **CSS3 (Flexbox)** — стилизация и адаптивный дизайн (`@media` запросы).
- **Bootstrap 5** — использован во второй версии для надежной адаптивности и сеточной структуры.
- **Google Fonts** — подключены шрифты 'Inter' и 'Anton'.

## Команда разработчиков
1. **Kuandyk Koshanov** — Главная страница (`index.html`) и Зоны (`zones.html`)
2. **Alimzhan Tileshov** — Команда (`team.html`) и Меню (`menu.html`)
3. **Nuradil Uzakbayev** — Услуги (`services.html`) и Контакты (`contact.html`)

## Assignment #4 — JavaScript (Vanilla JS)
Скрипт `js/main.js` (в Bootstrap-версии — `one-tap-bootstrap/js/main.js`) подключён ко всем страницам и проверяет наличие элементов перед навешиванием слушателей.
- **Form Validation** — форма бронирования на `contact.html` (имя, email, пароль ≥ 8 символов, подтверждение пароля) и форма подписки в попапе.
- **Accordion** — FAQ на главной странице (`index.html`), плавное раскрытие/сворачивание.
- **Popup Form** — кнопка **Subscribe** (плавающая) открывает модальное окно; закрытие по `×`, по клику на фон и по `Esc`.
- **Change Background Color** — плавающая кнопка 🎨 открывает панель: выбор любого цвета через color picker, готовые цвета, Random и Reset (слишком светлые цвета автоматически затемняются, чтобы текст читался).
- **Date & Time** — текущие дата и время в футере (`October 9, 2026, 10:45:12 AM`), обновление каждую секунду.

## Assignment #5 — Advanced JavaScript & DOM Manipulation
Весь код — в `js/main.js` (копия в `one-tap-bootstrap/js/main.js`), стили — только во внешних CSS-файлах (без `<style>`, `style=""` и встроенных `<script>`).
- **Dynamic Style Changes** — кнопка ☀️/🌙 переключает дневную/ночную тему (выбор сохраняется).
- **Manipulating Attributes** — звёздный рейтинг на главной (`querySelectorAll`, классы и `aria-pressed`).
- **Event Listeners on Buttons** — кнопка **Clear form** на `contact.html` очищает поля через `querySelectorAll(...).forEach`.
- **Keyboard Events** — навигация по меню стрелками ← → ↑ ↓, `Home` / `End` (`keydown` + `focus()`).
- **Callbacks** — форма бронирования отправляется асинхронно через `fetch` (POST), результат приходит в callback.
- **Switch Statements** — фильтр прайс-листа на `menu.html` (All / Drinks / Food / Snacks / до 600 ₸).
- **Objects, Arrays & Loops, Higher-Order Functions** — объект `menu` с методами `filterBy()`, `averagePrice()` (`for`), `itemsForBudget()` (`while`), `map` / `filter` / `forEach`.
- **Sounds** — короткие звуки (Web Audio API) при клике, рейтинге и отправке формы; новый звук останавливает предыдущий.
- **Animations** — CSS-переходы: появление пунктов прайс-листа, увеличение звёзд, плавная смена темы.

## Assignment #6 — jQuery (Search, UX Engagement & Web App Functionality)
Во все HTML-страницы внутри `<head>` подключён CDN `jQuery 4.0.0`, а в `js/main.js` (и `one-tap-bootstrap/js/main.js`) реализована инициализация через `$(document).ready()` с выводом `"jQuery is ready!"` в консоль:
- **Part 1. jQuery Search**
  - **Task 1 (Real-time Search & Live Filter)** — живой поиск по меню снеков и прайс-листу (`menu.html`) и по вопросам FAQ (`index.html`) через `.on('keyup')` и `.filter()`.
  - **Task 2 (Autocomplete Search Suggestions)** — выпадающий список подсказок (`#menu-suggestions`, `#faq-suggestions`) при вводе текста с выбором по клику.
  - **Task 3 (Search Highlighting)** — подсветка всех совпадений ключевых слов в FAQ и меню с помощью `.html()`, регулярных выражений (`RegExp`) и `.wrap('<mark class="search-highlight"></mark>')`.
- **Part 2. UX Engagement Elements with jQuery**
  - **Task 4 (Scroll Progress Bar)** — яркий градиентный индикатор прокрутки страницы в верхней части экрана (`#scroll-progress-bar`), обновляемый при `scroll`.
  - **Task 5 (Animated Number Counter)** — секция статистики клуба **OneTap in numbers** на главной странице (`index.html`) с плавной анимацией чисел (`1500+`, `80`, `500Hz`, `120+`) через jQuery `.animate()`.
  - **Task 6 (Loading Spinner on Submit)** — при отправке форм бронирования и подписки кнопка показывает спиннер и текст `Please wait…`, временно блокируется (`disabled`) и возвращается в исходное состояние после ответа.
- **Part 3. Using jQuery to Improve Web App Functionality**
  - **Task 7 (Notification System)** — всплывающие toast-уведомления (`#toast-container`) с плавным появлением и исчезновением (`.fadeIn()` / `.fadeOut()`) при отправке/очистке формы, оценке клуба, смене темы и копировании.
  - **Task 8 (Copied to Clipboard Button)** — кнопки **Copy** рядом с адресом клуба, Instagram и промокодом (`ONETAP20`) на `contact.html`, `index.html` и `services.html`: по событию `.on('copy')` меняют иконку на галочку `✓` и показывают тултип `"Copied to clipboard!"`.
  - **Task 9 (Image Lazy Loading)** — отложенная загрузка изображений (`img.lazy-img[data-src]`) на страницах `zones.html`, `menu.html`, `team.html` и `services.html` по мере прокрутки (`scroll()`, `.offset()`, `.attr('src')`).
  - **Interactive Table & Page Navigation (Defense / Feature Enhancement)**:
    - **Навигация в таблице за счёт кнопок**: на странице тарифов (`services.html`) добавлена интерактивная панель с кнопками `▲`, `▼`, `◄`, `►` и поддержка стрелок клавиатуры (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Enter`) для перемещения между ячейками матрицы тарифов с подсветкой активного тарифа и быстрой кнопкой бронирования. В меню также поддержана навигация по прайс-листу стрелками.
    - **Навигация по странице за счёт кнопок**: плавающие кнопки `▲` (наверх), `▼` (вниз) и `↕` (к следующей секции) в панели быстрых действий для плавного перемещения по секциям страниц.

## Запуск проекта
Проект не требует сложной установки (отсутствует backend). Все пути к изображениям и стилям относительные.
Для просмотра достаточно открыть стартовый файл `index.html` (в корне папки) в любом современном браузере. Для отправки формы бронирования нужен интернет (тестовый API jsonplaceholder).
