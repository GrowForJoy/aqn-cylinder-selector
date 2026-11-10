/* 选型核心逻辑（纯计算，无 DOM 依赖）——抽屉式选型页复用主站选型规则，规则与 app.js 保持一致 */
(() => {
  "use strict";

  if (typeof GROUPS === "undefined" || typeof BORE_STANDARD === "undefined") {
    throw new Error("selector-core.js 需在 data.js 之后引入");
  }

  /* ---------- 常量 ---------- */
  const SERIES_DESC = {
    "B02-ACQ": "薄壁气缸", "B02-TCM/B07-TCM": "三轴气缸", QCK: "回转夹紧气缸",
    MCK: "焊接夹紧气缸", "B02-JSI": "标准气缸", AQK: "销钉气缸",
  };

  /* 需要“真实行程”步骤的系列（选 <15mm 时型号由 -D 变为 -D2） */
  const STROKE_SERIES = ["B02-ACQ", "B02-TCM/B07-TCM"];

  /* ---------- 基础取值 ---------- */
  const rangeBores = (g) => BORE_STANDARD.filter((b) => b >= g.boreMin && b <= g.boreMax);

  const variantKey = (state) =>
    state.wiring === "two" ? "two" : (state.signal === "auto" ? "auto" : state.signal);

  const candidateModels = (state) => {
    if (!state.group || !state.generation || !state.wiring) return null;
    return state.group[state.generation][variantKey(state)] || null;
  };

  const accessoryOptions = (state) => {
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

  const strokeEnabled = (state) =>
    !!state.seriesName && STROKE_SERIES.includes(state.seriesName) && !!state.generation;

  /* ---------- 选项 ---------- */
  const stepOptions = (key, state) => {
    switch (key) {
      case "series":
        return GROUPS.reduce((acc, g) => {
          g.series.forEach((snm) => acc.push({
            value: snm, label: snm, sub: SERIES_DESC[snm] || "标准气缸", group: g,
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
        return ["0.5", "01", "02", "03", "05", "07"].map((m) => ({
          value: m, label: m + "m", sub: "线缆长度",
        }));
      case "accessory": {
        const acc = accessoryOptions(state);
        return acc.options.map((a) => ({
          value: a,
          sub: a === "无（仅开关）" ? "默认" : "安装附件",
        }));
      }
      case "stroke":
        return [
          { value: "lt15", label: "小于15", sub: "行程<15mm / 型号为 D2", bold: true },
          { value: "gte15", label: "大于等于15", sub: "行程≥15mm / 型号保持 D", bold: true },
        ];
      default:
        return [];
    }
  };

  const labelOf = (key, val) => {
    switch (key) {
      case "generation": return val === "old" ? "标准型" : "增强型";
      case "wiring": return val === "two" ? "两线式" : "三线式";
      case "signal": return val === "auto" ? "自动识别" : String(val).toUpperCase();
      case "wireMethod": return val === "direct" ? "直接出线"
        : (val === "M12QD-SE" ? "M12QD(SE)" : val === "M12QD-SC" ? "M12QD(SC)" : val);
      case "series": return val;
      case "stroke": return val === "gte15" ? "大于等于15" : "小于15";
      default: return val;
    }
  };

  const signalDisplay = (state) => {
    if (state.wiring === "two") return "无极性";
    return state.signal ? labelOf("signal", state.signal) : null;
  };

  const wireDisplay = (state) => {
    if (!state.wireMethod) return null;
    if (state.wireMethod === "direct") return state.cable ? `直接出线 ${state.cable}m` : "直接出线";
    const qd = labelOf("wireMethod", state.wireMethod);
    return state.metal === "metal" ? `${qd} 金属 / 0.5m` : `${qd} 标准 / 0.5m`;
  };

  const stepMeta = (key, state) => {
    const meta = {
      series: ["01", "选择气缸系列", "B02-ACQ、B02-TCM、B07-TCM全系列统一配置带“D”\nQCK、MCK、B02-JSI、AQK全系列统一配置不带“D”"],
      bore: ["02", "选择缸径", `当前缸径范围为 ${state.group ? state.group.boreMin : "-"} ~ ${state.group ? state.group.boreMax : "-"} mm，请选择实际需要的内径规格。`],
      wiring: ["03", "选择接线方式", "接线方式分为两线式和三线式，三线式需进一步选择信号类型（自动识别 / NPN / PNP）。"],
      signal: ["04", "选择信号类型", "三线式输出需确认选择那种类型，自动识别 S 型、 NPN 与 PNP。"],
      generation: ["05", "选择标准型 / 增强型", "标准型对应 AN-1xx 系列开关，增强型对应 AN-A6x 系列开关。"],
      model: ["06", "选择开关型号", "请确认所需的实际开关型号。"],
      wireMethod: ["07", "选择出线方式", "M12QD 系列接头(默认0.5m),直接出线(可进一步选择多种长度),请慎重选择。"],
      cable: ["08", "选择出线米数", "直接出线需选择线缆长度。"],
      metal: ["08", "选择接头材质", "QD 接头请选择金属或标准材质。"],
      accessory: ["09", "选择附件", "可选配安装附件"],
      stroke: ["05B", "请选择气缸实际使用行程", "气缸实际使用行程小于15mm 型号为 D2；大于等于15mm 保持 D。"],
    };
    return meta[key] || ["--", key, ""];
  };

  /* ---------- 动态步骤 ---------- */
  const buildSteps = (state) => {
    const steps = ["series", "bore", "wiring"];
    if (state.wiring === "three") steps.push("signal");
    steps.push("generation");
    if (strokeEnabled(state)) steps.push("stroke");
    steps.push("wireMethod");
    if (state.wireMethod === "direct") steps.push("cable");
    else if (state.wireMethod) steps.push("metal");

    const accOpts = accessoryOptions(state).options;
    const onlyNone = accOpts.length === 1 && accOpts[0] === "无（仅开关）";
    if (!onlyNone) {
      steps.push("accessory");
    } else if (state.accessory === null) {
      state.accessory = "无（仅开关）";  // 无其他型号时默认无
    }
    return steps;
  };

  const isFilled = (key, state) => !!state[key === "series" ? "seriesName" : key];

  /* ---------- 效果图 ---------- */
  const previewImgSrc = (step, value, state) => {
    if (step === "wireMethod") {
      const map = {
        "M12QD-SE": "Image/SE.png",
        "M12QD-SC": "Image/SC.png",
        "M12QD": "Image/qd-3wire.png",
      };
      return map[value] || "";
    }
    if (step === "metal") {
      const map = { "normal": "Image/connector-standard.jpg", "metal": "Image/connector-metal.jpg" };
      return map[value] || "";
    }
    if (step === "generation") {
      const g = state.group;
      const pool = g && (value === "old" ? g.old : g.new);
      if (!pool) return "";
      const vk = variantKey(state) || "two";
      const model = (pool[vk] && pool[vk][0]) ? pool[vk][0] : (pool.two && pool.two[0]);
      if (!model) return "";
      if (value === "old") {
        const map = { "AN-101": "Image/101G.jpg", "AN-102": "Image/102G.jpg", "AN-105": "Image/105G.jpg" };
        // 同组可能有多个开关型号，取第一个有对应效果图的
        for (const md of (pool[vk] || pool.two || [])) {
          const hasD = /-(D2?)$/.test(md);
          const m = md.replace(/-(D2?)$/, "").replace(/-[SNP]$/, "").replace(/(\d)(S|N|P)$/, "$1");
          if (!map[m]) continue;
          return hasD && m === "AN-102" ? "Image/102G-D.jpg" : map[m];
        }
        return "";
      }
      let base = model.replace(/-(S|N|P)(?:-D2?)?$/, (m) => (m.includes("-D") ? "-D" : ""));
      if (base === "AN-A6BG") base = "AN-A6G";
      return `Image/${base}.jpg`;
    }
    return "";
  };

  /* ---------- 结果 ---------- */
  const applyStroke = (state, code) => {
    if (!strokeEnabled(state) || state.stroke !== "lt15" || !code) return code;
    return code.replace(/-(D2?)$/, "-D2");
  };

  const buildResult = (state) => {
    const cands = candidateModels(state);
    const base0 = cands && cands.length ? cands[0] : null;
    const base = applyStroke(state, base0);
    const acc = state.accessory;
    const accSuffix = acc && acc !== "无（仅开关）" ? `-${acc}` : "";

    const tailOf = () => {
      if (state.wireMethod === "direct") return state.cable ? `-${state.cable}M` : "";
      if (state.wireMethod) {
        const br = state.wiring !== "three"
          ? (state.wireMethod === "M12QD-SC" ? "(SC)" : "(SE)") : "";
        let qd = "-M12QD-0.5M";
        if (state.metal === "metal") qd += "-J";
        return `${qd}${br}`;
      }
      return "";
    };

    const buildFull = (switchBase) => (switchBase ? `${switchBase}${tailOf()}${accSuffix}` : "—");

    const full = buildFull(base);

    let counterpartOld = null;
    if (state.generation === "new" && state.group) {
      const oldCands = state.group.old[variantKey(state)] || [];
      const oldBase = applyStroke(state, oldCands.length ? oldCands[0] : null);
      if (oldBase) {
        counterpartOld = {
          switchModel: oldBase,
          configuredCode: buildFull(oldBase),
        };
      }
    }

    return {
      switchModel: base,
      configuredCode: full,
      switchCode: base ? `${base}${tailOf()}` : null,
      counterpartOld,
    };
  };

  const switchBase = (sm) => {
    if (!sm) return null;
    return sm
      .replace(/-(D2?)$/, "")            // 版本后缀 -D / -D2
      .replace(/-(S|N|P)$/, "")          // 连字符信号后缀 -S/-N/-P
      .replace(/(\d)(S|N|P)$/, "$1");    // 紧贴数字的信号后缀
  };

  /* ---------- 客户型号 ---------- */
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

  window.__selector = {
    SERIES_DESC, STROKE_SERIES,
    rangeBores, variantKey, candidateModels, accessoryOptions, strokeEnabled,
    stepOptions, labelOf, signalDisplay, wireDisplay, stepMeta,
    buildSteps, isFilled, previewImgSrc,
    buildResult, switchBase,
    getCustomerOptions,
  };
})();
