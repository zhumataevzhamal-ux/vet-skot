(function (global) {
  "use strict";

  // Генерация QR-кода из строки (ссылки).
  //
  // Требует подключённого /js/vendor/qrcode.js (глобальный qrcode).
  // Возвращает SVG-строку: вектор печатается чётко при любом DPI,
  // а камера читает за счёт запаса на коррекцию ошибок и «тихой зоны».
  //
  // options:
  //   ecc    — уровень коррекции ошибок "L" | "M" | "Q" | "H" (по умолчанию "M")
  //   margin — «тихая зона» в модулях по краям (по умолчанию 4 — стандарт)
  //
  // Возвращает { svg, ok, error }.
  function makeQrSvg(text, options) {
    options = options || {};
    var ecc = options.ecc || "M";
    var marginModules = options.margin == null ? 4 : options.margin;

    if (typeof global.qrcode !== "function") {
      return { ok: false, error: "Библиотека qrcode не загружена" };
    }
    if (!text) {
      return { ok: false, error: "Пустая ссылка" };
    }

    function build(data) {
      var qr = global.qrcode(0, ecc);   // 0 — авто-подбор размера под данные
      qr.addData(data);
      qr.make();
      // scalable: SVG без фикс. размеров, масштабируем через CSS.
      // cellSize 1 + margin = marginModules -> «тихая зона» ровно в модулях.
      return qr.createSvgTag({ cellSize: 1, margin: marginModules, scalable: true });
    }

    try {
      return { ok: true, svg: build(text) };
    } catch (e1) {
      // Фолбэк: если в ссылке оказались символы вне ASCII и кодировщик
      // споткнулся — приводим к ASCII через encodeURI и пробуем снова.
      try {
        return { ok: true, svg: build(encodeURI(text)) };
      } catch (e2) {
        return { ok: false, error: String(e2 && e2.message || e2) };
      }
    }
  }

  // Отрисовать QR в контейнер. Возвращает true при успехе.
  function renderQrInto(container, text, options) {
    if (!container) return false;
    var res = makeQrSvg(text, options);
    if (!res.ok) {
      container.textContent = "QR недоступен: " + res.error;
      return false;
    }
    container.innerHTML = res.svg;
    var svg = container.querySelector("svg");
    if (svg) {
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
    }
    return true;
  }

  global.QR = { makeSvg: makeQrSvg, renderInto: renderQrInto };
})(window);
