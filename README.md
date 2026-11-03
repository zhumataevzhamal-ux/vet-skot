# Учёт скота

Одностраничный сайт на чистых HTML / CSS / JS, без сборки.
Роутинг: `base_url/<hash-key>`, например `/775ec5ef-7bfa-445b-b9d7-919e42ac4585`.
Данные берутся из `mock/<hash-key>.json`.

## Запуск локально

Открывать двойным кликом (`file://`) нельзя: пути абсолютные, а JSON браузер
с диска не загрузит. Нужен сервер с fallback на `index.html`:

    npx serve -s .

и открыть `http://localhost:3000/775ec5ef-7bfa-445b-b9d7-919e42ac4585`.
На `localhost` без ключа в адресе подставляется ключ демо-мока.

## Деплой (Netlify)

Всё настроено в `netlify.toml`: сборки нет, публикуется корень репозитория,
любой путь отдаёт `index.html`. Открывать сайт с ключом:

    https://<сайт>.netlify.app/775ec5ef-7bfa-445b-b9d7-919e42ac4585

## Структура

    index.html
    css/style.css
    js/app.js
    assets/        картинки
    mock/          моки <hash-key>.json
    netlify.toml   настройки Netlify
    QUESTIONS.md   вопросы к заказчику
