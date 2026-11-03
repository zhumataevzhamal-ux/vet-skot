(function () {
  "use strict";

  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Демо-ключ, когда в адресе нет hash-key: только для localhost
  // и тестового стенда на Netlify. На проде ключ всегда в пути.
  // TODO: убрать *.netlify.app, когда появится боевой домен.
  var DEV_KEY = "775ec5ef-7bfa-445b-b9d7-919e42ac4585";
  var DEMO_HOST_RE = /^(localhost|127\.0\.0\.1)$|\.netlify\.app$/;

  // base_url/hash-key  ->  hash-key
  function getKey() {
    var seg = location.pathname.replace(/^\/+|\/+$/g, "");
    if (UUID_RE.test(seg)) return seg.toLowerCase();
    return DEMO_HOST_RE.test(location.hostname) ? DEV_KEY : null;
  }

  function loadData(key) {
    return fetch("/mock/" + key + ".json", { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  // ---------- helpers ----------
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Статус -> модификатор плашки. Пока известен только «оформлен».
  var STATUS_BADGE = {
    "оформлен": "badge--success",
    "отрицательный": "badge--success"   // результат лаб. исследования
  };

  function renderBadge(td, value) {
    if (!value) return;
    td.appendChild(el("span", "badge " + (STATUS_BADGE[value] || ""), value));
  }

  // Значение ячейки: строка или массив строк (каждая с новой строки)
  function renderValue(td, value) {
    var lines = Array.isArray(value) ? value : [value];
    lines.forEach(function (line, i) {
      if (i) td.appendChild(document.createElement("br"));
      td.appendChild(document.createTextNode(line == null ? "" : String(line)));
    });
  }

  // ---------- components ----------

  // Блок с заголовком: «Общие сведения» и т.п.
  function Section(title, body) {
    var section = el("section", "section");
    section.appendChild(el("h4", "section__title", title));
    section.appendChild(body);
    return section;
  }

  var collapseId = 0;

  // Раскрывающийся блок: заголовок-кнопка, по клику показывает/скрывает body.
  // По умолчанию свёрнут, как на референсе.
  function CollapsibleSection(title, body, expanded) {
    var section = el("section", "section section--collapsible");
    var heading = el("h4", "section__title");
    var btn = el("button", "section__toggle");
    var bodyWrap = el("div", "section__body");
    var id = "section-body-" + (++collapseId);

    btn.type = "button";
    btn.setAttribute("aria-controls", id);
    btn.appendChild(el("span", "section__toggle-text", title));
    btn.insertAdjacentHTML("beforeend", ICON_ANGLE_DOUBLE);

    bodyWrap.id = id;
    bodyWrap.appendChild(body);

    function setExpanded(value) {
      btn.setAttribute("aria-expanded", String(value));
      bodyWrap.hidden = !value;
    }

    btn.addEventListener("click", function () {
      setExpanded(btn.getAttribute("aria-expanded") !== "true");
    });

    setExpanded(!!expanded);
    heading.appendChild(btn);
    section.appendChild(heading);
    section.appendChild(bodyWrap);
    return section;
  }

  // Двойная стрелка вниз (Font Awesome 4 «angle-double-down»).
  // В раскрытом состоянии переворачивается через CSS.
  var ICON_ANGLE_DOUBLE =
    '<svg class="section__toggle-icon" viewBox="77 269 998 966" aria-hidden="true">' +
    '<path d="M1075 352q0 13-10 23l-466 466q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l393 393 393-393q10-10 23-10t23 10l50 50q10 10 10 23zm0 384q0 13-10 23l-466 466q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l393 393 393-393q10-10 23-10t23 10l50 50q10 10 10 23z"/>' +
    "</svg>";

  // Таблица «подпись : значение» из объекта { "Подпись": значение }
  // renderers: { "Подпись": function (td, value) {...} } для особых полей
  // skip: ["Ключ", ...] — поля, которые не выводятся отдельной строкой
  function InfoTable(data, renderers, skip) {
    renderers = renderers || {};
    skip = skip || [];
    var table = el("table", "info-table");
    var tbody = el("tbody");

    Object.keys(data).forEach(function (label) {
      if (skip.indexOf(label) !== -1) return;
      var tr = el("tr");
      var th = el("th", null, label);
      var td = el("td");
      (renderers[label] || renderValue)(td, data[label]);
      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  // Таблица-список из массива объектов [{ "Колонка": значение }, ...].
  // Колонки — ключи записей в порядке первого появления.
  // options.boldHead  — жирные заголовки колонок (как в «Описи живых животных»)
  // options.renderers — { "Колонка": function (td, value, row) {...} } для особых ячеек
  function DataTable(rows, options) {
    options = options || {};
    var renderers = options.renderers || {};
    var columns = [];
    rows.forEach(function (row) {
      Object.keys(row).forEach(function (k) {
        if (columns.indexOf(k) === -1) columns.push(k);
      });
    });

    var table = el("table", "data-table" + (options.boldHead ? " data-table--bold-head" : ""));
    var thead = el("thead");
    var headRow = el("tr");
    columns.forEach(function (c) { headRow.appendChild(el("th", null, c)); });
    thead.appendChild(headRow);

    var tbody = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr");
      columns.forEach(function (c) {
        var td = el("td");
        (renderers[c] || renderValue)(td, row[c], row);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
  }

  // ---------- sections ----------
  function GeneralInfo(data) {
    return Section("Общие сведения", InfoTable(data, {
      "Статус": function (td, value) {
        td.appendChild(el("span", "badge " + (STATUS_BADGE[value] || ""), value));
      }
    }));
  }

  function ProductInfo(data) {
    return Section("Информация о продукции", InfoTable(data));
  }

  // Флаг страны транспорта. В моке поля под страну нет,
  // поэтому пока всегда KZ, как на референсе. TODO: ключ от заказчика.
  function TransportInfo(data) {
    return Section("Сведения о транспорте", InfoTable(data, {
      "Номер автомашины / полуприцепа / контейнера": function (td, value) {
        renderValue(td, value + " ");
        var flag = el("img", "flag");
        flag.src = "/assets/flag-kz.png";
        flag.alt = "";
        td.appendChild(flag);
      }
    }));
  }

  function IssueInfo(data) {
    return Section("Сведения об оформлении", InfoTable(data));
  }

  // «Документ, подтверждающий происхождение» + «Статус документа» в одной строке:
  // ссылка на документ и плашка статуса.
  function OriginInfo(data) {
    var DOC = "Документ, подтверждающий происхождение";
    var STATUS = "Статус документа";
    var renderers = {};

    renderers[DOC] = function (td, value) {
      if (!value) return;
      var link = el("a", "link", value);
      link.href = "#";                       // TODO: куда ведёт ссылка — уточнить
      link.setAttribute("data-placeholder", "");
      td.appendChild(link);
      if (data[STATUS]) {
        td.appendChild(el("span", "badge badge--inline " + (STATUS_BADGE[data[STATUS]] || ""), data[STATUS]));
      }
    };

    return Section("Сведения о происхождении продукции", InfoTable(data, renderers, [STATUS]));
  }

  function ServiceInfo(data) {
    return CollapsibleSection("Служебная информация", InfoTable(data), false);
  }

  function RecipientInfo(data) {
    return Section("Сведения о получателе", InfoTable(data));
  }

  function SenderInfo(data) {
    return Section("Сведения об отправителе", InfoTable(data));
  }

  function DocumentsInfo(rows) {
    return Section("Сведения о документах", DataTable(rows));
  }

  // TODO: на референсе заголовка над таблицей не видно — уточнить
  function AnimalsInfo(rows) {
    return Section("Опись живых животных", DataTable(rows, { boldHead: true }));
  }

  function LabInfo(rows) {
    return Section("Лабораторные исследования", DataTable(rows, {
      boldHead: true,
      renderers: { "Результат исследования": renderBadge }
    }));
  }

  function ImmunizationInfo(rows) {
    return Section("Сведения об иммунизации/обработке против паразитов", DataTable(rows, { boldHead: true }));
  }

  function Columns(left, right) {
    var row = el("div", "columns");
    [left, right].forEach(function (items) {
      var col = el("div", "columns__col");
      items.forEach(function (node) { if (node) col.appendChild(node); });
      row.appendChild(col);
    });
    return row;
  }

  // ---------- header ----------
  function initHeader() {
    var nav = document.querySelector(".header__nav");
    if (!nav) return;

    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;

      // заглушки: пока ведут в никуда
      if (link.hasAttribute("data-lang") || link.hasAttribute("data-placeholder")) {
        e.preventDefault();
      }

      if (link.hasAttribute("data-lang")) {
        nav.querySelectorAll("[data-lang]").forEach(function (el) {
          el.classList.toggle("is-active", el === link);
        });
        document.documentElement.lang = link.getAttribute("data-lang");
      }
    });
  }

  // ---------- scroll to top ----------
  // Кнопка появляется, когда страницу прокрутили больше чем на SCROLL_MIN px.
  function initScrollUp() {
    var SCROLL_MIN = 200;
    var btn = document.querySelector(".scroll-up");
    if (!btn) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ticking = false;

    function update() {
      btn.hidden = window.pageYOffset <= SCROLL_MIN;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    update();
  }

  // ---------- init ----------
  document.getElementById("app").addEventListener("click", function (e) {
    var link = e.target.closest("a[data-placeholder]");
    if (link) e.preventDefault();
  });

  var key = getKey();
  window.App = { key: key, data: null };
  initHeader();
  initScrollUp();

  if (!key) return; // экран «не найдено» — ждём дизайн

  var app = document.getElementById("app");
  loadData(key)
    .then(function (data) {
      window.App.data = data;
      var d = function (k, fn) { return data[k] ? fn(data[k]) : null; };

      var general = d("Общие сведения", GeneralInfo);
      if (general) app.appendChild(general);

      var columns = Columns(
        [d("Информация о продукции", ProductInfo)],
        [d("Сведения о транспорте", TransportInfo), d("Сведения об оформлении", IssueInfo)]
      );
      if (general) columns.style.marginTop = "25.33px"; // TODO: отступ между блоками не подтверждён
      app.appendChild(columns);

      var columns2 = Columns(
        [d("Сведения о происхождении продукции", OriginInfo)],
        [d("Служебная информация", ServiceInfo)]
      );
      columns2.style.marginTop = "25.33px"; // TODO: отступ между рядами не подтверждён
      app.appendChild(columns2);

      var columns3 = Columns(
        [d("Сведения о получателе", RecipientInfo)],
        [d("Сведения об отправителе", SenderInfo)]
      );
      columns3.style.marginTop = "25.33px"; // TODO: отступ между рядами не подтверждён
      app.appendChild(columns3);

      var docs = d("Сведения о документах", DocumentsInfo);
      if (docs) {
        docs.style.marginTop = "25.33px"; // TODO: отступ между рядами не подтверждён
        app.appendChild(docs);
      }

      var animals = d("Опись живых животных", AnimalsInfo);
      if (animals) {
        animals.style.marginTop = "25.33px"; // TODO: отступ между блоками не подтверждён
        app.appendChild(animals);
      }

      [
        d("Лабораторные исследования", LabInfo),
        d("Сведения об иммунизации/обработке против паразитов", ImmunizationInfo)
      ].forEach(function (node) {
        if (!node) return;
        node.style.marginTop = "25.33px";
        app.appendChild(node);
      });
    })
    .catch(function (err) {
      console.error("Не удалось загрузить данные:", err);
    });
})();
