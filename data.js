// 标准缸径规格（可出现的所有缸径值）
const BORE_STANDARD = [10, 12, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 140];
const GROUPS = [
  /* B02-ACQ：薄壁气缸 */
  {
    series: ["B02-ACQ"],
    boreMin: 32, boreMax: 100,
    old: {
      two:   ["AN-103-D", "AN-102-D"],
      auto:  ["AN-103-S-D", "AN-102-S-D"],
      npn:   ["AN-103-N-D", "AN-102-N-D"],
      pnp:   ["AN-103-P-D", "AN-102-P-D"],
    },
    new: {
      two:   ["AN-A6G-D"],
      auto:  ["AN-A6G-S-D"],
      npn:   ["AN-A6G-N-D"],
      pnp:   ["AN-A6G-P-D"],
    },
  },
  /* B02-TCM / B07-TCM：三轴气缸 */
  {
    series: ["B02-TCM/B07-TCM"],
    boreMin: 32, boreMax: 63,
    old: {
      two:   ["AN-103-D", "AN-102-D"],
      auto:  ["AN-103-S-D", "AN-102-S-D"],
      npn:   ["AN-103-N-D", "AN-102-N-D"],
      pnp:   ["AN-103-P-D", "AN-102-P-D"],
    },
    new: {
      two:   ["AN-A6G-D"],
      auto:  ["AN-A6G-S-D"],
      npn:   ["AN-A6G-N-D"],
      pnp:   ["AN-A6G-P-D"],
    },
  },
  /* QCK：回转夹紧气缸 */
  {
    series: ["QCK"],
    boreMin: 12, boreMax: 63,
    old: {
      two:   ["AN-103", "AN-102"],
      auto:  ["AN-103-S", "AN-102-S"],
      npn:   ["AN-103-N", "AN-102-N"],
      pnp:   ["AN-103-P", "AN-102-P"],
    },
    new: {
      two:   ["AN-A6G"],
      auto:  ["AN-A6G-S"],
      npn:   ["AN-A6G-N"],
      pnp:   ["AN-A6G-P"],
    },
  },
  {
    series: ["MCK"],
    boreMin: 40, boreMax: 80,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-103-S", "AN-102-S"],
      npn:   ["AN-103-N", "AN-102-N"],
      pnp:   ["AN-103-P", "AN-102-P"],
    },
    new: {
      two:   ["AN-A6G"],
      auto:  ["AN-A6G-S"],
      npn:   ["AN-A6G-N"],
      pnp:   ["AN-A6G-P"],
    },
    /* 安装附件：range=[min缸径,max缸径]，old/new为对应开关款式的附件型号，required=true表示必须选 */
    accessories: [{ range: [40, 80], old: "PG-8", new: "P8", required: true }],
  },
  /* B02-JSI：标准气缸 */
  {
    series: ["B02-JSI"],
    boreMin: 40, boreMax: 100,
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
  /* AQK：销钉气缸 */
  {
    series: ["AQK"],
    boreMin: 50, boreMax: 50,
    old: {
      two:   ["AN-102"],
      auto:  ["AN-102-S"],
      npn:   ["AN-102-N"],
      pnp:   ["AN-102-P"],
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
