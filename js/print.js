(function () {
  "use strict";

  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var DEV_KEY = "775ec5ef-7bfa-445b-b9d7-919e42ac4585";
  var DEMO_HOST_RE = /^(localhost|127\.0\.0\.1)$|\.netlify\.app$/;

  // Направление -> формулировка в строке «Продукция»
  var DIRECTION = { "Убой": "для убоя" };

  // Ключ берём из ?id=<key>, затем из пути (/print/<key>), затем демо-ключ.
  function getKey() {
    var q = new URLSearchParams(location.search).get("id");
    if (q && UUID_RE.test(q)) return q.toLowerCase();

    var parts = location.pathname.replace(/^\/+|\/+$/g, "").split("/");
    var last = parts[parts.length - 1];
    if (UUID_RE.test(last)) return last.toLowerCase();

    return DEMO_HOST_RE.test(location.hostname) ? DEV_KEY : null;
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function setState(msg, isError) {
    var s = document.getElementById("state");
    if (!s) return;
    s.textContent = msg;
    s.className = "state" + (isError ? " state--error" : "");
  }

  // --- вспомогательные выборки из строковых значений ---
  function firstN(str) {                 // «60 голов» -> «60»
    var m = String(str || "").match(/\d+/);
    return m ? m[0] : "";
  }
  function beforeINN(str) {               // «ОсОО "X" , ИНН: ...» -> «ОсОО "X"»
    return String(str || "").split(/,?\s*ИНН/)[0].replace(/\s+$/, "");
  }
  function dateOnly(str) {                // «28.09.2026 00:00:00 МСК» -> «28.09.2026»
    var m = String(str || "").match(/\d{2}\.\d{2}\.\d{4}/);
    return m ? m[0] : String(str || "");
  }
  // форму берём из «Наименование и форма ВСД»: «… . Форма № 1» -> «… формы 1»
  function formTitle(name) {
    return String(name || "").replace(/\.\s*Форма\s*№\s*/i, " формы ");
  }

  // Строка документа; bold/big — модификаторы
  function line(text, mods) {
    var p = el("p", "doc__line" + (mods ? " " + mods : ""));
    p.textContent = text;
    return p;
  }

  function build(key, data) {
    var sheet = document.getElementById("sheet");
    sheet.innerHTML = "";

    var g    = data["Общие сведения"] || {};
    var prod = data["Информация о продукции"] || {};
    var orig = data["Сведения о происхождении продукции"] || {};
    var rcv  = data["Сведения о получателе"] || {};
    var snd  = data["Сведения об отправителе"] || {};
    var iss  = data["Сведения об оформлении"] || {};
    var prn  = data["Печать"] || {};

    var uuid = g["Уникальный идентификатор ВСД"] || key;
    var link = data["Ссылка"] || (location.origin + "/" + key);

    // Адрес получателя: часть до «. ОсОО …»
    var rcvAddr = String(rcv["Хозяйствующий субъект (владелец продукции)"] || "")
      .split(/\.\s*ОсОО/)[0];
    if (rcvAddr) rcvAddr += ".";

    var dir = DIRECTION[prod["Направление"]] || prod["Направление"] || "";
    var seria = String(g["Защищенный бланк ВСД"] || "").split(/\s+/)[0];

    // --- документ: QR слева, текст справа ---
    var doc = el("div", "doc");

    var qrCol = el("div", "doc__qr");
    doc.appendChild(qrCol);

    var text = el("div", "doc__text");

    text.appendChild(line(
      formTitle(g["Наименование и форма ВСД"]) + ": № " +
      (g["Номер ВСД"] || "") + " от " + (prn["Дата оформления"] || ""),
      "doc__line--bold"));

    text.appendChild(line("Фирма-отправитель: " + (snd["Отправитель"] || "")));
    text.appendChild(line("Фирма-получатель: " + (rcv["Получатель"] || "")));
    text.appendChild(line("Предприятие-получатель: " + beforeINN(rcv["Получатель"])));
    text.appendChild(line(" " + rcvAddr));

    text.appendChild(line(
      "Продукция: " + (prod["Продукция"] || "") + " " +
      firstN(prod["Объём"]) + (dir ? ", " + dir : ""),
      "doc__line--bold"));

    text.appendChild(line("Выработана: " + (prn["Выработана"] || "")));

    text.appendChild(line(
      (g["Учет"] || "") +
      (seria ? ". Защищенный бланк, серия RU " + seria + " номер..." : "")));

    text.appendChild(line('Код: "' + uuid + '"', "doc__line--code"));

    text.appendChild(line(
      'Сгенерировано системой "Меркурий" ' +
      (prn["Сгенерировано"] || "") +
      (iss["ФИО"] ? ", " + iss["ФИО"] : ""),
      "doc__line--bold doc__line--gen"));

    doc.appendChild(text);
    sheet.appendChild(doc);

    // QR из ссылки
    var ok = window.QR && window.QR.renderInto(qrCol, link, { ecc: "M", margin: 4 });
    if (!ok) qrCol.textContent = "QR недоступен";
  }

  function init() {
    var key = getKey();
    if (!key) {
      setState("Не указан идентификатор документа. Откройте /print.html?id=<ключ>", true);
      return;
    }

    fetch("/mock/" + key + ".json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) { build(key, data); })
      .catch(function (err) {
        setState("Не удалось загрузить документ: " + err.message, true);
      });
  }

  init();
})();
