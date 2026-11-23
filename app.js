(() => {
  "use strict";

  const art = window.YearInBloom;
  const get = id => document.getElementById(id);
  const storageKey = "year-in-bloom-2026-draft";
  let language = initialLanguage();
  const locale = () => window.BloomLocales.get(language);
  const defaultAppearance = {
    palette: "lagoon",
    format: "post",
    captionSize: 12,
    flowerSize: 112,
    authorSize: 140,
    seed: 1664357835
  };
  const author = get("author");
  const year = get("year");
  const yearFeedback = get("year-feedback");
  const month = get("month");
  const theme = get("theme");
  const caption = get("caption");
  const form = get("event-form");
  const errorNotice = get("event-feedback");
  const captionNotice = get("caption-feedback");
  const list = get("event-list");
  const canvas = get("card");
  const download = get("download");
  const share = get("share");
  const remix = get("remix");
  const palette = get("palette");
  const format = get("format");
  const fontSize = get("font-size");
  const flowerSize = get("flower-size");
  const authorSize = get("author-size");
  const status = get("result-status");
  const labelMeasure = document.createElement("canvas").getContext("2d");

  let mine = restoreDraft();
  const examples = Object.fromEntries(["ru", "en"].map(code => [code, {
    author: window.BloomLocales.get(code).exampleName,
    year: art.defaultYear,
    events: art.sampleEvents(15, code),
    appearance: {...defaultAppearance}
  }]));
  let mode = "mine";
  let side = "cover";
  let page = 0;
  let editing = null;
  let shareImage = null;
  let shareTimer = null;
  let renderVersion = 0;
  const hasFileSharing = supportsFileSharing();

  function current() {
    return mode === "mine" ? mine : examples[language];
  }

  function initialLanguage() {
    const requested = new URL(location.href).searchParams.get("lang");
    if (window.BloomLocales.supports(requested)) return requested;
    try {
      const remembered = localStorage.getItem("year-in-bloom-language");
      if (window.BloomLocales.supports(remembered)) return remembered;
    } catch {
      // Language selection also works without storage.
    }
    return "ru";
  }

  function updateOptions(select, names, placeholder) {
    const selected = select.value;
    select.replaceChildren();
    if (placeholder) addOption(select, "", locale().choose);
    for (const [value, name] of Object.entries(names)) addOption(select, value, name);
    select.value = selected;
  }

  function translatePage() {
    const text = locale();
    document.documentElement.lang = language;
    document.title = text.title;
    document.querySelector('meta[name="description"]').content = text.description;
    document.querySelectorAll("[data-i18n]").forEach(element => {
      element.textContent = text[element.dataset.i18n];
    });
    document.querySelectorAll("[data-i18n-html]").forEach(element => {
      element.innerHTML = text[element.dataset.i18nHtml];
    });
    for (const attribute of ["aria-label", "placeholder"]) {
      document.querySelectorAll("[data-i18n-" + attribute + "]").forEach(element => {
        element.setAttribute(attribute, text[element.getAttribute("data-i18n-" + attribute)]);
      });
    }
    document.querySelectorAll("[data-language]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    updateOptions(month, text.months, true);
    updateOptions(theme, text.themes, true);
    updateOptions(palette, text.paletteNames, false);
    const suffix = language === "en" ? "/en" : "";
    document.querySelector('[data-i18n="dataArt"]').href = "https://datavisualizationstudio.com/dataartbase" + suffix;
    document.querySelector('[data-i18n="process"]').href = "https://datavisualizationstudio.com/floweryear" + suffix;
    document.querySelector('[data-i18n="creator"]').href = "https://datavisualizationstudio.com" + suffix;
    get("event-title").textContent = editing === null ? text.newEvent : text.editEvent;
    get("event-submit").textContent = editing === null ? text.add : text.save;
    if (!errorNotice.hidden) errorNotice.textContent = text.chooseBoth;
  }

  function changeLanguage(next) {
    if (next === language) return;
    language = next;
    try {
      localStorage.setItem("year-in-bloom-language", language);
    } catch {
      // The current selection still applies when storage is disabled.
    }
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    history.replaceState(null, "", url);
    if (mode === "example") {
      page = 0;
      syncControls();
      clearForm();
    }
    translatePage();
    renderRanges();
    showCaptionLimit();
    renderEvents();
    renderHero();
    renderResult();
  }

  function restoreDraft() {
    const empty = {author: "", year: art.defaultYear, events: [], appearance: {...defaultAppearance}};
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!stored || !Array.isArray(stored.events)) return empty;
      const seen = new Set();
      const validEvents = stored.events.filter(event => {
        if (!event || !Number.isSafeInteger(event.id) || seen.has(event.id) ||
            !Number.isInteger(event.month) || event.month < 0 || event.month >= art.months.length ||
            typeof event.label !== "string") return false;
        seen.add(event.id);
        return true;
      }).slice(0, art.maxEvents).map(({id, month, theme, label}) => ({
        id, month, label,
        theme: Number.isInteger(theme) && theme >= 0 && theme < art.themes.length ? theme : null
      }));
      const saved = stored.appearance || {};
      return {
        author: typeof stored.author === "string" ? art.cleanAuthor(stored.author) : "",
        year: art.parseYear(stored.year) ?? art.defaultYear,
        events: validEvents,
        appearance: {
          palette: Object.hasOwn(art.paletteNames, saved.palette) ? saved.palette : defaultAppearance.palette,
          format: ["square", "story"].includes(saved.format) ? saved.format : "post",
          captionSize: bounded(saved.captionSize, art.minCaptionSize, art.maxCaptionSize, defaultAppearance.captionSize),
          flowerSize: bounded(saved.flowerSize, 45, 185, defaultAppearance.flowerSize),
          authorSize: bounded(saved.authorSize, 65, 165, defaultAppearance.authorSize),
          seed: Number.isSafeInteger(saved.seed) ? saved.seed : defaultAppearance.seed
        }
      };
    } catch {
      return empty;
    }
  }

  function bounded(value, min, max, fallback) {
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }

  function saveDraft() {
    if (mode !== "mine") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(mine));
    } catch {
      // The editor is still usable when local storage is disabled or full.
    }
  }

  function supportsFileSharing() {
    if (!navigator.share || !navigator.canShare || typeof File !== "function") return false;
    try {
      return navigator.canShare({files: [new File([], "god-v-tsvetah.png", {type: "image/png"})]});
    } catch {
      return false;
    }
  }

  function addOption(select, value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  function renderHero() {
    const design = art.prepare(art.sampleEvents(15, language), defaultAppearance);
    art.drawCard(get("hero-card"), design, {
      ...defaultAppearance, language, side: "cover", page: 0, author: locale().exampleName, year: art.defaultYear
    });
  }

  function syncControls() {
    const draft = current();
    author.value = draft.author;
    year.value = draft.year;
    year.removeAttribute("aria-invalid");
    yearFeedback.hidden = true;
    palette.value = draft.appearance.palette;
    format.value = draft.appearance.format;
    fontSize.value = draft.appearance.captionSize;
    flowerSize.value = draft.appearance.flowerSize;
    authorSize.value = draft.appearance.authorSize;
    get("use-mine").setAttribute("aria-pressed", String(mode === "mine"));
    get("use-example").setAttribute("aria-pressed", String(mode === "example"));
    renderRanges();
  }

  function renderRanges() {
    get("font-value").textContent = new Intl.NumberFormat(language).format(fontSize.valueAsNumber);
    get("flower-value").textContent = flowerSize.value + "%";
    get("author-value").textContent = authorSize.value + "%";
  }

  function moveToEditor() {
    form.scrollIntoView({block: "nearest"});
    month.focus({preventScroll: true});
  }

  function clearForm() {
    form.reset();
    editing = null;
    get("event-title").textContent = locale().newEvent;
    get("event-submit").textContent = locale().add;
    get("event-cancel").hidden = true;
    get("event-submit").disabled = current().events.length >= art.maxEvents;
    errorNotice.hidden = true;
    month.removeAttribute("aria-invalid");
    theme.removeAttribute("aria-invalid");
    showCaptionLimit();
  }

  function showCaptionLimit() {
    const result = art.validateCaption(labelMeasure, caption.value, language);
    captionNotice.textContent = result.length + " / 24" + (result.error ? " · " + result.error : "");
    captionNotice.classList.toggle("error", Boolean(result.error));
    caption.setAttribute("aria-invalid", String(Boolean(result.error)));
    return result;
  }

  function eventTitle(event) {
    return event.label || locale().themes[event.theme] || locale().unthemed;
  }

  function makeEventButton(action, event, label, symbol) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.dataset.action = action;
    button.dataset.id = event.id;
    button.textContent = symbol;
    button.setAttribute("aria-label", label + " «" + eventTitle(event) + "»");
    return button;
  }

  function renderEvents() {
    const events = current().events;
    const ordered = events.slice().sort((a, b) => a.month - b.month || a.id - b.id);
    const rows = ordered.map(event => {
      const row = document.createElement("li");
      const copy = document.createElement("div");
      copy.className = "event-copy";
      const name = document.createElement("strong");
      name.textContent = eventTitle(event);
      const detail = document.createElement("small");
      detail.textContent = locale().months[event.month] + " · " + (locale().themes[event.theme] ?? locale().noTheme);
      copy.append(name, detail);
      const actions = document.createElement("div");
      actions.className = "event-actions";
      actions.append(
        makeEventButton("edit", event, locale().edit, "✎"),
        makeEventButton("remove", event, locale().remove, "×")
      );
      row.append(copy, actions);
      return row;
    });
    list.replaceChildren(...rows);
    get("event-count").textContent = events.length + " / " + art.maxEvents;
    get("empty-list").hidden = events.length > 0;
  }

  function renderResult() {
    const draft = current();
    const eventsWithThemes = draft.events.filter(event => event.theme !== null);
    const design = art.prepare(eventsWithThemes, {...draft.appearance, language}, side === "reveal" ? labelMeasure : null);
    const total = design?.pages.length || 0;
    page = Math.min(Math.max(0, page), Math.max(0, total - 1));
    get("view-cover").setAttribute("aria-pressed", String(side === "cover"));
    get("view-reveal").setAttribute("aria-pressed", String(side === "reveal"));
    get("placeholder").hidden = Boolean(design);
    canvas.hidden = !design;
    download.disabled = !design;
    remix.disabled = !design;
    get("jump-to-card").hidden = !design;
    share.hidden = !hasFileSharing || !design;
    get("card-pages").hidden = side !== "reveal" || total < 2;
    get("card-page").textContent = (page + 1) + " / " + total;
    get("previous").disabled = page === 0;
    get("next").disabled = page + 1 >= total;
    status.textContent = eventsWithThemes.length < draft.events.length
      ? locale().reassign
      : "";
    clearTimeout(shareTimer);
    const version = ++renderVersion;
    shareImage = null;
    share.disabled = true;
    if (!design) return;

    art.drawCard(canvas, design, {...draft.appearance, language, side, page, author: draft.author, year: draft.year});
    if (hasFileSharing) {
      shareTimer = setTimeout(() => {
        canvas.toBlob(blob => {
          if (version !== renderVersion || !blob) return;
          shareImage = blob;
          share.disabled = false;
        }, "image/png");
      }, 90);
    }
  }

  function chooseMode(newMode) {
    if (mode === newMode) {
      if (newMode === "example") {
        page = 0;
        setSide("cover");
      }
      return;
    }
    mode = newMode;
    side = "cover";
    page = 0;
    syncControls();
    clearForm();
    renderEvents();
    renderResult();
  }

  function setSide(next) {
    if (side === next) return;
    side = next;
    renderResult();
  }

  function saveEvent(event) {
    event.preventDefault();
    const validation = showCaptionLimit();
    const missingMonth = month.value === "";
    const missingTheme = theme.value === "";
    month.setAttribute("aria-invalid", String(missingMonth));
    theme.setAttribute("aria-invalid", String(missingTheme));
    if (missingMonth || missingTheme) {
      errorNotice.textContent = locale().chooseBoth;
      errorNotice.hidden = false;
      (missingMonth ? month : theme).focus();
      return;
    }
    if (validation.error) {
      caption.focus();
      return;
    }

    const draft = current();
    if (editing === null && draft.events.length >= art.maxEvents) return;
    const id = editing ?? Math.max(0, ...draft.events.map(item => item.id)) + 1;
    const entry = {
      id, month: Number(month.value), theme: Number(theme.value),
      label: validation.label
    };
    draft.events = [...draft.events.filter(item => item.id !== id), entry];
    saveDraft();
    clearForm();
    renderEvents();
    renderResult();
  }

  function handleEventList(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const draft = current();
    const item = draft.events.find(entry => entry.id === Number(button.dataset.id));
    if (!item) return;

    if (button.dataset.action === "remove") {
      draft.events = draft.events.filter(entry => entry.id !== item.id);
      if (editing === item.id) clearForm();
      get("event-submit").disabled = false;
      saveDraft();
      renderEvents();
      renderResult();
      return;
    }

    editing = item.id;
    month.value = item.month;
    theme.value = item.theme ?? "";
    caption.value = item.label;
    errorNotice.hidden = true;
    month.removeAttribute("aria-invalid");
    theme.removeAttribute("aria-invalid");
    showCaptionLimit();
    get("event-title").textContent = locale().editEvent;
    get("event-submit").textContent = locale().save;
    get("event-submit").disabled = false;
    get("event-cancel").hidden = false;
    moveToEditor();
  }

  function imageName() {
    const type = language === "en"
      ? (side === "cover" ? "mystery" : "reveal-" + (page + 1))
      : (side === "cover" ? "zagadka" : "razgadka-" + (page + 1));
    const draft = current();
    const prefix = language === "en" ? "year-in-bloom-" : "god-v-tsvetah-";
    return prefix + draft.year + "-" + type + "-" + draft.appearance.format + ".png";
  }

  function downloadCard() {
    if (canvas.hidden) return;
    const name = imageName();
    canvas.toBlob(blob => {
      if (!blob) {
        status.textContent = locale().downloadError;
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  async function shareCard() {
    if (!shareImage) return;
    const file = new File([shareImage], imageName(), {type: "image/png"});
    try {
      await navigator.share({files: [file]});
    } catch (error) {
      if (error.name !== "AbortError") status.textContent = locale().shareError;
    }
  }

  document.querySelectorAll("[data-language]").forEach(button => {
    button.addEventListener("click", () => changeLanguage(button.dataset.language));
  });
  author.maxLength = art.maxAuthorLength;

  get("start").addEventListener("click", () => chooseMode("mine"));
  get("open-example").addEventListener("click", () => chooseMode("example"));
  get("use-mine").addEventListener("click", () => chooseMode("mine"));
  get("use-example").addEventListener("click", () => {
    chooseMode("example");
    if (matchMedia("(max-width: 760px)").matches) get("result").scrollIntoView();
  });
  get("view-cover").addEventListener("click", () => setSide("cover"));
  get("view-reveal").addEventListener("click", () => setSide("reveal"));
  form.addEventListener("submit", saveEvent);
  get("event-cancel").addEventListener("click", clearForm);
  list.addEventListener("click", handleEventList);
  caption.addEventListener("input", showCaptionLimit);
  author.addEventListener("input", () => {
    current().author = art.cleanAuthor(author.value);
    saveDraft();
    renderResult();
  });
  year.addEventListener("input", () => {
    const value = art.parseYear(year.value);
    year.setAttribute("aria-invalid", String(value === null));
    yearFeedback.hidden = value !== null;
    if (value === null || value === current().year) return;
    current().year = value;
    saveDraft();
    renderResult();
  });
  year.addEventListener("blur", () => {
    year.value = current().year;
    year.removeAttribute("aria-invalid");
    yearFeedback.hidden = true;
  });
  [
    [palette, "palette"],
    [format, "format"],
    [fontSize, "captionSize"],
    [flowerSize, "flowerSize"],
    [authorSize, "authorSize"]
  ].forEach(([control, key]) => {
    control.addEventListener(control.type === "range" ? "input" : "change", () => {
      current().appearance[key] = control.type === "range" ? control.valueAsNumber : control.value;
      renderRanges();
      renderResult();
      saveDraft();
    });
  });
  get("previous").addEventListener("click", () => {
    page -= 1;
    renderResult();
  });
  get("next").addEventListener("click", () => {
    page += 1;
    renderResult();
  });
  remix.addEventListener("click", () => {
    current().appearance.seed = crypto.getRandomValues(new Uint32Array(1))[0];
    saveDraft();
    renderResult();
    status.textContent = locale().remixed;
  });
  download.addEventListener("click", downloadCard);
  share.addEventListener("click", shareCard);
  translatePage();
  syncControls();
  clearForm();
  renderEvents();
  renderHero();
  renderResult();

  if (document.fonts) {
    Promise.allSettled([
      document.fonts.load('600 100px "Cormorant Garamond"', "0123456789"),
      document.fonts.load('600 24px "Cormorant Garamond"', art.exampleName),
      document.fonts.load('600 16px Manrope', "Подписи и легенда")
    ]).then(() => {
      showCaptionLimit();
      renderHero();
      renderResult();
    });
  }
})();
