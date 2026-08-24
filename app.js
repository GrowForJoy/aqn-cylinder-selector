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
    cable: null,       // 直接出线的米数：'01'|'02'|'03'|'05'|'07'
    metal: null,       // QD 接头材质：'metal' | 'normal'
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

  /* 百度统计事件埋点：category 类别 / action 动作 / label 标签 / value 数值 */
  const track = (category, action, label, value) => {
    if (typeof _hmt !== "undefined" && typeof _hmt.push === "function") {
      try {
        _hmt.push(["_trackEvent", category, action, label, value]);
      } catch (e) { /* 埋点失败不影响页面 */ }
    }
  };

  const variantKey = () =>
    state.wiring === "two" ? "two"
      : (state.signal === "auto" ? "auto" : state.signal);

  const candidateModels = () => {
    if (!state.group || !state.generation || !state.wiring) return null;
    return state.group[state.generation][variantKey()] || null;
  };

  /* 根据当前 系列×缸径 计算可选安装附件（含选配/必选标记） */
  const accessoryOptions = () => {
    const g = state.group;
    if (!g || !(g.accessories && g.accessories.length) || state.bore == null) {
      return { options: ["无（仅开关）"], required: false, hasAccessory: false };
    }
    const matched = g.accessories.filter(
      (r) => state.bore >= r.range[0] && state.bore <= r.range[1]
    );
    if (!matched.length) return { options: ["无（仅开关）"], required: false, hasAccessory: false };
    const required = matched.some((r) => r.required);
    const models = Array.from(new Set(
      matched.map((r) => (state.generation === "old" ? r.old : r.new))
    )).filter(Boolean);
    const options = required ? models : ["无（仅开关）", ...models];
    return { options, required, hasAccessory: true };
  };

  /* 每个选项统一携带 .value；下拉步骤额外携带 .description */
  /* 气缸系列 → 气缸类型描述 */
  const SERIES_DESC = {
    TCM: "三轴气缸", TCL: "三轴气缸", QCK: "回转夹紧气缸",
    MCK: "焊接夹紧气缸", AQK: "销钉气缸", BAQK: "抱紧到销钉气缸",
    HLQ: "双轴滑气缸", HLS: "双轴滑气缸",
    JSI: "标准气缸", SAI: "标准气缸", "BE/BSE": "标准气缸",
    SC: "拉杆气缸", BSC: "拉杆气缸", SCJ: "拉杆气缸",
    BP: "笔型气缸", TN: "双轴气缸", TR: "双轴气缸",
  };

  const stepOptions = (key) => {
    switch (key) {
      case "series":
        return GROUPS.reduce((acc, g) => {
          g.series.forEach((snm) => acc.push({
            value: snm, sub: SERIES_DESC[snm] || "标准气缸", group: g,
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
        return state.wiring === "three"
          ? [
              { value: "M12QD", label: "M12QD", sub: "带QD头" },
              { value: "direct", label: "直接出线", sub: "不带QD头" },
            ]
          : [
              { value: "M12QD-SE", label: "M12QD(SE)", sub: "带QD头" },
              { value: "M12QD-SC", label: "M12QD(SC)", sub: "带QD头" },
              { value: "direct", label: "直接出线", sub: "不带QD头" },
            ];
      case "metal":
        return [
          { value: "metal", label: "金属", sub: "型号带 J" },
          { value: "normal", label: "普通", sub: "型号不带 J" },
        ];
      case "cable":
        return ["01", "02", "03", "05", "07"].map((m) => ({
          value: m, label: m + "m", sub: "线缆长度",
        }));
      case "accessory": {
        const acc = accessoryOptions();
        return acc.options.map((a) => ({
          value: a,
          sub: a === "无（仅开关）" ? "默认" : "安装附件",
        }));
      }
      default:
        return [];
    }
  };

  const labelOf = (key, val) => {
    switch (key) {
      case "generation": return val === "old" ? "老款" : "新款";
      case "wiring":     return val === "two" ? "两线式" : "三线式";
      case "signal":     return val === "auto" ? "自动识别" : val.toUpperCase();
      case "wireMethod": return val === "direct" ? "直接出线"
        : (val === "M12QD-SE" ? "M12QD(SE)" : val === "M12QD-SC" ? "M12QD(SC)" : val);
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
      cable:      ["08", "选择出线米数", "直接出线需选择线缆长度。"],
      metal:      ["08", "选择接头材质", "QD 接头请选择金属或普通材质。"],
      accessory:  ["09", "选择附件", "可选配安装附件"],
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
    if (state.wireMethod === "direct") steps.push("cable");
    else if (state.wireMethod) steps.push("metal");

    /* 附件步骤：仅当存在实际附件（选配或必选）才需用户选择；
       没有其他型号时默认"无"并跳过该步骤 */
    const accOpts = accessoryOptions().options;
    const onlyNone = accOpts.length === 1 && accOpts[0] === "无（仅开关）";
    if (!onlyNone) {
      state.accessory = null;   // 存在可选附件时强制点选
      steps.push("accessory");
    } else if (state.accessory === null) {
      state.accessory = "无（仅开关）";  // 无其他型号时默认无
    }
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
    if (key === "wireMethod") { state.cable = null; state.metal = null; }
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

    push("出线", wireDisplay());
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
    if (key === "accessory" && accessoryOptions().required) {
      stepDesc.textContent = "该系列需配套安装附件，请选择相应型号。";
    } else {
      stepDesc.textContent = stepMeta(key)[2];
    }

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
    track("选型", "选择-" + key, opt.label || opt.value);
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
  /* 出线方式（含材质/线长）的显示文本 */
  const wireDisplay = () => {
    if (!state.wireMethod) return null;
    if (state.wireMethod === "direct") return state.cable ? `直接出线 ${state.cable}m` : "直接出线";
    const qd = labelOf("wireMethod", state.wireMethod);
    return state.metal === "metal" ? `${qd} 金属 / 0.5m` : `${qd} 普通 / 0.5m`;
  };

  /* 客户型号查找：老款/新款 → 客户型号，带几个常见写法变体兜底 */
  const normModel = (s) => (s || "").replace(/\s+/g, "").replace(/\/+$/, "");
  const modelVariants = (s) => {
    const list = [s];
    [["-0.5M(", "-0.5("], ["-0.3M(", "-0.3("], ["-0.5M)", "-0.5)"]].forEach(([a, b]) => {
      if (s.includes(a)) list.push(s.replace(a, b));
    });
    return list;
  };
  const lookupCustomer = (models, gen) => {
    const map = (typeof CUSTOMER_MAP !== "undefined" && CUSTOMER_MAP[gen]) || {};
    for (const m of models || []) {
      for (const v of modelVariants(normModel(m))) {
        if (map[v]) return map[v];
      }
    }
    return null;
  };

  function buildResult() {
    const cands = candidateModels();
    const base = state.model || (cands && cands.length ? cands[0] : null);
    /* 出线相关段放到型号最末尾：QD {0.5M + QD标识 + 金属J} / 直接出线 {所选米数} */
    let tail = "";
    if (state.wireMethod === "direct") {
      tail = state.cable ? `-${state.cable}M` : "";
    } else if (state.wireMethod) {
      /* QD 出线段：M12QD + 0.5M + (金属J) + (SE)/(SC) 恒在末尾；三线式无括号 */
      let tb = "-M12QD-0.5M";
      if (state.metal === "metal") tb += "-J";
      if (state.wiring !== "three") tb += state.wireMethod === "M12QD-SC" ? "(SC)" : "(SE)";
      tail = tb;
    }
    const acc = state.accessory;
    const accSuffix = acc && acc !== "无（仅开关）" ? `-${acc}` : "";
    const full = base ? `${base}${accSuffix}${tail}` : "—";
    return {
      switchModel: base,
      configuredCode: full,
      /* 去掉附件段的开关型号，便于对照客户型号字典 */
      switchCode: base ? `${base}${tail}` : null,
    };
  }

  function showResult() {
    const r = buildResult();
    resultPanel.hidden = false;
    modelOutput.textContent = r.configuredCode;
    track("选型", "完成", r.configuredCode);
    const customer = lookupCustomer([r.configuredCode, r.switchCode], state.generation)
      || "无对应客户型号";

    const rows = [
      ["气缸系列", state.seriesName || "—"],
      ["缸径", state.bore != null ? `${state.bore}mm` : "—"],
      ["版本", state.generation ? labelOf("generation", state.generation) : "—"],
      ["接线方式", state.wiring ? labelOf("wiring", state.wiring) : "—"],
      ["信号类型", state.signal ? labelOf("signal", state.signal) : "—"],
      ["开关型号", r.switchModel || "—"],
      ["出线方式", wireDisplay() || "—"],
      ["附件", state.accessory || "无（仅开关）"],
      ["客户型号", customer],
    ];
    resultGrid.innerHTML = rows
      .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`)
      .join("");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const copyText = () => {
    const r = buildResult();
    const customer = lookupCustomer([r.configuredCode, r.switchCode], state.generation)
      || "无对应客户型号";
    const rows = [
      ["气缸系列", state.seriesName],
      ["缸径", state.bore != null ? `${state.bore}mm` : null],
      ["版本", state.generation ? labelOf("generation", state.generation) : null],
      ["接线方式", state.wiring ? labelOf("wiring", state.wiring) : null],
      ["信号类型", state.signal ? labelOf("signal", state.signal) : null],
      ["开关型号", r.switchModel],
      ["出线方式", wireDisplay()],
      ["附件", state.accessory || "无（仅开关）"],
      ["客户型号", customer],
      ["完整型号", r.configuredCode],
    ];
    const line = (a, b) => `${a}：${b}`;
    return "【抗强磁开关型号选型结果】\n" + rows.filter(([, b]) => b !== null && b !== "" ).map(([a, b]) => line(a, b)).join("\n");
  };

  /* 系列搜索框过滤 */
  const filterSeries = () => {
    const kw = seriesSearchInput.value.trim().toLowerCase();
    optionsArea.querySelectorAll(".option").forEach((el) => {
      el.style.display = !kw || el.textContent.toLowerCase().includes(kw) ? "" : "none";
    });
  };
  seriesSearchInput.addEventListener("input", filterSeries);
  seriesSearchInput.addEventListener("search", () => track("搜索", "系列搜索", seriesSearchInput.value.trim()));

  btnCopy.addEventListener("click", async () => {
    const text = copyText();
    track("按钮", "复制完整型号", buildResult().configuredCode);
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
    track("按钮", "上一步");
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