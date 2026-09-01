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
  const btnNext = $("#btnNext");
  const footHint = $("#footHint");
  const resultPanel = $("#resultPanel");
  const modelOutput = $("#modelOutput");
  const resultGrid = $("#resultGrid");
  const btnCopy = $("#btnCopy");
  const btnRestart = $("#btnRestart");
  const btnStepBack = $("#btnStepBack");
  const wirePreview = $("#wirePreview");
  const wirePreviewImg = $("#wirePreviewImg");
  const wirePreviewName = $("#wirePreviewName");
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxClose = $("#lightboxClose");
  const result3dLink = $("#result3dLink");
  const result3dEmpty = $("#result3dEmpty");
  const previewMv = $("#previewMv");
  const result3dDl = $("#result3dDl");
  const selectorWrap = $("#selectorWrap");

  /* ---------- 工具 ---------- */
  const rangeBores = (g) => BORE_STANDARD.filter((b) => b >= g.boreMin && b <= g.boreMax);

  const track = (category, action, label, value) => {
    if (typeof _hmt !== "undefined" && typeof _hmt.push === "function") {
      try {
        _hmt.push(["_trackEvent", category, action, label, value]);
      } catch (e) { }
    }
  };

  const variantKey = () =>
    state.wiring === "two" ? "two"
      : (state.signal === "auto" ? "auto" : state.signal);

  const candidateModels = () => {
    if (!state.group || !state.generation || !state.wiring) return null;
    return state.group[state.generation][variantKey()] || null;
  };

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

  const SERIES_DESC = {
    TCM: "三轴气缸B07", TCL: "三轴气缸B07", QCK: "回转夹紧气缸B02",
    "ACQ/SDA": "薄壁气缸B02", MCK: "焊接夹紧气缸", AQK: "销钉气缸", BAQK: "抱紧型销钉气缸",
    HLQ: "双轴滑台气缸/气动手指", HLS: "双轴滑台气缸",
    JSI: "标准气缸", SAI: "标准气缸", "BE/BSE": "标准气缸",
    SC: "拉杆气缸", BSC: "拉杆气缸", SCJ: "拉杆气缸",
    BP: "笔型气缸", TN: "双轴气缸", TR: "双轴气缸",
  };

  /* 系列按钮显示名（可选，未配置时用系列名本身） */
  const SERIES_LABEL = {
    HLQ: "HLQ/HF",
  };

  const stepOptions = (key) => {
    switch (key) {
      case "series":
        return GROUPS.reduce((acc, g) => {
          g.series.forEach((snm) => acc.push({
            value: snm, label: SERIES_LABEL[snm] || snm, sub: SERIES_DESC[snm] || "标准气缸", group: g,
          }));
          return acc;
        }, []);
      case "bore":
        return rangeBores(state.group).map((b) => ({ value: b, sub: "mm" }));
      case "generation":
        return [
          { value: "old", label: "标准型", sub: "AN-1xx" },
          { value: "new", label: "增强型", sub: "AN-A6x" },
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
          { value: "normal", label: "标准", sub: "" },
          { value: "metal", label: "金属", sub: "型号带 J" },
        ];
      case "cable":
        return ["0.5","01", "02", "03", "05", "07"].map((m) => ({
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
      case "generation": return val === "old" ? "标准型" : "增强型";
      case "wiring":     return val === "two" ? "两线式" : "三线式";
      case "signal":     return val === "auto" ? "自动识别" : val.toUpperCase();
      case "wireMethod": return val === "direct" ? "直接出线"
        : (val === "M12QD-SE" ? "M12QD(SE)" : val === "M12QD-SC" ? "M12QD(SC)" : val);
      case "series":     return SERIES_LABEL[val] || val;
      default:           return val;
    }
  };

  /* ---------- 效果图（出线方式 / 接头材质） ---------- */
  const previewImgSrc = (step, value) => {
    if (step === "wireMethod") {
      const map = {
        "M12QD-SE": "Image/SE.png",
        "M12QD-SC": "Image/SC.png",
        "M12QD": "Image/qd-3wire.png",
      };
      return map[value] || "";
    }
    if (step === "metal") {
      const map = {
        "normal": "Image/connector-standard.jpg",
        "metal": "Image/connector-metal.jpg",
      };
      return map[value] || "";
    }
    if (step === "generation") {
      // 根据已选的接线方式 + 信号类型对应的具体型号显示预览图
      const g = state.group;
      const pool = g && (value === "old" ? g.old : g.new);
      if (!pool) return "";
      const vk = variantKey() || "two";
      const model = (pool[vk] && pool[vk][0])
        ? pool[vk][0]
        : (pool.two && pool.two[0]);
      if (!model) return "";
      if (value === "old") {
        const hasD = /-D$/.test(model);
        const m = model.replace(/-D$/, "").replace(/-[SNP]$/, "").replace(/(\d)(S|N|P)$/, "$1");
        const map = {
          "AN-101": "Image/101G.jpg",
          "AN-102": "Image/102G.jpg",
          "AN-105": "Image/105G.jpg",
        };
        if (!map[m]) return "";
        // 102 带 D（AN-102-D）显示带 D 的专属效果图
        if (hasD && m === "AN-102") return "Image/102G-D.jpg";
        return map[m];
      }
      // 三线信号后缀(S/N/P)不区分图片：AN-A6G-S → AN-A6G；AN-A6G-S-D → AN-A6G-D
      let base = model.replace(/-[SNP](?:-D)?$/, (m) => (m.endsWith("-D") ? "-D" : ""));
      if (base === "AN-A6BG") base = "AN-A6G"; // 无独立图片，借用相近的 A6G
      return `Image/${base}.jpg`;
    }
    return "";
  };
  const previewHtml = (step, value) => {
    const src = previewImgSrc(step, value);
    if (!src) return "";
    return `<img class="wire-preview__pic" src="${src}" alt="效果图，点击放大" title="点击放大查看" />`;
  };

  /* ---------- 灯箱放大 ---------- */
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
  if (lightbox) lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });
  if (previewMv) {
    previewMv.addEventListener("error", () => {
      result3dLink.hidden = true;
      result3dEmpty.hidden = false;
    });
  }

  const signalDisplay = () => {
    if (state.wiring === "two") return "无极性";
    return state.signal ? labelOf("signal", state.signal) : null;
  };

  const stepMeta = (key) => {
    const meta = {
      series:     ["01", "选择气缸系列", "请选择需要的气缸系列，不同系列对应不同的缸径范围与开关型号。"],
      bore:       ["02", "选择缸径", `当前缸径范围为 ${state.group ? state.group.boreMin : "-"} ~ ${state.group ? state.group.boreMax : "-"} mm，请选择实际需要的内径规格。`],
      wiring:     ["03", "选择接线方式", "接线方式分为两线式和三线式，三线式需进一步选择信号类型（自动识别 / NPN / PNP）。"],
      signal:     ["04", "选择信号类型", "三线式输出需确认选择那种类型，自动识别 S 型、 NPN 与 PNP。"],
      generation: ["05", "选择标准型 / 增强型", "标准型对应 AN-1xx 系列开关，增强型对应 AN-A6x 系列开关。"],
      model:      ["06", "选择开关型号", "请确认所需的实际开关型号。"],
      wireMethod: ["07", "选择出线方式", "请选择出线方式：M12QD 系列接头或直接出线,请慎重选择。"],
      cable:      ["08", "选择出线米数", "直接出线需选择线缆长度。"],
      metal:      ["08", "选择接头材质", "QD 接头请选择金属或标准材质。"],
      accessory:  ["09", "选择附件", "可选配安装附件"],
    };
    return meta[key] || ["--", key, ""];
  };

  /* ---------- 动态步骤 ---------- */
  const buildSteps = () => {
    const steps = ["series", "bore", "wiring"];
    if (state.wiring === "three") steps.push("signal");
    steps.push("generation");
    steps.push("wireMethod");
    if (state.wireMethod === "direct") steps.push("cable");
    else if (state.wireMethod) steps.push("metal");

    const accOpts = accessoryOptions().options;
    const onlyNone = accOpts.length === 1 && accOpts[0] === "无（仅开关）";
    if (!onlyNone) {
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
    const items = [];
    const push = (tag, val, step) => {
      if (val !== null && val !== undefined) items.push({ tag, val: String(val), step });
    };
    push("系列", state.seriesName, "series");
    push("缸径", state.bore != null ? `${state.bore}mm` : null, "bore");
    push("版本", state.generation ? labelOf("generation", state.generation) : null, "generation");
    push("接线", state.wiring ? labelOf("wiring", state.wiring) : null, "wiring");
    push("信号", signalDisplay(), "signal");

    push("出线", wireDisplay(), "wireMethod");
    push("附件", state.accessory, "accessory");

    const steps = buildSteps();
    pickedBar.innerHTML = "";
    items.forEach((it) => {
      const span = document.createElement("span");
      span.className = "chip" + (it.step && steps.indexOf(it.step) >= 0 ? " chip--jump" : "");
      span.innerHTML = `<span class="chip__tag">${it.tag}</span><b>${it.val}</b>`;
      if (it.step && steps.indexOf(it.step) >= 0) {
        span.title = "点击回到该步骤";
        span.addEventListener("click", () => gotoStep(steps.indexOf(it.step)));
      }
      pickedBar.appendChild(span);
    });
    pickedBar.classList.toggle("hidden", !items.length);
  }

  // 关闭结果区并恢复选型区，保证两者互斥，避免整页空白
  const closeResult = () => {
    resultPanel.hidden = true;
    selectorWrap.hidden = false;
  };

  const gotoStep = (stepIdx) => {
    const steps = buildSteps();
    if (stepIdx < 0 || stepIdx >= steps.length) return;
    const keep = new Set(steps.slice(0, stepIdx + 1));
    ["bore", "generation", "wiring", "signal", "model", "wireMethod", "metal", "cable", "accessory"]
      .forEach((k) => { if (!keep.has(k)) state[k] = null; });
    cursor = stepIdx;
    closeResult();
    renderProgress(steps[stepIdx]);
    renderPicked();
    renderStep(stepIdx);
  };

  function renderStep(idx) {
    const steps = buildSteps();
    const key = steps[idx];
    const [badge, title] = stepMeta(key);
    const options = stepOptions(key);
    const filled = isFilled(key);

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

    // 有效果图的步骤：wireMethod / metal / generation
    const previewSteps = ["wireMethod", "metal", "generation"];
    if (previewSteps.includes(key)) {
      const curVal = state[key];
      const src = previewImgSrc(key, curVal);
      const hasImg = !!src;
      const titleKey = key === "wireMethod" ? "出线方式效果图"
        : key === "metal" ? "接头材质效果图" : "开关型号效果图";
      // 预览区始终显示：未选择时显示占位提示
      wirePreview.classList.remove("hidden");
      wirePreview.querySelector(".wire-preview__title").textContent = titleKey;
      if (curVal && hasImg) {
        wirePreviewImg.innerHTML = previewHtml(key, curVal);
        const label = key === "wireMethod" ? labelOf("wireMethod", curVal)
          : key === "metal" ? (curVal === "metal" ? "金属接头" : "标准接头")
          : labelOf("generation", curVal);
        wirePreviewName.textContent = label + "（点击放大）";
        const pic = wirePreviewImg.querySelector(".wire-preview__pic");
        if (pic) pic.addEventListener("click", () => openLightbox(src));
      } else {
        wirePreviewImg.innerHTML = '<div class="wire-preview__ph">请选择后查看效果图</div>';
        wirePreviewName.innerHTML = "&nbsp;";
      }
      // 下一步按钮（wireMethod 步骤一定有；metal 一律显示「下一步」确认，
      // generation 若后面还有步骤则显示）
      const steps = buildSteps();
      const idxCur = steps.indexOf(key);
      const hasNext = key === "metal" || (idxCur >= 0 && idxCur < steps.length - 1);
      btnNext.classList.toggle("hidden", !curVal || !hasNext);
      const hintKey = key === "wireMethod" ? "出线方式"
        : key === "metal" ? "接头材质" : "标准型 / 增强型";
      footHint.textContent = curVal
        ? (hasNext ? "确认后点下一步" : "确认后查看结果")
        : `请选择${hintKey}`;
    } else {
      wirePreview.classList.add("hidden");
      btnNext.classList.add("hidden");
      footHint.textContent = "点选选项即进入下一步";
    }

    if (isLast && filled && key !== "metal") showResult();
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
    if (key === "metal") {
      // 标准/金属：只选中不前进，点「下一步」才完成选型
      renderProgress(key);
      renderStep(idx);
      closeResult();
    } else if (key === "wireMethod" || key === "generation") {
      if (isLast) {
        renderProgress(key);
        renderStep(idx);
        showResult();
      } else {
        renderProgress(key);
        renderStep(idx);
        closeResult();
      }
    } else if (isLast) {
      // 最后一步：选完即出结果
      renderProgress(key);
      renderStep(idx);
      showResult();
    } else {
      // 点选即自动前进到下一步
      cursor = idx + 1;
      renderProgress(steps[cursor]);
      renderStep(cursor);
      closeResult();
    }
  }

  /* ---------- 结果 ---------- */
  const wireDisplay = () => {
    if (!state.wireMethod) return null;
    if (state.wireMethod === "direct") return state.cable ? `直接出线 ${state.cable}m` : "直接出线";
    const qd = labelOf("wireMethod", state.wireMethod);
    return state.metal === "metal" ? `${qd} 金属 / 0.5m` : `${qd} 标准 / 0.5m`;
  };

  const normModel = (s) => (s || "").replace(/\s+/g, "").replace(/\/+$/, "");
  const modelBaseVariants = (s) => {
    const map = {
      "-0.5M(": "-0.5(", "-0.3M(": "-0.3(", "-0.5M)": "-0.5)",
      "-01M": "-010", "-02M": "-020", "-03M": "-030",
      "-05M": "-050", "-07M": "-070", "-0.5M": "-0.5",
    };
    const set = new Set([s]);
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 50 && set.size < 200) {
      changed = false;
      for (const cur of [...set]) {
        for (const [a, b] of Object.entries(map)) {
          if (cur.includes(a)) {
            const nxt = cur.replace(a, b);
            if (!set.has(nxt)) { set.add(nxt); changed = true; }
          }
        }
      }
    }
    return [...set];
  };
  const getCustomerOptions = (models, gen) => {
    const map = (typeof CUSTOMER_MAP !== "undefined" && CUSTOMER_MAP[gen]) || {};
    const collect = (vs) => {
      const o = [];
      for (const v of vs) (map[v] || []).forEach((c) => { if (c && o.indexOf(c) < 0) o.push(c); });
      return o;
    };
    for (const m of models || []) {
      const baseV = modelBaseVariants(normModel(m));
      const hit = collect(baseV);
      if (hit.length) return hit;
      const gv = [];
      for (const bv of baseV) {
        const g = bv.replace(/^AN-10(\d)(?!G)/, "AN-10$1G");
        if (g !== bv) gv.push(g);
      }
      const hitG = collect([...new Set(gv)]);
      if (hitG.length) return hitG;
    }
    return [];
  };

  let customerOpts = [];
  let customerIdx = 0;
  let lastR = null;
  const currentCustomer = () =>
    customerOpts.length ? (customerOpts[customerIdx] || customerOpts[0]) : "无对应客户型号";
  const customerSelect = $("#customerSelect");

  function renderResultGrid(r) {
    const rows = [
      ["气缸系列", state.seriesName || "—"],
      ["缸径", state.bore != null ? `${state.bore}mm` : "—"],
      ["版本", state.generation ? labelOf("generation", state.generation) : "—"],
      ["接线方式", state.wiring ? labelOf("wiring", state.wiring) : "—"],
      ["信号类型", signalDisplay() || "—"],
      ["开关型号", r.switchModel || "—"],
      ["出线方式", wireDisplay() || "—"],
      ["附件", state.accessory || "无（仅开关）"],
    ];
    if (r.counterpartOld) {
      rows.push(["对应标准型型号", r.counterpartOld.configuredCode]);
    }
    rows.push(["覆盖客户型号", currentCustomer()]);
    resultGrid.innerHTML = rows
      .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`)
      .join("");
  }

  function renderCustomerSelect() {
    if (!customerOpts.length || customerOpts.length === 1) {
      customerSelect.hidden = true;
      customerSelect.innerHTML = "";   // 无对应/仅一个时彻底清空，避免残留按钮
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

  function buildResult() {
    const cands = candidateModels();
    const base = cands && cands.length ? cands[0] : null;
    const acc = state.accessory;
    const accSuffix = acc && acc !== "无（仅开关）" ? `-${acc}` : "";

    const buildFull = (switchBase) => {
      if (!switchBase) return "—";
      if (state.wireMethod === "direct") {
        const t = state.cable ? `-${state.cable}M` : "";
        return `${switchBase}${t}${accSuffix}`;
      } else if (state.wireMethod) {
        const br = state.wiring !== "three"
          ? (state.wireMethod === "M12QD-SC" ? "(SC)" : "(SE)") : "";
        let qd = "-M12QD-0.5M";
        if (state.metal === "metal") qd += "-J";
        return `${switchBase}${qd}${br}${accSuffix}`;
      }
      return switchBase;
    };

    const buildSwitchCode = (switchBase) => {
      if (!switchBase) return null;
      if (state.wireMethod === "direct") {
        const t = state.cable ? `-${state.cable}M` : "";
        return `${switchBase}${t}`;
      } else if (state.wireMethod) {
        const br = state.wiring !== "three"
          ? (state.wireMethod === "M12QD-SC" ? "(SC)" : "(SE)") : "";
        let qd = "-M12QD-0.5M";
        if (state.metal === "metal") qd += "-J";
        return `${switchBase}${qd}${br}`;
      }
      return switchBase;
    };

    const full = buildFull(base);
    const switchTail = (() => {
      if (state.wireMethod === "direct") return state.cable ? `-${state.cable}M` : "";
      if (state.wireMethod) {
        const br = state.wiring !== "three"
          ? (state.wireMethod === "M12QD-SC" ? "(SC)" : "(SE)") : "";
        let qd = "-M12QD-0.5M";
        if (state.metal === "metal") qd += "-J";
        return `${qd}${br}`;
      }
      return "";
    })();

    // 对应标准型型号（仅当当前选增强型时）
    let counterpartOld = null;
    if (state.generation === "new" && state.group) {
      const oldCands = state.group.old[variantKey()] || [];
      const oldBase = oldCands.length ? oldCands[0] : null;
      if (oldBase) {
        counterpartOld = {
          switchModel: oldBase,
          configuredCode: buildFull(oldBase),
          switchCode: buildSwitchCode(oldBase),
        };
      }
    }

    return {
      switchModel: base,
      configuredCode: full,
      switchCode: base ? `${base}${switchTail}` : null,
      counterpartOld,
    };
  }

  const switchBase = (sm) => {
    if (!sm) return null;
    return sm
      .replace(/-D$/, "")             // 版本后缀 -D（如 AN-102-D）
      .replace(/-(S|N|P)$/, "")      // 连字符信号后缀 -S/-N/-P（如 AN-105-S）
      .replace(/(\d)(S|N|P)$/, "$1"); // 紧贴数字的信号后缀（如 AN-101S）
  };
  const find3D = (base) =>
    (typeof MODELS_3D !== "undefined" ? MODELS_3D : []).find((m) => m.base === base) || null;

  function render3D(switchModel) {
    const base = switchBase(switchModel);
    const acc = state.accessory;
    const accSuffix = acc && acc !== "无（仅开关）" ? `-${acc}` : "";
    let m = null;
    if (accSuffix) m = find3D(switchModel + accSuffix);
    if (!m && base) m = find3D(base);
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
    const r = buildResult();
    lastR = r;
    resultPanel.hidden = false;
    selectorWrap.hidden = true;   // 选型完成后隐藏选型区域
    modelOutput.textContent = r.configuredCode;
    track("选型", "完成", r.configuredCode);

    customerOpts = getCustomerOptions([r.switchCode].filter(Boolean), state.generation) || [];
    customerIdx = 0;
    renderResultGrid(r);
    renderCustomerSelect();
    render3D(r.switchModel);
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const copyText = () => {
    const r = buildResult();
    const customer = currentCustomer();
    const rows = [
      ["气缸系列", state.seriesName],
      ["缸径", state.bore != null ? `${state.bore}mm` : null],
      ["版本", state.generation ? labelOf("generation", state.generation) : null],
      ["接线方式", state.wiring ? labelOf("wiring", state.wiring) : null],
      ["信号类型", signalDisplay()],
      ["开关型号", r.switchModel],
      ["出线方式", wireDisplay()],
      ["附件", state.accessory || "无（仅开关）"],
      ["完整型号", r.configuredCode],
    ];
    if (r.counterpartOld) {
      rows.push(["对应标准型型号", r.counterpartOld.configuredCode]);
    }
    rows.push(["客户型号", customer]);
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
    customerOpts = [];
    customerIdx = 0;
    lastR = null;
    cursor = 0;
    closeResult();
    selectorWrap.hidden = false;  // 重新选型时重新显示选型区域
    renderProgress("series");
    renderPicked();
    renderStep(0);
  });

  /* ---------- 结果页“上一步”：回到选型流程最后一步，保留已选值 ---------- */
  btnStepBack.addEventListener("click", () => {
    track("按钮", "上一步(结果回退)");
    const s = buildSteps();
    const last = s[s.length - 1];
    // metal 步骤需点击「下一步」才完成，可直接回到它；其它点选即完成的步骤回到上一步。
    gotoStep(last === "metal" ? s.length - 1 : Math.max(0, s.length - 2));
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
    closeResult();
  });

  /* ---------- 下一步（通用：wireMethod / metal 等步骤） ---------- */
  btnNext.addEventListener("click", () => {
    track("按钮", "下一步");
    const steps = buildSteps();
    if (cursor >= steps.length - 1) {
      // 已是最后一步：仅标准/金属步骤在此确认提交结果
      if (steps[cursor] === "metal") showResult();
      return;
    }
    cursor++;
    renderProgress(steps[cursor]);
    renderStep(cursor);
    closeResult();
  });

  /* ---------- 初始化 ---------- */
  renderProgress("series");
  renderStep(0);
})();