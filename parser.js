(() => {
  "use strict";

  /* ---------- 收集所有已知开关型号前缀（按长度降序，优先长匹配） ---------- */
  const baseRegistry = [];
  if (typeof GROUPS !== "undefined") {
    GROUPS.forEach((g) => {
      ["old", "new"].forEach((gen) => {
        ["two", "auto", "npn", "pnp"].forEach((variant) => {
          (g[gen][variant] || []).forEach((m) => {
            if (!baseRegistry.find((b) => b.model === m)) {
              baseRegistry.push({ model: m, group: g, gen, variant });
            }
          });
        });
      });
    });
  }
  baseRegistry.sort((a, b) => b.model.length - a.model.length);

  const SERIES_DESC = {
    TCM: "三轴气缸", TCL: "三轴气缸", QCK: "回转夹紧气缸",
    "ACQ/SDA": "薄壁气缸", MCK: "焊接夹紧气缸", AQK: "销钉气缸", BAQK: "抱紧型销钉气缸",
    HLQ: "双轴滑台气缸", HLS: "双轴滑台气缸",
    JSI: "标准气缸", SAI: "标准气缸", "BE/BSE": "标准气缸",
    SC: "拉杆气缸", BSC: "拉杆气缸", SCJ: "拉杆气缸",
    PB: "笔型气缸", TN: "双轴气缸", TR: "双轴气缸",
  };

  /* ---------- 客户型号查找（复用 app.js 逻辑） ---------- */
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

  const getCustomerOptions = (switchCode, gen) => {
    const map = (typeof CUSTOMER_MAP !== "undefined" && CUSTOMER_MAP[gen]) || {};
    const collect = (vs) => {
      const o = [];
      for (const v of vs) (map[v] || []).forEach((c) => { if (c && o.indexOf(c) < 0) o.push(c); });
      return o;
    };
    if (!switchCode) return [];
    const baseV = modelBaseVariants(normModel(switchCode));
    const hit = collect(baseV);
    if (hit.length) return hit;
    const gv = [];
    for (const bv of baseV) {
      const g = bv.replace(/^AN-10(\d)(?!G)/, "AN-10$1G");
      if (g !== bv) gv.push(g);
    }
    return collect([...new Set(gv)]);
  };

  /* ---------- 客户型号反查（客户型号 → 我们型号） ---------- */
  const CUSTOMER_INDEX = (() => {
    const idx = {};
    if (typeof CUSTOMER_MAP !== "undefined") {
      Object.keys(CUSTOMER_MAP).forEach((gen) => {
        const map = CUSTOMER_MAP[gen];
        Object.keys(map).forEach((our) => {
          (map[our] || []).forEach((c) => {
            const norm = normModel(c);
            if (!norm) return;
            if (!idx[norm]) idx[norm] = [];
            const rec = { our, gen };
            if (!idx[norm].find((x) => x.our === our && x.gen === gen)) idx[norm].push(rec);
          });
        });
      });
    }
    return idx;
  })();
  const findOurByCustomer = (input) => {
    const norm = normModel(input || "");
    return (norm && CUSTOMER_INDEX[norm]) ? CUSTOMER_INDEX[norm].slice() : [];
  };

  /* ---------- 核心解析 ---------- */
  function parseModel(input) {
    const s = (input || "").replace(/\s+/g, "");
    if (!s) return { error: "请输入完整型号" };

    // 匹配开关型号前缀（长优先）
    let matched = null;
    let remaining = "";
    for (const b of baseRegistry) {
      if (s.startsWith(b.model)) {
        matched = b;
        remaining = s.slice(b.model.length);
        break;
      }
    }
    if (!matched) {
      return { error: "无法识别开关型号前缀，请检查输入是否正确" };
    }

    const result = {
      switchModel: matched.model,
      generation: matched.gen,
      wiring: matched.variant === "two" ? "two" : "three",
      signal: matched.variant === "two" ? null : matched.variant,
      series: matched.group.series,
      boreMin: matched.group.boreMin,
      boreMax: matched.group.boreMax,
      wireMethod: null,
      cable: null,
      metal: null,
      accessory: null,
      fullModel: s,
      switchCode: null,
    };

    // 解析出线后缀
    if (remaining.startsWith("-M12QD-")) {
      remaining = remaining.slice(7);
      const cableMatch = remaining.match(/^(\d+\.?\d*)M/);
      if (cableMatch) {
        result.cable = cableMatch[1];
        remaining = remaining.slice(cableMatch[0].length);
      }
      if (remaining.startsWith("-J")) {
        result.metal = "metal";
        remaining = remaining.slice(2);
      } else {
        result.metal = "normal";
      }
      if (remaining.startsWith("(SE)")) {
        result.wireMethod = "M12QD-SE";
        remaining = remaining.slice(4);
      } else if (remaining.startsWith("(SC)")) {
        result.wireMethod = "M12QD-SC";
        remaining = remaining.slice(4);
      } else {
        result.wireMethod = "M12QD";
      }
    } else if (remaining.startsWith("-")) {
      result.wireMethod = "direct";
      const cableMatch = remaining.match(/^-(\d+\.?\d*)M/);
      if (cableMatch) {
        result.cable = cableMatch[1];
        remaining = remaining.slice(cableMatch[0].length);
      }
    }

    // 附件
    if (remaining.startsWith("-")) {
      result.accessory = remaining.slice(1);
    } else if (remaining) {
      result.accessory = remaining;
    } else {
      result.accessory = "无（仅开关）";
    }

    // 构建 switchCode（用于客户型号查找）
    let sc = matched.model;
    if (result.wireMethod === "direct" && result.cable) {
      sc += `-${result.cable}M`;
    } else if (result.wireMethod && result.wireMethod.startsWith("M12QD")) {
      sc += `-M12QD-${result.cable || "0.5"}M`;
      if (result.metal === "metal") sc += "-J";
      if (result.wireMethod === "M12QD-SE") sc += "(SE)";
      else if (result.wireMethod === "M12QD-SC") sc += "(SC)";
    }
    result.switchCode = sc;
    result.customerModels = getCustomerOptions(sc, result.generation);

    return result;
  }

  /* ---------- 显示标签 ---------- */
  const genLabel = (g) => (g === "old" ? "标准型 (AN-1xx)" : "增强型 (AN-A6x)");
  const wiringLabel = (w) => (w === "two" ? "两线式" : "三线式");
  const signalLabel = (r) => {
    if (r.wiring === "two") return "无极性";
    if (r.signal === "auto") return "自动识别 (S)";
    if (r.signal === "npn") return "NPN";
    if (r.signal === "pnp") return "PNP";
    return "—";
  };
  const wireMethodLabel = (r) => {
    if (!r.wireMethod) return "—";
    if (r.wireMethod === "direct") return `直接出线 ${r.cable || "?"}m`;
    if (r.wireMethod === "M12QD-SE") return `M12QD(SE) ${r.cable || "0.5"}m`;
    if (r.wireMethod === "M12QD-SC") return `M12QD(SC) ${r.cable || "0.5"}m`;
    return `M12QD ${r.cable || "0.5"}m`;
  };
  const metalLabel = (r) => {
    if (!r.wireMethod || r.wireMethod === "direct") return "—";
    return r.metal === "metal" ? "金属 (J)" : "标准";
  };
  const seriesLabel = (r) =>
    (r.series || []).map((s) => `${s}（${SERIES_DESC[s] || "标准气缸"}）`).join("、");

  const boreListLabel = (r) => {
    if (typeof BORE_STANDARD === "undefined") return r.boreMin + " ~ " + r.boreMax + " mm";
    const list = BORE_STANDARD.filter((b) => b >= r.boreMin && b <= r.boreMax);
    return list.length ? list.join("、") + " mm" : r.boreMin + " ~ " + r.boreMax + " mm";
  };

  window.__parseModel = parseModel;
  window.__findOurByCustomer = findOurByCustomer;
  window.__parseLabels = {
    genLabel, wiringLabel, signalLabel, wireMethodLabel, metalLabel, seriesLabel, boreListLabel,
  };
})();
