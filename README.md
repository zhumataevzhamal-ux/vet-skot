# Учёт скота

Одностраничный сайт на чистых HTML / CSS / JS. Роутинг: `base_url/<hash-key>`
(например `/80f5101a-5e3b-41b3-81d4-ef00f42a84e5`).

## Запуск локально

Нужен сервер с fallback на `index.html` (иначе путь с ключом даст 404):

    npx serve -s .

## Структура

    index.html
    css/style.css
    js/app.js
    assets/        картинки
    mock/          моки <hash-key>.json (появятся позже)

## Хостинг

Любой путь должен отдавать `index.html`. Для nginx: `try_files $uri /index.html;`
