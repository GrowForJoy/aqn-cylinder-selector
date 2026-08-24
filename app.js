(() => {
  "use strict";

  /* ---------- 状态 ---------- */
  const state = {
    group: null,       // 系列所在分组（GROUPS 元素）
    seriesName: null,  // 用户点选的具体系列
    bore: null,
    generation: null,  // 'old' | 'new'
    wiring: null,      // 'two' | 'three'
    signal: null,      // 'auto' | 'npn' | 'pnp'（三线式时）
    model: null,       // 存在多个候选型号时的明确选择
    wireMethod: null,  // 'QD' | 'nonQD'
    accessory: null,
  };

  /* ---------- DOM 引用 ---------- */
  const $ = (s) => document.querySelector(s);
  const stepTrack = $("#stepTrack");
  const pickedBar = $("#pickedBar");
  const stepBadge = $("#stepBadge");
  const stepTitle = $("#stepTitle");
  const stepDesc = $("#stepDesc");
  const optionsArea = $("#optionsArea");
  const seriesSearch = $("#seriesSearch");
  const seriesSearchInput = $("#seriesSearchInput");
  const btnBack = $("#btnBack");
  const resultPanel = $("#resultPanel");
  const modelOutput = $("#modelOutput");
  const resultGrid = $("#resultGrid");
  const btnCopy = $("#btnCopy");
  const btnRestart = $("#btnRestart");

  /* ---------- 工具 ---------- */
  const rangeBores = (g) => BORE_STANDARD.filter((b) => b >= g.boreMin && b <= g.boreMax);

  const variantKey = () =>
    state.wiring === "two" ? "two"
      : (state.signal === "auto" ? "auto" : state.signal);

  const candidateModels = () => {
    if (!state.group || !state.generation || !state.wiring) return null;
    return state.group[state.generation][variantKey()] || null;
  };

  /* 每个选项统一携带 .value；下拉步骤额外携带 .description */
  const stepOptions = (key) => {
    switch (key) {
      case "series":
        return GROUPS.reduce((acc, g) => {
          g.series.forEach((snm) => acc.push({
            value: snm, sub: `${g.boreMin}-${g.boreMax}`, group: g,
          }));
          return acc;
        }, []);
      case "bore":
        return rangeBores(state.group).map((b) => ({ value: b, sub: "mm" }));
      case "generation":
        return [
          { value: "old", label: "老款", sub: "AN-1xx" },
          { value: "new", label: "新款", sub: "AN-A6x" },
        ];
      case "wiring":
        return [
          { value: "two", label: "两线式", sub: "2-wire" },
          { value: "three", label: "三线式", sub: "3-wire" },
        ];
      case "signal":
        return [
          { value: "auto", label: "自动识别", sub: "S" },
          { value: "npn", label: "NPN", sub: "N" },
          { value: "pnp", label: "PNP", sub: "P" },
        ];
      case "model": {
        const cands = candidateModels();
        return cands.map((m) => ({ value: m, sub: "开关型号" }));
      }
      case "wireMethod":
        return [
          { value: "M12QD-SE", label: "M12QD-SE", sub: "带QD头" },
          { value: "M12QD-SC", label: "M12QD-SC", sub: "带QD头" },
          { value: "direct", label: "直接出线", sub: "不带QD头" },
        ];
      case "accessory":
        return OPTIONS.accessories.map((a, i) => ({ value: a, sub: i === 0 ? "默认" : "选配" }));
      default:
        return [];
    }
  };

  const labelOf = (key, val) => {
    switch (key) {
      case "generation": return val === "old" ? "老款" : "新款";
      case "wiring":     return val === "two" ? "两线式" : "三线式";
      case "signal":     return val === "auto" ? "自动识别" : val.toUpperCase();
      case "wireMethod": return val === "direct" ? "直接出线" : val;
      default:           return val;
    }
  };

  const stepMeta = (key) => {
    const meta = {
      series:     ["01", "选择气缸系列", "请选择需要的气缸系列，不同系列对应不同的缸径范围与开关型号。"],
      bore:       ["02", "选择缸径", `当前缸径范围为 ${state.group ? state.group.boreMin : "-"} ~ ${state.group ? state.group.boreMax : "-"} mm，请选择实际需要的内径规格。`],
      generation: ["03", "选择老款 / 新款", "老款对应 AN-1xx 系列开关，新款对应 AN-A6x 系列开关。"],
      wiring:     ["04", "选择接线方式", "接线方式分为两线式和三线式，三线式需进一步选择信号类型（自动识别 / NPN / PNP）。"],
      signal:     ["05", "选择信号类型", "三线式输出需确认选择那种类型，自动识别 S 型、 NPN 与 PNP。"],
      model:      ["06", "选择开关型号", "请确认所需的实际开关型号。"],
      wireMethod: ["07", "选择出线方式", "请选择出线方式：M12QD 系列接头或直接出线。"],
      accessory:  ["08", "选择附件", "可选配安装附件"],
    };
    return meta[key] || ["--", key, ""];
  };

  /* ---------- 动态步骤 ---------- */
  const buildSteps = () => {
    const steps = ["series", "bore", "generation", "wiring"];
    if (state.wiring === "three") steps.push("signal");
    const cands = candidateModels();
    if (cands && cands.length) steps.push("model");
    steps.push("wireMethod");
    steps.push("accessory");
    return steps;
  };

  const isFilled = (key) => !!state[key === "series" ? "seriesName" : key];

  const setValue = (key, val) => {
    if (key === "series") {
      state.group = val.group;
      state.seriesName = val.value;
      state.bore = null; state.generation = null; state.wiring = null;
      state.signal = null; state.model = null; state.wireMethod = null;
      state.accessory = null;
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
  };

  /* ---------- 渲染 ---------- */
  function renderProgress(currentKey) {
    stepTrack.innerHTML = "";
    buildSteps().forEach((k) => {
      const li = document.createElement("li");
      li.className = "steps__item " + (k === currentKey ? "is-active" : isFilled(k) ? "is-done" : "");
      const span = document.createElement("span");
      span.className = "steps__label";
      span.textContent = stepMeta(k)[1].replace("选择", "").replace(" / ", "/").replace("/", "/");
      li.appendChild(span);
      stepTrack.appendChild(li);
    });
  }

  function renderPicked() {
    const chips = [];
    const push = (tag, val) => val !== null && val !== undefined && chips.push(
      `<span class="chip"><span class="chip__tag">${tag}</span><b>${val}</b></span>`);
    push("系列", state.seriesName);
    push("缸径", state.bore != null ? `${state.bore}mm` : null);
    push("版本", state.generation ? labelOf("generation", state.generation) : null);
    push("接线", state.wiring ? labelOf("wiring", state.wiring) : null);
    push("信号", state.signal ? labelOf("signal", state.signal) : null);

    const cands = candidateModels();
    if (state.model) push("型号", state.model);
    else if (cands && cands.length === 1) push("型号", cands[0]);

    push("出线", state.wireMethod ? labelOf("wireMethod", state.wireMethod) : null);
    push("附件", state.accessory);

    pickedBar.innerHTML = chips.join("");
    pickedBar.classList.toggle("hidden", !chips.length);
  }

  function renderStep(idx) {
    const steps = buildSteps();
    const key = steps[idx];
    const [badge, title] = stepMeta(key);
    const options = stepOptions(key);
    const filled = isFilled(key);

    // 仅在“选择气缸系列”步骤显示系列搜索框
    seriesSearch.classList.toggle("hidden", key !== "series");
    if (key !== "series") seriesSearchInput.value = "";

    stepBadge.textContent = badge;
    stepTitle.textContent = title;
    stepDesc.textContent = stepMeta(key)[2];

    optionsArea.innerHTML = "";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option" + (isSelected(key, opt) ? " is-selected" : "");
      if (opt.flag) {
        const f = document.createElement("small");
        f.className = "opt--flag";
        f.textContent = opt.flag;
        btn.appendChild(f);
      }
      const lbl = document.createElement("span");
      lbl.textContent = opt.label || opt.value;
      btn.appendChild(lbl);
      if (opt.sub) {
        const sub = document.createElement("span");
        sub.className = "option__sub";
        sub.textContent = opt.sub;
        btn.appendChild(sub);
      }
      btn.addEventListener("click", () => selectOption(key, opt));
      optionsArea.appendChild(btn);
    });

    const isLast = idx === steps.length - 1;
    btnBack.classList.toggle("hidden", idx === 0);

    if (isLast && filled) showResult();
  }

  const isSelected = (key, opt) => {
    switch (key) {
      case "series":    return state.seriesName === opt.value;
      case "bore":      return state.bore === opt.value;
      default:          return state[key] === opt.value;
    }
  };

  function selectOption(key, opt) {
    setValue(key, key === "series" ? { ...opt } : opt.value);
    const steps = buildSteps();
    const idx = steps.indexOf(key);
    const isLast = idx === steps.length - 1;

    renderPicked();
    if (isLast) {
      // 最后一步：选完即出结果
      renderProgress(key);
      renderStep(idx);
      showResult();
    } else {
      // 点选即自动前进到下一步
      cursor = idx + 1;
      renderProgress(steps[cursor]);
      renderStep(cursor);
      resultPanel.hidden = true;
    }
  }

  /* ---------- 结果 ---------- */
  function buildResult() {
    const cands = candidateModels();
    const base = state.model || (cands && cands.length ? cands[0] : null);
    const suffix = state.wireMethod === "direct" ? "" : `-${labelOf("wireMethod", state.wireMethod)}`;
    const full = base ? `${base}${suffix}` : "—";
    return {
      switchModel: base,
      configuredCode: full,
    };
  }

  function showResult() {
    const r = buildResult();
    resultPanel.hidden = false;
    modelOutput.textContent = r.configuredCode;

    const rows = [
      ["气缸系列", state.seriesName || "—"],
      ["缸径", state.bore != null ? `${state.bore}mm` : "—"],
      ["版本", state.generation ? labelOf("generation", state.generation) : "—"],
      ["接线方式", state.wiring ? labelOf("wiring", state.wiring) : "—"],
      ["信号类型", state.signal ? labelOf("signal", state.signal) : "—"],
      ["开关型号", r.switchModel || "—"],
      ["出线方式", state.wireMethod ? labelOf("wireMethod", state.wireMethod) : "—"],
      ["附件", state.accessory || "—"],
    ];
    resultGrid.innerHTML = rows
      .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`)
      .join("");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const copyText = () => {
    const r = buildResult();
    const rows = [
      ["气缸系列", state.seriesName],
      ["缸径", state.bore != null ? `${state.bore}mm` : null],
      ["版本", state.generation ? labelOf("generation", state.generation) : null],
      ["接线方式", state.wiring ? labelOf("wiring", state.wiring) : null],
      ["信号类型", state.signal ? labelOf("signal", state.signal) : null],
      ["开关型号", r.switchModel],
      ["出线方式", state.wireMethod ? labelOf("wireMethod", state.wireMethod) : null],
      ["附件", state.accessory],
      ["完整编号", r.configuredCode],
    ];
    const line = (a, b) => `${a}：${b}`;
    return "【气缸开关型号选型结果】\n" + rows.filter(([, b]) => b !== null && b !== "" ).map(([a, b]) => line(a, b)).join("\n");
  };

  /* 系列搜索框过滤 */
  const filterSeries = () => {
    const kw = seriesSearchInput.value.trim().toLowerCase();
    optionsArea.querySelectorAll(".option").forEach((el) => {
      el.style.display = !kw || el.textContent.toLowerCase().includes(kw) ? "" : "none";
    });
  };
  seriesSearchInput.addEventListener("input", filterSeries);
  seriesSearchInput.addEventListener("search", filterSeries);

  btnCopy.addEventListener("click", async () => {
    const text = copyText();
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
    Object.keys(state).forEach((k) => (state[k] = null));
    cursor = 0;
    resultPanel.hidden = true;
    renderProgress("series");
    renderPicked();
    renderStep(0);
  });

  /* ---------- 上一步 ---------- */
  let cursor = 0;
  btnBack.addEventListener("click", () => {
    if (cursor === 0) return;
    const steps = buildSteps();
    setValue(steps[cursor], null);           // 清除当前步值
    cursor--;
    // 回退到仍存在的上一个步骤
    const clean = () => {
      const s = buildSteps();
      const idx = Math.min(cursor, s.length - 1);
      cursor = idx;
    };
    clean();
    const s = buildSteps();
    renderProgress(s[cursor]);
    renderStep(cursor);
    resultPanel.hidden = true;
  });

  /* ---------- 初始化 ---------- */
  renderProgress("series");
  renderStep(0);
})();