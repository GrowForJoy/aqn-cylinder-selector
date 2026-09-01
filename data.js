// 标准缸径规格（可出现的所有缸径值）
const BORE_STANDARD = [10, 12, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 140];
const GROUPS = [
  {
    series: ["ACQ/SDA", "TCM", "TCL", "QCK"],
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
      two:   ["AN-A6G"],
      auto:  ["AN-A6G-S"],
      npn:   ["AN-A6G-N"],
      pnp:   ["AN-A6G-P"],
    },
    /* 安装附件：range=[min缸径,max缸径]，old/new为对应开关款式的附件型号，required=true表示必须选 */
    accessories: [{ range: [32, 80], old: "PG-8", new: "P8", required: false }],
  },
  {
    series: ["AQK", "BAQK"],
    boreMin: 50, boreMax: 80,
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
    series: ["JSI", "SAI", "BE/BSE"],
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
    series: ["SC", "BSC", "SCJ"],
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
    /* 安装附件（贵重 SC/SCD/SCJ 共用）：32-50→PG-6，63→PG-8，80-100→PG-10 */
    accessories: [
      { range: [32, 50], old: "PG-6", new: "P6", required: false },
      { range: [63, 63], old: "PG-8", new: "P8", required: false },
      { range: [80, 100], old: "PG-10", new: "P10", required: false },
    ],
  },
  {
    series: ["PB"],
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
    /* 安装附件（BG 系列必须选）：按每个缸径一一对应 */
    accessories: [
      { range: [10, 10], old: "BG.S10", new: "S.10", required: true },
      { range: [12, 12], old: "BG.S12", new: "S.12", required: true },
      { range: [16, 16], old: "BG.S16", new: "S.16", required: true },
      { range: [20, 20], old: "BG.S20", new: "S.20", required: true },
      { range: [25, 25], old: "BG.S25", new: "S.25", required: true },
      { range: [32, 32], old: "BG.S32", new: "S.32", required: true },
      { range: [40, 40], old: "BG.S40", new: "S.40", required: true },
    ],
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
    /* 安装附件（TN 必须选）：整缸径区间统一用 AT11 */
    accessories: [{ range: [10, 40], old: "AT11", new: "AT11", required: true }],
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

/* 出线方式的可选值 */
const OPTIONS = {
  wireMethod: ["M12QD-SE", "M12QD-SC", "直接出线"],
};

/* 客户型号对照表：老款/新款型号 → 客户型号 */
const CUSTOMER_MAP = {
"old": {
"AN-101G-020": [
"AN-101G-020"
],
"AN-101G-030": [
"AN-101G-030"
],
"AN-101G-M12QD-0.5M(SE)": [
"AN-101G-M12QD-0.5M SE",
"AN-101G-M12QD-0.5M(SE)"
],
"AN-101S-M12QD-2M": [
"AN-101S-M12QD-2M"
],
"AN-102G-0.5": [
"AN-102-0.5"
],
"AN-102G-020": [
"AN-102G-020",
"AN-103G-020"
],
"AN-102G-030": [
"DS1-69AG-030"
],
"AN-102G-M12QD-0.5M(SE)": [
"DS1-69AG-M12QD-0.5SE",
"DS1-69AG-M12SE",
"DS1-69AG-SE",
"AN-103G-M12QD-0.5M SE",
"DS1-69AG-M12(SE)",
"AN-102G-M12QD-0.5M(SE)",
"AN-103G-M12QD-0.5M",
"DS1-69AG-C125E-M12",
"DS169AG-C125-M12",
"DS1-69AG-M12QD-0.5M(SE)",
"DS1-69AG-S-M12QD-0.5",
"DS1-69AG-M12QD-0.5(SE)",
"DS1-69AG-M12QD-0.5M"
],
"AN-102S-D-030": [
"AN-102S-D-030"
],
"AN-102S-D-M12QD-0.5M": [
"AN-103S-DM12QD-0.5M"
],
"AN-102S-M12QD-2M-J": [
"AN-102S-M12QD-2M-J"
],
"AN-103G-D-M12QD-0.5M-J(SE)": [
"AN-103G-D-M12QD-0.5M-J(SE)"
],
"AN-103G-M12QD-0.3M-J(SE)": [
"AN-103G-M12QD-0.3M-J(SE)"
],
"AN-103G-M12QD-0.5M(SE)-GP": [
"AN-103G-M12QD-0.5M(SE)"
],
"AN-103G-M12QD-030(SE)": [
"DS1-69AG-M12QD-3M"
],
"AN-103G-M12QDSC-0.5": [
"AN-103G-M12QD-0.5M SC",
"DS1-69AG-M12QD-0.5MSC",
"DS1-69AG-M12QD-0.5M(SC)"
],
"AN-103S-D-M12QD-0.5M-J": [
"AN103S-D-M12QD-0.5M-J"
],
"AN-103S-M12QD-0.5M": [
"DS1-69AG-C125E-M12-3P",
"AN-103S-M12QD-0.5M"
],
"AN-103S-M12QD-0.5M-J": [
"AN103S-M12QD-0.5M-J"
],
"AN-103S-M12QD-2M-J": [
"AN-103S-M12QD-2M-J"
],
"AN-105G-M12QD-0.5(SE)": [
"DS1-69AG-M12QD-SE-J",
"AN-105G-M12QD-0.5(SE)"
],
"AN-105S-M12QD-0.5M-J": [
"AN105S-M12QD-0.5-J"
],
"AN-105S-M12QD-2M-J": [
"AN-105S-M12QD-2M-J"
],
"DS1-69AG-040": [
"DS1-69AG-M12QD-M12"
],
"DS1-69AG-050": [
"DS1-69AG-050"
],
"DS1-69AG-D-030": [
"DS1-69AG-D-030"
],
"DS1-69AG-D-050": [
"DS1-69AG-D-050",
"DS169-AG-D-050"
],
"DS1-69AG-D-M12QD-0.5M(SC)": [
"DS1-69AG-D-SC12",
"DS1-69AG-D-M12QD-0.5M(SC)"
],
"DS1-69AG-D-M12QD-0.5M(SE)": [
"DS1-69AG-D-SE12",
"DS1-69AG-D-M12 SE",
"AN-103G-D-M12QD-0.5M(SE)",
"DS1-69AG-D-M12QD-0.5M",
"DS1-69AG-D-M12QD-0.5M(SE)",
"DS1-69AG-D-M12QD-05M(SE)"
],
"DS1-69AG-D2-M12QD-0.5M(SE)": [
"DS1-69AG-D2-05M"
]
},
"new": {
"AN-A6E-M12QD-0.5(SE)": [
"DS1-69AG-M12QD-SE-J"
],
"AN-A6E-S-M12QD-0.5M(SE)": [
"AN-105G-M12QD-0.5(SE)"
],
"AN-A6E-S-M12QD-0.5M-J": [
"AN105S-M12QD-0.5-J"
],
"AN-A6E-S-M12QD-2M-J": [
"AN-105S-M12QD-2M-J"
],
"AN-A6G-0.5": [
"AN-102-0.5"
],
"AN-A6G-020": [
"AN-102G-020",
"AN-103G-020"
],
"AN-A6G-030": [
"DS1-69AG-030"
],
"AN-A6G-040": [
"DS1-69AG-M12QD-M12"
],
"AN-A6G-050": [
"DS1-69AG-050"
],
"AN-A6G-D-030": [
"DS1-69AG-D-030"
],
"AN-A6G-D-050": [
"DS1-69AG-D-050",
"DS169-AG-D-050"
],
"AN-A6G-D-M12QD-0.5(SC)": [
"DS1-69AG-D-SC12",
"DS1-69AG-D-M12QD-0.5M(SC)"
],
"AN-A6G-D-M12QD-0.5(SE)": [
"DS1-69AG-D-SE12",
"DS1-69AG-D-M12 SE",
"DS1-69AG-D2-05M",
"AN-103G-D-M12QD-0.5M(SE)",
"DS1-69AG-D-M12QD-0.5M",
"DS1-69AG-D-M12QD-0.5M(SE)",
"DS1-69AG-D-M12QD-05M(SE)"
],
"AN-A6G-D-M12QD-0.5-J(SE)": [
"AN-103G-D-M12QD-0.5M-J(SE)"
],
"AN-A6G-M12QD-0.3M-J(SE)": [
"AN-103G-M12QD-0.3M-J(SE)"
],
"AN-A6G-M12QD-0.5M(SC)": [
"AN-103G-M12QD-0.5M SC",
"DS1-69AG-M12QD-0.5MSC",
"DS1-69AG-M12QD-0.5M(SC)"
],
"AN-A6G-M12QD-0.5M(SE)": [
"DS1-69AG-M12QD-0.5SE",
"DS1-69AG-M12SE",
"DS1-69AG-SE",
"AN-103G-M12QD-0.5M SE",
"DS1-69AG-M12(SE)",
"AN-102G-M12QD-0.5M(SE)",
"AN-103G-M12QD-0.5M",
"AN-103G-M12QD-0.5M(SE)",
"DS1-69AG-C125E-M12",
"DS169AG-C125-M12",
"DS1-69AG-M12QD-0.5M(SE)",
"DS1-69AG-M12QD-0.5(SE)",
"DS1-69AG-M12QD-0.5M"
],
"AN-A6G-M12QD-03(SE)": [
"DS1-69AG-M12QD-3M"
],
"AN-A6G-S-D-030": [
"AN-102S-D-030"
],
"AN-A6G-S-D-M12QD-0.5M(SE)": [
"AN-103S-DM12QD-0.5M"
],
"AN-A6G-S-D-M12QD-0.5M-J": [
"AN103S-D-M12QD-0.5M-J"
],
"AN-A6G-S-M12QD-0.5M": [
"DS1-69AG-C125E-M12-3P"
],
"AN-A6G-S-M12QD-0.5M(SE)": [
"DS1-69AG-S-M12QD-0.5",
"AN-103S-M12QD-0.5M"
],
"AN-A6G-S-M12QD-0.5M-J": [
"AN103S-M12QD-0.5M-J"
],
"AN-A6G-S-M12QD-2M-J": [
"AN-102S-M12QD-2M-J",
"AN-103S-M12QD-2M-J"
],
"AN-A6H-020": [
"AN-101G-020"
],
"AN-A6H-030": [
"AN-101G-030"
],
"AN-A6H-M12QD-0.5M(SE)": [
"AN-101G-M12QD-0.5M SE",
"AN-101G-M12QD-0.5M(SE)"
],
"AN-A6H-S-M12QD-0.5M(SE)": [
"AN-101S-M12QD-2M"
]
}
};
