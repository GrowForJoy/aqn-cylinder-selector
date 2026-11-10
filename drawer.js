/* 抽屉式选型页：把主站的分步向导改为“每步一个可展开抽屉”，选型规则复用 selector-core.js（与 app.js 一致） */
(() => {
  "use strict";

  const S = window.__selector;
  const $ = (s) => document.querySelector(s);

  /* ---------- 状态（与主站同构） ---------- */
  const state = {
    group: null, seriesName: null, bore: null, generation: null, wiring: null,
    signal: null, model: null, wireMethod: null, accessory: null, cable: null, metal: null,
  };

  let openKey = "series";   // 当前展开的抽屉；null 表示全部收起
  let customerOpts = [];
  let customerIdx = 0;
  let lastR = null;

  /* ---------- DOM ---------- */
  const drawerStack = $("#drawerStack");
  const pickedBar = $("#pickedBar");
  const selectorWrap = $("#selectorWrap");
  const resultPanel = $("#resultPanel");
  const modelOutput = $("#modelOutput");
  const resultGrid = $("#resultGrid");
  const customerSelect = $("#customerSelect");
  const btnCopy = $("#btnCopy");
  const btnRestart = $("#btnRestart");
  const btnStepBack = $("#btnStepBack");
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxClose = $("#lightboxClose");
  const result3dLink = $("#result3dLink");
  const result3dEmpty = $("#result3dEmpty");
  const previewMv = $("#previewMv");
  const result3dDl = $("#result3dDl");

  const PREVIEW_STEPS = ["wireMethod", "metal", "generation"];

  const track = (category, action, label, value) => {
    if (typeof _hmt !== "undefined" && typeof _hmt.push === "function") {
      try { _hmt.push(["_trackEvent", category, action, label, value]); } catch (e) { }
    }
  };

  /* ---------- 取值 ---------- */
  const setValue = (key, val) => {
    if (key === "series") {
      state.group = val.group;
      state.seriesName = val.value;
      state.bore = null; state.generation = null; state.wiring = null;
      state.signal = null; state.model = null; state.wireMethod = null;
      state.accessory = null; state.stroke = null;
      return;
    }
    if (val === null) {
      state[key] = null;
      if (key === "wiring") { state.signal = null; state.model = null; }
      if (key === "signal" || key === "generation") state.model = null;
      return;
    }
    state[key] = val;
    if (key === "generation") state.model = null;
    if (key === "wiring") { state.signal = null; state.model = null; }
    if (key === "signal") state.model = null;
    if (key === "wireMethod") { state.cable = null; state.metal = null; }
  };

  const isSelected = (key, opt) => {
    if (key === "series") return state.seriesName === opt.value;
    if (key === "bore") return state.bore === opt.value;
    return state[key] === opt.value;
  };

  const valueText = (key) => {
    switch (key) {
      case "series": return state.seriesName ? S.labelOf("series", state.seriesName) : "";
      case "bore": return state.bore != null ? `${state.bore} mm` : "";
      case "generation": return state.generation ? S.labelOf("generation", state.generation) : "";
      case "wiring": return state.wiring ? S.labelOf("wiring", state.wiring) : "";
      case "signal": return state.signal ? S.labelOf("signal", state.signal) : "";
      case "stroke": return state.stroke ? S.labelOf("stroke", state.stroke) : "";
      case "wireMethod": return state.wireMethod ? S.labelOf("wireMethod", state.wireMethod) : "";
      case "cable": return state.cable ? `${state.cable}m` : "";
      case "metal": return state.metal ? (state.metal === "metal" ? "金属" : "标准") : "";
      case "accessory": return state.accessory || "";
      default: return "";
    }
  };

  /* 清除 idx 之后所有步骤的取值（与主站“回到该步骤”一致） */
  const clearAfter = (idx, steps) => {
    const keep = new Set(steps.slice(0, idx + 1));
    ["bore", "generation", "wiring", "signal", "model", "wireMethod", "metal", "cable", "accessory", "stroke"]
      .forEach((k) => { if (!keep.has(k)) state[k] = null; });
  };

  const closeResult = () => {
    resultPanel.hidden = true;
    selectorWrap.hidden = false;
  };

  const openLightbox = (src) => {
    lightboxImg.src = src;
    lightbox.classList.remove("hidden");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    lightbox.classList.add("hidden");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && !lightbox.classList.contains("hidden")) closeLightbox();
  });
  if (previewMv) {
    previewMv.addEventListener("error", () => {
      result3dLink.hidden = true;
      result3dEmpty.hidden = false;
    });
  }

  /* ---------- 渲染：抽屉列表 ---------- */
  function render() {
    const steps = S.buildSteps(state);
    let firstUnfilled = steps.findIndex((k) => !S.isFilled(k, state));
    if (firstUnfilled === -1) firstUnfilled = steps.length;

    if (openKey !== null && steps.indexOf(openKey) < 0) openKey = null;

    drawerStack.innerHTML = "";
    steps.forEach((key, idx) => {
      const locked = idx > firstUnfilled;
      const open = key === openKey && !locked;
      drawerStack.appendChild(buildDrawer(key, idx, steps, locked, open));
    });
    renderPicked(steps);
  }

  function buildOption(key, opt) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option" + (isSelected(key, opt) ? " is-selected" : "");
    const lbl = document.createElement("span");
    lbl.textContent = opt.label || opt.value;
    btn.appendChild(lbl);
    if (opt.sub) {
      const sub = document.createElement("span");
      sub.className = "option__sub" + (opt.bold ? " option__sub--bold" : "");
      sub.textContent = opt.sub;
      btn.appendChild(sub);
    }
    btn.addEventListener("click", () => selectOption(key, opt));
    return btn;
  }

  function buildPreview(key) {
    const aside = document.createElement("aside");
    aside.className = "wire-preview";
    const titleEl = document.createElement("div");
    titleEl.className = "wire-preview__title";
    const img = document.createElement("div");
    img.className = "wire-preview__img";
    const name = document.createElement("div");
    name.className = "wire-preview__name";

    const curVal = state[key];
    const src = S.previewImgSrc(key, curVal, state);
    titleEl.textContent = key === "wireMethod" ? "出线方式效果图"
      : key === "metal" ? "接头材质效果图" : "开关型号效果图";

    if (curVal && src) {
      img.innerHTML = `<img class="wire-preview__pic" src="${src}" alt="效果图，点击放大" title="点击放大查看" />`;
      const label = key === "wireMethod" ? S.labelOf("wireMethod", curVal)
        : key === "metal" ? (curVal === "metal" ? "金属接头" : "标准接头")
          : S.labelOf("generation", curVal);
      name.textContent = label + "（点击放大）";
      const pic = img.querySelector(".wire-preview__pic");
      if (pic) pic.addEventListener("click", () => openLightbox(src));
    } else {
      img.innerHTML = '<div class="wire-preview__ph">请选择后查看效果图</div>';
      name.innerHTML = "&nbsp;";
    }
    aside.appendChild(titleEl);
    aside.appendChild(img);
    aside.appendChild(name);
    return aside;
  }

  function buildDrawer(key, idx, steps, locked, open) {
    const [badge, title, desc] = S.stepMeta(key, state);
    const filled = S.isFilled(key, state);

    const sec = document.createElement("section");
    sec.className = "card drawer" +
      (open ? " is-open" : "") + (locked ? " is-locked" : "") + (filled ? " is-done" : "");
    sec.dataset.key = key;

    const head = document.createElement("div");
    head.className = "drawer__head";
    head.setAttribute("role", "button");
    if (!locked) head.tabIndex = 0;
    head.setAttribute("aria-expanded", String(open));

    const num = document.createElement("span");
    num.className = "drawer__num";
    num.textContent = badge;

    const t = document.createElement("span");
    t.className = "drawer__title";
    t.textContent = title;

    const val = document.createElement("span");
    val.className = "drawer__value";
    val.textContent = filled ? valueText(key) : (locked ? "请先完成上一步" : "未选择");

    const chev = document.createElement("span");
    chev.className = "drawer__chev";
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "⌄";

    head.appendChild(num);
    head.appendChild(t);
    head.appendChild(val);
    head.appendChild(chev);

    if (filled && !open && !locked) head.title = "点击展开该步骤（将清除其后的选择）";

    const toggle = () => {
      if (locked) return;
      if (open) { openKey = null; render(); }
      else { gotoIdx(idx); }
    };
    head.addEventListener("click", toggle);
    if (!locked) {
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    }
    sec.appendChild(head);

    if (open) {
      const body = document.createElement("div");
      body.className = "drawer__body";

      const p = document.createElement("p");
      p.className = "drawer__desc";
      if (key === "accessory" && S.accessoryOptions(state).required) {
        p.textContent = "该系列需配套安装附件，请选择相应型号。";
      } else {
        p.textContent = desc;
      }
      body.appendChild(p);

      const cardBody = document.createElement("div");
      cardBody.className = "card__body";

      const options = document.createElement("div");
      options.className = "options";
      S.stepOptions(key, state).forEach((opt) => options.appendChild(buildOption(key, opt)));
      cardBody.appendChild(options);

      if (PREVIEW_STEPS.includes(key)) cardBody.appendChild(buildPreview(key));
      body.appendChild(cardBody);

      const foot = document.createElement("div");
      foot.className = "card__foot";
      const hint = document.createElement("span");
      hint.className = "foot__hint";
      const btns = document.createElement("div");
      btns.className = "foot__btns";
      const btnNext = document.createElement("button");
      btnNext.type = "button";
      btnNext.className = "btn btn--primary";
      btnNext.textContent = "下一步 →";

      const curVal = state[key];
      if (PREVIEW_STEPS.includes(key)) {
        const hasNext = key === "metal" || idx < steps.length - 1;
        btnNext.classList.toggle("hidden", !curVal || !hasNext);
        const hintKey = key === "wireMethod" ? "出线方式" : key === "metal" ? "接头材质" : "标准型 / 增强型";
        hint.textContent = curVal ? (hasNext ? "确认后点下一步" : "确认后查看结果") : `请选择${hintKey}`;
        btnNext.addEventListener("click", () => nextFrom(key));
      } else {
        hint.textContent = "点选选项即进入下一步";
      }
      btns.appendChild(btnNext);
      foot.appendChild(hint);
      foot.appendChild(btns);
      body.appendChild(foot);
      sec.appendChild(body);
    }

    return sec;
  }

  /* ---------- 已选参数标签 ---------- */
  function renderPicked(steps) {
    const items = [];
    const push = (tag, val, step) => {
      if (val !== null && val !== undefined) items.push({ tag, val: String(val), step });
    };
    push("系列", state.seriesName ? S.labelOf("series", state.seriesName) : null, "series");
    push("缸径", state.bore != null ? `${state.bore}mm` : null, "bore");
    push("版本", state.generation ? S.labelOf("generation", state.generation) : null, "generation");
    push("行程", S.strokeEnabled(state) && state.stroke ? S.labelOf("stroke", state.stroke) : null, "stroke");
    push("接线", state.wiring ? S.labelOf("wiring", state.wiring) : null, "wiring");
    push("信号", S.signalDisplay(state), "signal");
    push("出线", S.wireDisplay(state), "wireMethod");
    push("附件", state.accessory, "accessory");

    pickedBar.innerHTML = "";
    items.forEach((it) => {
      const span = document.createElement("span");
      span.className = "chip" + (it.step && steps.indexOf(it.step) >= 0 ? " chip--jump" : "");
      span.innerHTML = `<span class="chip__tag">${it.tag}</span><b>${it.val}</b>`;
      if (it.step && steps.indexOf(it.step) >= 0) {
        span.title = "点击回到该步骤";
        span.addEventListener("click", () => gotoIdx(steps.indexOf(it.step)));
      }
      pickedBar.appendChild(span);
    });
    pickedBar.classList.toggle("hidden", !items.length);
  }

  /* ---------- 交互 ---------- */
  function gotoIdx(idx) {
    const steps = S.buildSteps(state);
    if (idx < 0 || idx >= steps.length) return;
    clearAfter(idx, steps);
    openKey = steps[idx];
    closeResult();
    render();
  }

  function selectOption(key, opt) {
    setValue(key, key === "series" ? { ...opt } : opt.value);
    track("选型", "选择-" + key, opt.label || opt.value);
    const steps = S.buildSteps(state);
    const idx = steps.indexOf(key);
    const isLast = idx === steps.length - 1;

    if (key === "metal") { render(); return; }               // 需点「下一步」确认
    if (key === "wireMethod" || key === "generation") {      // 有效果图，选完点「下一步」
      if (isLast) { showResult(); return; }
      render();
      return;
    }
    if (isLast) { showResult(); return; }
    openKey = steps[idx + 1];                                // 选完自动展开下一步
    render();
  }

  function nextFrom(key) {
    const steps = S.buildSteps(state);
    const idx = steps.indexOf(key);
    if (idx === steps.length - 1) { showResult(); return; }
    openKey = steps[idx + 1];
    render();
  }

  /* ---------- 结果 ---------- */
  const currentCustomer = () =>
    customerOpts.length ? (customerOpts[customerIdx] || customerOpts[0]) : "无对应客户型号";

  function renderResultGrid(r) {
    const rows = [
      ["气缸系列", state.seriesName || "—"],
      ["缸径", state.bore != null ? `${state.bore}mm` : "—"],
      ["版本", state.generation ? S.labelOf("generation", state.generation) : "—"],
      ["接线方式", state.wiring ? S.labelOf("wiring", state.wiring) : "—"],
      ["信号类型", S.signalDisplay(state) || "—"],
      ["开关型号", r.switchModel || "—"],
      ["出线方式", S.wireDisplay(state) || "—"],
      ["附件", state.accessory || "无（仅开关）"],
    ];
    if (r.counterpartOld) rows.push(["对应标准型型号", r.counterpartOld.configuredCode]);
    rows.push(["覆盖客户型号", currentCustomer()]);
    resultGrid.innerHTML = rows.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("");
  }

  function renderCustomerSelect() {
    if (!customerOpts.length || customerOpts.length === 1) {
      customerSelect.hidden = true;
      customerSelect.innerHTML = "";
      return;
    }
    customerSelect.hidden = false;
    customerSelect.innerHTML = "";
    customerOpts.forEach((c, i) => {
      const bb = document.createElement("button");
      bb.type = "button";
      bb.className = "cust-opt" + (i === customerIdx ? " is-selected" : "");
      bb.textContent = c;
      bb.addEventListener("click", () => {
        customerIdx = i;
        track("客户型号", "切换", c);
        renderCustomerSelect();
        if (lastR) renderResultGrid(lastR);
      });
      customerSelect.appendChild(bb);
    });
  }

  const switchBase = (sm) => S.switchBase(sm);
  const find3D = (base) =>
    (typeof MODELS_3D !== "undefined" ? MODELS_3D : []).find((m) => m.base === base) || null;

  function render3D(switchModel) {
    const acc = state.accessory;
    const accSuffix = acc && acc !== "无（仅开关）" ? `-${acc}` : "";
    // 同组可能有多个可选型号，依次找有数模的那一个
    const list = [switchModel, ...(S.candidateModels(state) || [])].filter(Boolean);
    let m = null;
    for (const sm of list) {
      if (accSuffix) m = find3D(sm + accSuffix);
      if (!m) m = find3D(switchBase(sm));
      if (m) break;
    }
    if (m && previewMv) {
      result3dEmpty.hidden = true;
      result3dLink.hidden = false;
      result3dLink.href = "3d-viewer.html?m=" + encodeURIComponent(m.base) + "&single=1";
      previewMv.setAttribute("src", m.file);
      if (result3dDl) {
        result3dDl.hidden = false;
        result3dDl.href = m.stp;
        result3dDl.download = m.base + ".stp";
      }
    } else {
      result3dLink.hidden = true;
      result3dEmpty.hidden = false;
      if (previewMv) previewMv.removeAttribute("src");
      if (result3dDl) result3dDl.hidden = true;
    }
  }

  function showResult() {
    const r = S.buildResult(state);
    lastR = r;
    resultPanel.hidden = false;
    selectorWrap.hidden = true;
    modelOutput.textContent = r.configuredCode;
    track("选型", "完成", r.configuredCode);

    customerOpts = S.getCustomerOptions([r.switchCode].filter(Boolean), state.generation) || [];
    customerIdx = 0;
    renderResultGrid(r);
    renderCustomerSelect();
    render3D(r.switchModel);
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const copyText = () => {
    const r = S.buildResult(state);
    const rows = [
      ["气缸系列", state.seriesName],
      ["缸径", state.bore != null ? `${state.bore}mm` : null],
      ["版本", state.generation ? S.labelOf("generation", state.generation) : null],
      ["接线方式", state.wiring ? S.labelOf("wiring", state.wiring) : null],
      ["信号类型", S.signalDisplay(state)],
      ["开关型号", r.switchModel],
      ["出线方式", S.wireDisplay(state)],
      ["附件", state.accessory || "无（仅开关）"],
      ["完整型号", r.configuredCode],
    ];
    if (r.counterpartOld) rows.push(["对应标准型型号", r.counterpartOld.configuredCode]);
    rows.push(["客户型号", currentCustomer()]);
    const line = (a, b) => `${a}：${b}`;
    return "【抗强磁开关型号选型结果】\n" +
      rows.filter(([, b]) => b !== null && b !== "").map(([a, b]) => line(a, b)).join("\n");
  };

  btnCopy.addEventListener("click", async () => {
    const text = copyText();
    track("按钮", "复制完整型号", S.buildResult(state).configuredCode);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    btnCopy.textContent = "已复制 ✓";
    setTimeout(() => (btnCopy.textContent = "复制完整型号"), 1600);
  });

  btnRestart.addEventListener("click", () => {
    track("按钮", "重新选型");
    Object.keys(state).forEach((k) => (state[k] = null));
    customerOpts = [];
    customerIdx = 0;
    lastR = null;
    openKey = "series";
    closeResult();
    render();
  });

  /* 结果页“上一步”：回到最后一步（保留已选值） */
  btnStepBack.addEventListener("click", () => {
    track("按钮", "上一步(结果回退)");
    const steps = S.buildSteps(state);
    const last = steps[steps.length - 1];
    gotoIdx(last === "metal" ? steps.length - 1 : Math.max(0, steps.length - 2));
  });

  render();
})();
