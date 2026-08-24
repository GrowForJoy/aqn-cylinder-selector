// 标准缸径规格（可出现的所有缸径值）
const BORE_STANDARD = [10, 12, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 140];
const GROUPS = [
  {
    series: ["ACQ", "TCM", "TCL", "QCK"],
    boreMin: 25, boreMax: 80,
    old: {
      two:   ["AN-102-D"],
      auto:  ["AN-102S-D"],
      npn:   ["AN-102N-D"],
      pnp:   ["AN-102P-D"],
    },
    new: {
      two:   ["AN-A6G-D"],
      auto:  ["AN-A6G-S-D"],
      npn:   ["AN-A6G-N-D"],
      pnp:   ["AN-A6G-P-D"],
    },
  },
  {
    series: ["MCK"],
    boreMin: 32, boreMax: 80,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-102S"],
      npn:   ["AN-102N"],
      pnp:   ["AN-102P"],
    },
    new: {
      two:   ["AN-A6G-D"],
      auto:  ["AN-A6G-S-D"],
      npn:   ["AN-A6G-N-D"],
      pnp:   ["AN-A6G-P-D"],
    },
  },
  {
    series: ["AQK", "BAQK"],
    boreMin: 63, boreMax: 80,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-102S"],
      npn:   ["AN-102N"],
      pnp:   ["AN-102P"],
    },
    new: {
      two:   ["AN-A6G-D"],
      auto:  ["AN-A6G-S-D"],
      npn:   ["AN-A6G-N-D"],
      pnp:   ["AN-A6G-P-D"],
    },
  },
  {
    series: ["HLQ", "HLS"],
    boreMin: 20, boreMax: 32,
    old: {
      two:   ["AN-101"],
      auto:  ["AN-101S"],
      npn:   ["AN-101N"],
      pnp:   ["AN-101P"],
    },
    new: {
      two:   ["AN-A6H"],
      auto:  ["AN-A6H-S"],
      npn:   ["AN-A6H-N"],
      pnp:   ["AN-A6H-P"],
    },
  },
  {
    series: ["JSI", "SAI", "BE"],
    boreMin: 32, boreMax: 100,
    old: {
      two:   ["AN-105"],
      auto:  ["AN-105-S"],
      npn:   ["AN-105-N"],
      pnp:   ["AN-105-P"],
    },
    new: {
      two:   ["AN-A6E"],
      auto:  ["AN-A6E-S"],
      npn:   ["AN-A6E-N"],
      pnp:   ["AN-A6E-P"],
    },
  },
  {
    series: ["SC", "SCD", "SCJ"],
    boreMin: 32, boreMax: 100,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-102S"],
      npn:   ["AN-102N"],
      pnp:   ["AN-102P"],
    },
    new: {
      two:   ["AN-A6G"],
      auto:  ["AN-A6G-S"],
      npn:   ["AN-A6G-N"],
      pnp:   ["AN-A6G-P"],
    },
  },
  {
    series: ["BP"],
    boreMin: 10, boreMax: 40,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-102S"],
      npn:   ["AN-102N"],
      pnp:   ["AN-102P"],
    },
    new: {
      two:   ["AN-A6BG"],
      auto:  ["AN-A6BG-S"],
      npn:   ["AN-A6BG-N"],
      pnp:   ["AN-A6BG-P"],
    },
  },
  {
    series: ["TN"],
    boreMin: 10, boreMax: 40,
    old: {
      two:   ["AN-101"],
      auto:  ["AN-101S"],
      npn:   ["AN-101N"],
      pnp:   ["AN-101P"],
    },
    new: {
      two:   ["AN-A6H"],
      auto:  ["AN-A6H-S"],
      npn:   ["AN-A6H-N"],
      pnp:   ["AN-A6H-P"],
    },
  },
  {
    series: ["TR"],
    boreMin: 10, boreMax: 40,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-102S"],
      npn:   ["AN-102N"],
      pnp:   ["AN-102P"],
    },
    new: {
      two:   ["AN-A6G"],
      auto:  ["AN-A6G-S"],
      npn:   ["AN-A6G-N"],
      pnp:   ["AN-A6G-P"],
    },
  },
];

/* 出线方式 / 附件 的可选值 */
const OPTIONS = {
  wireMethod: ["M12QD-SE", "M12QD-SC", "直接出线"],
  accessories: ["无（仅开关）"],//附件，后期可加
};