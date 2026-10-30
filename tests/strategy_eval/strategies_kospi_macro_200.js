/**
 * tests/strategy_eval/strategies_kospi_macro_200.js
 *
 * 200 Macro-Driven KOSPI 200 + Cash Strategies (M001 ~ M200)
 * Evaluated on Previous-Day Close (T-1) -> Executed on Next-Day Close (T)
 * Covers:
 *  - Group A (M001 ~ M040): 원달러 환율(USDKRW) 거시 전술
 *  - Group B (M041 ~ M080): 미국 국채금리 & 장단기 금리차(T10Y2Y / US10Y / US2Y)
 *  - Group C (M081 ~ M120): 한국 OECD 경기순환변동치(KOR_CLI) 경기사이클
 *  - Group D (M121 ~ M160): 글로벌 반도체(SOXX) · 유가 · VIX 선행
 *  - Group E (M161 ~ M200): 다중 매크로 앙상블 & 위기 복합 감지
 */

function kAlloc(kpiPct) {
  return [{ ticker: "KPI200", weightPct: kpiPct }];
}

function reb(periodMode, bandMode = "NONE", bandThreshold = 8, customDays = 60) {
  return { periodMode, bandMode, bandThreshold, customDays };
}

const STRATEGIES_KOSPI_MACRO_200 = [
  {
    "id": "M001",
    "name": "[M001] 환율 거시 전술 (환율 60일선 상향돌파 시 현금화 60% / 하향이탈 시 코스피 매수 60%)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일선 상향돌파 시 현금화 60% / 하향이탈 시 코스피 매수 60%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M001_R1",
        "name": "환율 > SMA(60) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      },
      {
        "id": "M001_R2",
        "name": "환율 < SMA(60) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M002",
    "name": "[M002] 환율 거시 전술 (환율 60일선 상향돌파 시 현금화 75% / 하향이탈 시 코스피 매수 75%)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일선 상향돌파 시 현금화 75% / 하향이탈 시 코스피 매수 75%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M002_R1",
        "name": "환율 > SMA(60) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M002_R2",
        "name": "환율 < SMA(60) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M003",
    "name": "[M003] 환율 거시 전술 (환율 120일 중기선 상향돌파 시 현금화 70% / 하향이탈 시 재매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 120일 중기선 상향돌파 시 현금화 70% / 하향이탈 시 재매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M003_R1",
        "name": "환율 > SMA(120) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M003_R2",
        "name": "환율 < SMA(120) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M004",
    "name": "[M004] 환율 거시 전술 (환율 120일선 돌파 시 적극 현금화 80% / 하향 시 코스피 80% 복원)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 120일선 돌파 시 적극 현금화 80% / 하향 시 코스피 80% 복원",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M004_R1",
        "name": "환율 > SMA(120) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M004_R2",
        "name": "환율 < SMA(120) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M005",
    "name": "[M005] 환율 거시 전술 (환율 200일 장기 추세선 상향돌파 시 현금 85% 대피 / 하향 시 코스피 복원)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 200일 장기 추세선 상향돌파 시 현금 85% 대피 / 하향 시 코스피 복원",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M005_R1",
        "name": "환율 > SMA(200) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 200
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M005_R2",
        "name": "환율 < SMA(200) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 200
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M006",
    "name": "[M006] 환율 거시 전술 (환율 20일 단기선 상향돌파 시 50% 현금화 / 하향이탈 시 50% 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 단기선 상향돌파 시 50% 현금화 / 하향이탈 시 50% 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M006_R1",
        "name": "환율 > SMA(20) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 20
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 50
        }
      },
      {
        "id": "M006_R2",
        "name": "환율 < SMA(20) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 20
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 50
        }
      }
    ]
  },
  {
    "id": "M007",
    "name": "[M007] 환율 거시 전술 (환율 60일선 돌파 시 코스피 70% 매도 / 하향이탈 시 현금 60% 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일선 돌파 시 코스피 70% 매도 / 하향이탈 시 현금 60% 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M007_R1",
        "name": "환율 > SMA(60) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M007_R2",
        "name": "환율 < SMA(60) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M008",
    "name": "[M008] 환율 거시 전술 (환율 90일 분기선 상향돌파 시 75% 대피 / 하향 시 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 90일 분기선 상향돌파 시 75% 대피 / 하향 시 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M008_R1",
        "name": "환율 > SMA(90) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 90
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M008_R2",
        "name": "환율 < SMA(90) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 90
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M009",
    "name": "[M009] 환율 거시 전술 (환율 60일선 돌파 시 전량(100%) 현금화 / 안정 시 80% 재매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일선 돌파 시 전량(100%) 현금화 / 안정 시 80% 재매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M009_R1",
        "name": "환율 > SMA(60) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 100
        }
      },
      {
        "id": "M009_R2",
        "name": "환율 < SMA(60) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M010",
    "name": "[M010] 환율 거시 전술 (환율 60일선 + 코스피 40:60 코어 밸런스 스위칭)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일선 + 코스피 40:60 코어 밸런스 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M010_R1",
        "name": "환율 > SMA(60) 시 코스피 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M010_R2",
        "name": "환율 < SMA(60) 시 코스피 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M011",
    "name": "[M011] 환율 거시 전술 (환율 60일 이격도 104% 초과 시 외인 이탈 대비 현금화 / 97% 이하 시 환율 진정 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 이격도 104% 초과 시 외인 이탈 대비 현금화 / 97% 이하 시 환율 진정 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M011_R1",
        "name": "환율 이격도(60) > 104% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 104
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M011_R2",
        "name": "환율 이격도(60) < 97% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 97
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M012",
    "name": "[M012] 환율 거시 전술 (환율 60일 이격도 105% 폭등 시 긴급 현금화 80% / 96% 이하 시 저점 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 이격도 105% 폭등 시 긴급 현금화 80% / 96% 이하 시 저점 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M012_R1",
        "name": "환율 이격도(60) > 105% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 105
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M012_R2",
        "name": "환율 이격도(60) < 96% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 96
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M013",
    "name": "[M013] 환율 거시 전술 (환율 20일 단기 이격도 103% 초과 시 매도 / 98% 이하 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 단기 이격도 103% 초과 시 매도 / 98% 이하 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M013_R1",
        "name": "환율 이격도(20) > 103% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 103
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      },
      {
        "id": "M013_R2",
        "name": "환율 이격도(20) < 98% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 98
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M014",
    "name": "[M014] 환율 거시 전술 (환율 120일 중기 이격도 106% 오버슈팅 시 85% 현금화)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 120일 중기 이격도 106% 오버슈팅 시 85% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M014_R1",
        "name": "환율 이격도(120) > 106% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 120
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 106
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M014_R2",
        "name": "환율 이격도(120) < 95% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 120
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 95
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M015",
    "name": "[M015] 환율 거시 전술 (환율 60일 이격도 103.5% 민감형 환율 방어)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 이격도 103.5% 민감형 환율 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M015_R1",
        "name": "환율 이격도(60) > 103.5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 103.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M015_R2",
        "name": "환율 이격도(60) < 97.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 97.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M016",
    "name": "[M016] 환율 거시 전술 (환율 60일 이격도 104.5% 기준 균형형 환율 쉴드)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 이격도 104.5% 기준 균형형 환율 쉴드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M016_R1",
        "name": "환율 이격도(60) > 104.5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 104.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M016_R2",
        "name": "환율 이격도(60) < 96.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 96.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M017",
    "name": "[M017] 환율 거시 전술 (환율 90일 이격도 105% 상회 시 외환 충격 차단)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 90일 이격도 105% 상회 시 외환 충격 차단",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M017_R1",
        "name": "환율 이격도(90) > 105% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 90
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 105
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M017_R2",
        "name": "환율 이격도(90) < 96% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 90
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 96
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M018",
    "name": "[M018] 환율 거시 전술 (환율 60일 이격도 106% 극단 과열 시 전량급(90%) 대피)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 이격도 106% 극단 과열 시 전량급(90%) 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M018_R1",
        "name": "환율 이격도(60) > 106% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 106
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M018_R2",
        "name": "환율 이격도(60) < 95% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 95
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M019",
    "name": "[M019] 환율 거시 전술 (환율 30일 이격도 스위퍼)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 30일 이격도 스위퍼",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M019_R1",
        "name": "환율 이격도(30) > 103.5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 30
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 103.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M019_R2",
        "name": "환율 이격도(30) < 97% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 30
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 97
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M020",
    "name": "[M020] 환율 거시 전술 (환율 60일 이격도 104%/98% 타이트 밴드)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 이격도 104%/98% 타이트 밴드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M020_R1",
        "name": "환율 이격도(60) > 104% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 104
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      },
      {
        "id": "M020_R2",
        "name": "환율 이격도(60) < 98% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "DISPARITY",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 98
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M021",
    "name": "[M021] 환율 거시 전술 (환율 20일 급등률 4% 초과 시 현금화 / 환율 -2% 하락 진정 시 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 급등률 4% 초과 시 현금화 / 환율 -2% 하락 진정 시 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M021_R1",
        "name": "환율 ROC(20) > 4% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M021_R2",
        "name": "환율 ROC(20) < -2% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M022",
    "name": "[M022] 환율 거시 전술 (환율 20일 급등률 5% 초과 시 80% 현금 대피)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 급등률 5% 초과 시 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M022_R1",
        "name": "환율 ROC(20) > 5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M022_R2",
        "name": "환율 ROC(20) < -2.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -2.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M023",
    "name": "[M023] 환율 거시 전술 (환율 10일 초단기 급등 3% 포착 시 선제적 리스크 오프)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 10일 초단기 급등 3% 포착 시 선제적 리스크 오프",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M023_R1",
        "name": "환율 ROC(10) > 3% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 10
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      },
      {
        "id": "M023_R2",
        "name": "환율 ROC(10) < -1.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 10
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -1.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M024",
    "name": "[M024] 환율 거시 전술 (환율 60일 중기 상승률 6% 도달 시 매도 / -3% 안정 시 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 중기 상승률 6% 도달 시 매도 / -3% 안정 시 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M024_R1",
        "name": "환율 ROC(60) > 6% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 6
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M024_R2",
        "name": "환율 ROC(60) < -3% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M025",
    "name": "[M025] 환율 거시 전술 (환율 20일 ROC 3.5% 저낙폭 보수형)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 ROC 3.5% 저낙폭 보수형",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M025_R1",
        "name": "환율 ROC(20) > 3.5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 3.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M025_R2",
        "name": "환율 ROC(20) < -1.8% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -1.8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M026",
    "name": "[M026] 환율 거시 전술 (환율 40일 ROC 4.5% 스윙 필터)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 40일 ROC 4.5% 스윙 필터",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M026_R1",
        "name": "환율 ROC(40) > 4.5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 40
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 4.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M026_R2",
        "name": "환율 ROC(40) < -2% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 40
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M027",
    "name": "[M027] 환율 거시 전술 (환율 20일 ROC 5.5% 돌파 시 고성장형 긴급 현금화)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 ROC 5.5% 돌파 시 고성장형 긴급 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M027_R1",
        "name": "환율 ROC(20) > 5.5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 5.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M027_R2",
        "name": "환율 ROC(20) < -2.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -2.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M028",
    "name": "[M028] 환율 거시 전술 (환율 15일 ROC 3.2% 밸런스 필터)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 15일 ROC 3.2% 밸런스 필터",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M028_R1",
        "name": "환율 ROC(15) > 3.2% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 15
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 3.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M028_R2",
        "name": "환율 ROC(15) < -1.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 15
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -1.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M029",
    "name": "[M029] 환율 거시 전술 (환율 60일 대형 사이클 7% 급등 차단)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 대형 사이클 7% 급등 차단",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M029_R1",
        "name": "환율 ROC(60) > 7% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 7
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M029_R2",
        "name": "환율 ROC(60) < -3.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -3.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M030",
    "name": "[M030] 환율 거시 전술 (환율 20일 4.2%/-2.2% 대칭 스위칭)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 4.2%/-2.2% 대칭 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M030_R1",
        "name": "환율 ROC(20) > 4.2% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 4.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M030_R2",
        "name": "환율 ROC(20) < -2.2% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -2.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M031",
    "name": "[M031] 환율 거시 전술 (환율 20일 볼린저상단 터치 시 외환과열 현금화 / 하단 접근 시 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 볼린저상단 터치 시 외환과열 현금화 / 하단 접근 시 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M031_R1",
        "name": "환율 BB(20,2) 상단 돌파 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 20,
              "p2": 2
            },
            "operator": "BB_UPPER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M031_R2",
        "name": "환율 BB(20,2) 하단 터치 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 20,
              "p2": 2
            },
            "operator": "BB_LOWER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M032",
    "name": "[M032] 환율 거시 전술 (환율 40일 볼린저상단 돌파 시 75% 현금화)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 40일 볼린저상단 돌파 시 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M032_R1",
        "name": "환율 BB(40,2) 상단 돌파 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 40,
              "p2": 2
            },
            "operator": "BB_UPPER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M032_R2",
        "name": "환율 BB(40,2) 하단 터치 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 40,
              "p2": 2
            },
            "operator": "BB_LOWER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M033",
    "name": "[M033] 환율 거시 전술 (환율 60일 볼린저상단 돌파 시 외환위기 차단 80% 현금화)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일 볼린저상단 돌파 시 외환위기 차단 80% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M033_R1",
        "name": "환율 BB(60,2) 상단 돌파 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 60,
              "p2": 2
            },
            "operator": "BB_UPPER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M033_R2",
        "name": "환율 BB(60,2) 하단 터치 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 60,
              "p2": 2
            },
            "operator": "BB_LOWER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M034",
    "name": "[M034] 환율 거시 전술 (환율 20일 2.2시그마 극단 과열 시 매도)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 20일 2.2시그마 극단 과열 시 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M034_R1",
        "name": "환율 BB(20,2.2) 상단 돌파 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 20,
              "p2": 2.2
            },
            "operator": "BB_UPPER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M034_R2",
        "name": "환율 BB(20,2.2) 하단 터치 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 20,
              "p2": 2.2
            },
            "operator": "BB_LOWER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M035",
    "name": "[M035] 환율 거시 전술 (환율 30일 1.8시그마 민감형 밴드 방어)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 30일 1.8시그마 민감형 밴드 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M035_R1",
        "name": "환율 BB(30,1.8) 상단 돌파 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 30,
              "p2": 1.8
            },
            "operator": "BB_UPPER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M035_R2",
        "name": "환율 BB(30,1.8) 하단 터치 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE",
              "p1": 30,
              "p2": 1.8
            },
            "operator": "BB_LOWER_TOUCH"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M036",
    "name": "[M036] 환율 거시 전술 (달러인덱스(DXY) 60일선 상향돌파 강달러 시 현금화 / 하향이탈 시 매수)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "달러인덱스(DXY) 60일선 상향돌파 강달러 시 현금화 / 하향이탈 시 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M036_R1",
        "name": "달러인덱스 > SMA(60) 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M036_R2",
        "name": "달러인덱스 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M037",
    "name": "[M037] 환율 거시 전술 (달러인덱스(DXY) 120일선 돌파 시 글로벌 달러경색 대피)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "달러인덱스(DXY) 120일선 돌파 시 글로벌 달러경색 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M037_R1",
        "name": "달러인덱스 > SMA(120) 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M037_R2",
        "name": "달러인덱스 < SMA(120) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M038",
    "name": "[M038] 환율 거시 전술 (달러인덱스 20일 3% 급등 시 외환 리스크 오프)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "달러인덱스 20일 3% 급등 시 외환 리스크 오프",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M038_R1",
        "name": "달러인덱스 ROC(20) > 3% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "DXY",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M038_R2",
        "name": "달러인덱스 ROC(20) < -1.5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "DXY",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -1.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M039",
    "name": "[M039] 환율 거시 전술 (환율 60일선 & 달러인덱스 60일선 동반 돌파 시 80% 현금 대피)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 60일선 & 달러인덱스 60일선 동반 돌파 시 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M039_R1",
        "name": "환율 > SMA(60) AND 달러인덱스 > SMA(60) 쌍끌이 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M039_R2",
        "name": "환율 < SMA(60) AND 달러인덱스 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M040",
    "name": "[M040] 환율 거시 전술 (환율 BB 상단 + 달러인덱스 60일선 쌍끌이 강달러 철벽 방어)",
    "category": "Group A: 원달러 환율(USDKRW) 거시 전술",
    "rationale": "환율 BB 상단 + 달러인덱스 60일선 쌍끌이 강달러 철벽 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M040_R1",
        "name": "환율 > SMA(60) AND 달러인덱스 > SMA(60) 쌍끌이 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M040_R2",
        "name": "환율 < SMA(60) AND 달러인덱스 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "DXY",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "DXY",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M041",
    "name": "[M041] 금리/일드커브 거시 전술 (장단기 금리차(10Y-2Y) 역전 후 0% 상향돌파(스티프닝) 시 리세션 대피 75% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "장단기 금리차(10Y-2Y) 역전 후 0% 상향돌파(스티프닝) 시 리세션 대피 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M041_R1",
        "name": "T10Y2Y > 0% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M041_R2",
        "name": "T10Y2Y < -0.2% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M042",
    "name": "[M042] 금리/일드커브 거시 전술 (T10Y2Y > 0.1% 정상화 확인 시 80% 현금 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > 0.1% 정상화 확인 시 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M042_R1",
        "name": "T10Y2Y > 0.1% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.1
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M042_R2",
        "name": "T10Y2Y < -0.1% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.1
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M043",
    "name": "[M043] 금리/일드커브 거시 전술 (T10Y2Y > 0.2% 본격 스티프닝 시 85% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > 0.2% 본격 스티프닝 시 85% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M043_R1",
        "name": "T10Y2Y > 0.2% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M043_R2",
        "name": "T10Y2Y < 0% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M044",
    "name": "[M044] 금리/일드커브 거시 전술 (T10Y2Y 0% 돌파 70% 현금화 / 코어 55:45)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y 0% 돌파 70% 현금화 / 코어 55:45",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M044_R1",
        "name": "T10Y2Y > 0% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M044_R2",
        "name": "T10Y2Y < -0.2% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M045",
    "name": "[M045] 금리/일드커브 거시 전술 (T10Y2Y > -0.1% 역전 완화 시 조기 대피 / 코어 35:65)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > -0.1% 역전 완화 시 조기 대피 / 코어 35:65",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M045_R1",
        "name": "T10Y2Y > -0.1% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": -0.1
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M045_R2",
        "name": "T10Y2Y < -0.30000000000000004% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.30000000000000004
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M046",
    "name": "[M046] 금리/일드커브 거시 전술 (T10Y2Y 0% 상향돌파 시 전량(100%) 현금 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y 0% 상향돌파 시 전량(100%) 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M046_R1",
        "name": "T10Y2Y > 0% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 100
        }
      },
      {
        "id": "M046_R2",
        "name": "T10Y2Y < -0.2% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M047",
    "name": "[M047] 금리/일드커브 거시 전술 (T10Y2Y > 0.15% 기준 80% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > 0.15% 기준 80% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M047_R1",
        "name": "T10Y2Y > 0.15% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M047_R2",
        "name": "T10Y2Y < -0.05000000000000002% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.05000000000000002
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M048",
    "name": "[M048] 금리/일드커브 거시 전술 (고성장형(60:40) T10Y2Y 0% 돌파 시 80% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "고성장형(60:40) T10Y2Y 0% 돌파 시 80% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M048_R1",
        "name": "T10Y2Y > 0% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M048_R2",
        "name": "T10Y2Y < -0.2% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M049",
    "name": "[M049] 금리/일드커브 거시 전술 (T10Y2Y > 0.25% 리세션 공식 진입 시 90% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > 0.25% 리세션 공식 진입 시 90% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M049_R1",
        "name": "T10Y2Y > 0.25% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M049_R2",
        "name": "T10Y2Y < 0.04999999999999999% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0.04999999999999999
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M050",
    "name": "[M050] 금리/일드커브 거시 전술 (T10Y2Y > 0.05% 중립 스티프닝 스위칭)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > 0.05% 중립 스티프닝 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M050_R1",
        "name": "T10Y2Y > 0.05% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M050_R2",
        "name": "T10Y2Y < -0.15000000000000002% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15000000000000002
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M051",
    "name": "[M051] 금리/일드커브 거시 전술 (T10Y2Y 심각 역전 탈출 시 65% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y 심각 역전 탈출 시 65% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M051_R1",
        "name": "T10Y2Y > -0.2% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M051_R2",
        "name": "T10Y2Y < -0.4% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M052",
    "name": "[M052] 금리/일드커브 거시 전술 (T10Y2Y 0.3% 확인 스티프닝)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y 0.3% 확인 스티프닝",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M052_R1",
        "name": "T10Y2Y > 0.3% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M052_R2",
        "name": "T10Y2Y < 0.09999999999999998% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0.09999999999999998
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M053",
    "name": "[M053] 금리/일드커브 거시 전술 (초방어 35:65 + T10Y2Y 0% 돌파)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "초방어 35:65 + T10Y2Y 0% 돌파",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M053_R1",
        "name": "T10Y2Y > 0% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M053_R2",
        "name": "T10Y2Y < -0.2% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M054",
    "name": "[M054] 금리/일드커브 거시 전술 (성장 55:45 + T10Y2Y 0.1% 돌파)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "성장 55:45 + T10Y2Y 0.1% 돌파",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M054_R1",
        "name": "T10Y2Y > 0.1% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.1
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M054_R2",
        "name": "T10Y2Y < -0.1% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.1
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M055",
    "name": "[M055] 금리/일드커브 거시 전술 (밸런스 45:55 + T10Y2Y 0.08% 돌파)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "밸런스 45:55 + T10Y2Y 0.08% 돌파",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M055_R1",
        "name": "T10Y2Y > 0.08% 스티프닝 리세션 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.08
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M055_R2",
        "name": "T10Y2Y < -0.12000000000000001% 재진입 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.12000000000000001
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M056",
    "name": "[M056] 금리/일드커브 거시 전술 (미국 10년물 금리 20일간 +30bp(+0.30%p) 급등 시 긴축 쇼크 70% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미국 10년물 금리 20일간 +30bp(+0.30%p) 급등 시 긴축 쇼크 70% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M056_R1",
        "name": "미10년 금리 DIFF(20) >= +0.3%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M056_R2",
        "name": "미10년 금리 DIFF(20) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M057",
    "name": "[M057] 금리/일드커브 거시 전술 (미 10년 금리 20일간 +40bp 스파이크 시 80% 현금 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 20일간 +40bp 스파이크 시 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M057_R1",
        "name": "미10년 금리 DIFF(20) >= +0.4%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M057_R2",
        "name": "미10년 금리 DIFF(20) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M058",
    "name": "[M058] 금리/일드커브 거시 전술 (미 10년 금리 30일간 +35bp 상승 시 75% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 30일간 +35bp 상승 시 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M058_R1",
        "name": "미10년 금리 DIFF(30) >= +0.35%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 30
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M058_R2",
        "name": "미10년 금리 DIFF(30) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 30
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M059",
    "name": "[M059] 금리/일드커브 거시 전술 (미 10년 금리 20일간 +25bp 민감 감지 매도)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 20일간 +25bp 민감 감지 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M059_R1",
        "name": "미10년 금리 DIFF(20) >= +0.25%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M059_R2",
        "name": "미10년 금리 DIFF(20) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M060",
    "name": "[M060] 금리/일드커브 거시 전술 (미 10년 금리 15일간 +30bp 보수형 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 15일간 +30bp 보수형 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M060_R1",
        "name": "미10년 금리 DIFF(15) >= +0.3%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 15
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M060_R2",
        "name": "미10년 금리 DIFF(15) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 15
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M061",
    "name": "[M061] 금리/일드커브 거시 전술 (미 10년 금리 40일 ROC > +15% 급등 시 75% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 40일 ROC > +15% 급등 시 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M061_R1",
        "name": "미10년 금리 ROC(40) >= +15% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "ROC",
              "p1": 40
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M061_R2",
        "name": "미10년 금리 ROC(40) <= -8% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "ROC",
              "p1": 40
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M062",
    "name": "[M062] 금리/일드커브 거시 전술 (미 10년 금리 60일 ROC > +20% 긴축 사이클 차단)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 60일 ROC > +20% 긴축 사이클 차단",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M062_R1",
        "name": "미10년 금리 ROC(60) >= +20% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M062_R2",
        "name": "미10년 금리 ROC(60) <= -8% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M063",
    "name": "[M063] 금리/일드커브 거시 전술 (고성장 60:40 + 미 10년 금리 +45bp 급등 방어)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "고성장 60:40 + 미 10년 금리 +45bp 급등 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M063_R1",
        "name": "미10년 금리 DIFF(20) >= +0.45%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.45
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M063_R2",
        "name": "미10년 금리 DIFF(20) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M064",
    "name": "[M064] 금리/일드커브 거시 전술 (미 10년 금리 10일 +25bp 초단기 금리발작 방어)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 10일 +25bp 초단기 금리발작 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M064_R1",
        "name": "미10년 금리 DIFF(10) >= +0.25%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 10
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M064_R2",
        "name": "미10년 금리 DIFF(10) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 10
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M065",
    "name": "[M065] 금리/일드커브 거시 전술 (미 10년 금리 20일 +35bp 표준 금리 필터)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 20일 +35bp 표준 금리 필터",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M065_R1",
        "name": "미10년 금리 DIFF(20) >= +0.35%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M065_R2",
        "name": "미10년 금리 DIFF(20) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M066",
    "name": "[M066] 금리/일드커브 거시 전술 (미 10년 금리 > SMA(60) 돌파 시 65% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 > SMA(60) 돌파 시 65% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M066_R1",
        "name": "미10년 금리 > SMA(60) 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "US10Y",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M066_R2",
        "name": "미10년 금리 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "US10Y",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M067",
    "name": "[M067] 금리/일드커브 거시 전술 (미 10년 금리 > SMA(120) 돌파 시 70% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 > SMA(120) 돌파 시 70% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M067_R1",
        "name": "미10년 금리 > SMA(120) 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "US10Y",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M067_R2",
        "name": "미10년 금리 < SMA(120) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "US10Y",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M068",
    "name": "[M068] 금리/일드커브 거시 전술 (초방어 35:65 + 미 10년 금리 60일선 돌파)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "초방어 35:65 + 미 10년 금리 60일선 돌파",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M068_R1",
        "name": "미10년 금리 > SMA(60) 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "PRICE"
            },
            "operator": "CROSS_UP",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "US10Y",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M068_R2",
        "name": "미10년 금리 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "PRICE"
            },
            "operator": "CROSS_DOWN",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "US10Y",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M069",
    "name": "[M069] 금리/일드커브 거시 전술 (미 10년 금리 30일 ROC 12% 상승 시 매도)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 30일 ROC 12% 상승 시 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M069_R1",
        "name": "미10년 금리 ROC(30) >= +12% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "ROC",
              "p1": 30
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 12
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M069_R2",
        "name": "미10년 금리 ROC(30) <= -8% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "ROC",
              "p1": 30
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M070",
    "name": "[M070] 금리/일드커브 거시 전술 (미 10년 금리 25일 +35bp 스위칭)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 10년 금리 25일 +35bp 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M070_R1",
        "name": "미10년 금리 DIFF(25) >= +0.35%p 급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 25
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M070_R2",
        "name": "미10년 금리 DIFF(25) <= -0.15%p 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 25
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M071",
    "name": "[M071] 금리/일드커브 거시 전술 (미 2년물 금리 60일간 -10% 급락(피벗 인하) 시 침체 확인 매도 / 바닥 진정 매수)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 2년물 금리 60일간 -10% 급락(피벗 인하) 시 침체 확인 매도 / 바닥 진정 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M071_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE"
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      },
      {
        "id": "M071_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": null
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M072",
    "name": "[M072] 금리/일드커브 거시 전술 (미 2년물 금리 -15% 급락 시 리세션 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 2년물 금리 -15% 급락 시 리세션 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M072_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE"
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE"
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M072_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": null
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M073",
    "name": "[M073] 금리/일드커브 거시 전술 (미 2년물 금리 20일간 -40bp 급락 시 75% 현금화)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 2년물 금리 20일간 -40bp 급락 시 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M073_R1",
        "name": "미2년 금리 DIFF(20) <= -0.4%p 피벗 침체 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US2Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M073_R2",
        "name": "미2년 금리 안정 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "US2Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M074",
    "name": "[M074] 금리/일드커브 거시 전술 (미 2년물 금리 -50bp 폭락 시 패닉 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "미 2년물 금리 -50bp 폭락 시 패닉 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M074_R1",
        "name": "미2년 금리 DIFF(20) <= -0.5%p 피벗 침체 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "US2Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M074_R2",
        "name": "미2년 금리 안정 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "US2Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M075",
    "name": "[M075] 금리/일드커브 거시 전술 (보수 35:65 + 미 2년 금리 -35bp 급락 방어)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "보수 35:65 + 미 2년 금리 -35bp 급락 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M075_R1",
        "name": "미2년 금리 DIFF(20) <= -0.35%p 피벗 침체 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US2Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M075_R2",
        "name": "미2년 금리 안정 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "US2Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M076",
    "name": "[M076] 금리/일드커브 거시 전술 (T10Y2Y 스티프닝 OR 미10년 금리 급등 복합 금리 쉴드)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y 스티프닝 OR 미10년 금리 급등 복합 금리 쉴드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M076_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M076_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M077",
    "name": "[M077] 금리/일드커브 거시 전술 (T10Y2Y > 0.1% OR 미10년 +35bp 80% 현금 대피)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "T10Y2Y > 0.1% OR 미10년 +35bp 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M077_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.1
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M077_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.1
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M078",
    "name": "[M078] 금리/일드커브 거시 전술 (고성장 60:40 + 복합 금리 충격 차단)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "고성장 60:40 + 복합 금리 충격 차단",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M078_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M078_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M079",
    "name": "[M079] 금리/일드커브 거시 전술 (저낙폭 40:60 + 복합 금리 필터)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "저낙폭 40:60 + 복합 금리 필터",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M079_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M079_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.15000000000000002
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M080",
    "name": "[M080] 금리/일드커브 거시 전술 (스마트 일드커브 80% 현금 스위칭)",
    "category": "Group B: 미국 국채금리 & 장단기 금리차",
    "rationale": "스마트 일드커브 80% 현금 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M080_R1",
        "name": "T10Y2Y 스티프닝 OR 미10년 금리 급등 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.2
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M080_R2",
        "name": "금리 충격 완화 시 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "US10Y",
              "transform": "DIFF",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M081",
    "name": "[M081] OECD 경기순환변동치 전술 (OECD 경기선행지수(CLI) 100 상회 시 경기확장 매수 80% / 100 하회 시 경기수축 현금화 75%)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "OECD 경기선행지수(CLI) 100 상회 시 경기확장 매수 80% / 100 하회 시 경기수축 현금화 75%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M081_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M081_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M082",
    "name": "[M082] OECD 경기순환변동치 전술 (CLI 100 기준 85% 대규모 현금 대피 및 확장 매수)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 기준 85% 대규모 현금 대피 및 확장 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M082_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M082_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M083",
    "name": "[M083] OECD 경기순환변동치 전술 (CLI 100 기준 코어 40:60 방어형 스위칭)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 기준 코어 40:60 방어형 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M083_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M083_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M084",
    "name": "[M084] OECD 경기순환변동치 전술 (CLI 100 기준 코어 55:45 성장형 스위칭)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 기준 코어 55:45 성장형 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M084_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M084_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M085",
    "name": "[M085] OECD 경기순환변동치 전술 (CLI 100 기준 코어 35:65 초방어형 스위칭)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 기준 코어 35:65 초방어형 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M085_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M085_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M086",
    "name": "[M086] OECD 경기순환변동치 전술 (CLI 100.5 이상 확실한 확장 국면 매수 / 하향 시 현금화)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100.5 이상 확실한 확장 국면 매수 / 하향 시 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M086_R1",
        "name": "CLI < 100.5 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M086_R2",
        "name": "CLI >= 100.5 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M087",
    "name": "[M087] OECD 경기순환변동치 전술 (CLI 99.5 선제적 수축 탈출 스위칭)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 99.5 선제적 수축 탈출 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M087_R1",
        "name": "CLI < 99.5 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 99.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M087_R2",
        "name": "CLI >= 99.5 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 99.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M088",
    "name": "[M088] OECD 경기순환변동치 전술 (고성장 60:40 CLI 100 경기사이클 풀베팅)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "고성장 60:40 CLI 100 경기사이클 풀베팅",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M088_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M088_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      }
    ]
  },
  {
    "id": "M089",
    "name": "[M089] OECD 경기순환변동치 전술 (CLI 100 하회 시 전량(100%) 현금 대피)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 하회 시 전량(100%) 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M089_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 100
        }
      },
      {
        "id": "M089_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M090",
    "name": "[M090] OECD 경기순환변동치 전술 (CLI 100.2 기준 밸런스 40:60)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100.2 기준 밸런스 40:60",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M090_R1",
        "name": "CLI < 100.2 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M090_R2",
        "name": "CLI >= 100.2 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M091",
    "name": "[M091] OECD 경기순환변동치 전술 (CLI 99.8 민감형 스위칭)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 99.8 민감형 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M091_R1",
        "name": "CLI < 99.8 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 99.8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M091_R2",
        "name": "CLI >= 99.8 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 99.8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M092",
    "name": "[M092] OECD 경기순환변동치 전술 (CLI 100 마일드 스위칭)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 마일드 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M092_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M092_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M093",
    "name": "[M093] OECD 경기순환변동치 전술 (초방어 35:65 CLI 100 쉴드)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "초방어 35:65 CLI 100 쉴드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M093_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M093_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M094",
    "name": "[M094] OECD 경기순환변동치 전술 (성장 55:45 CLI 100.3 확인 확장)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "성장 55:45 CLI 100.3 확인 확장",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M094_R1",
        "name": "CLI < 100.3 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M094_R2",
        "name": "CLI >= 100.3 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M095",
    "name": "[M095] OECD 경기순환변동치 전술 (표준 50:50 CLI 100 경기추종)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "표준 50:50 CLI 100 경기추종",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M095_R1",
        "name": "CLI < 100 경기수축 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M095_R2",
        "name": "CLI >= 100 경기확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M096",
    "name": "[M096] OECD 경기순환변동치 전술 (CLI 60일 변화율 +0.3% 상승 가속 시 저점 매집 / -0.3% 하락 둔화 시 선제 현금화)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 60일 변화율 +0.3% 상승 가속 시 저점 매집 / -0.3% 하락 둔화 시 선제 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M096_R1",
        "name": "CLI ROC(60) <= -0.3% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M096_R2",
        "name": "CLI ROC(60) >= +0.3% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M097",
    "name": "[M097] OECD 경기순환변동치 전술 (CLI 60일 변화율 +0.5% 강한 경기반등 매수 / -0.5% 둔화 매도)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 60일 변화율 +0.5% 강한 경기반등 매수 / -0.5% 둔화 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M097_R1",
        "name": "CLI ROC(60) <= -0.5% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M097_R2",
        "name": "CLI ROC(60) >= +0.5% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M098",
    "name": "[M098] OECD 경기순환변동치 전술 (CLI 90일 분기 모멘텀 +0.4% 경기 확장 추종)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 90일 분기 모멘텀 +0.4% 경기 확장 추종",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M098_R1",
        "name": "CLI ROC(90) <= -0.4% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 90
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M098_R2",
        "name": "CLI ROC(90) >= +0.4% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 90
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M099",
    "name": "[M099] OECD 경기순환변동치 전술 (CLI 60일 +0.2% 민감 경기회복 조기 포착)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 60일 +0.2% 민감 경기회복 조기 포착",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M099_R1",
        "name": "CLI ROC(60) <= -0.2% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M099_R2",
        "name": "CLI ROC(60) >= +0.2% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M100",
    "name": "[M100] OECD 경기순환변동치 전술 (초방어 35:65 + CLI 60일 모멘텀)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "초방어 35:65 + CLI 60일 모멘텀",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M100_R1",
        "name": "CLI ROC(60) <= -0.4% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M100_R2",
        "name": "CLI ROC(60) >= +0.4% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M101",
    "name": "[M101] OECD 경기순환변동치 전술 (CLI 120일 반기 대세 사이클 +0.6% 추종)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 120일 반기 대세 사이클 +0.6% 추종",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M101_R1",
        "name": "CLI ROC(120) <= -0.6% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 15,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 120
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.6
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M101_R2",
        "name": "CLI ROC(120) >= +0.6% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 15,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 120
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.6
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M102",
    "name": "[M102] OECD 경기순환변동치 전술 (CLI 40일 단기 모멘텀 스위처)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 40일 단기 모멘텀 스위처",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M102_R1",
        "name": "CLI ROC(40) <= -0.25% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 40
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M102_R2",
        "name": "CLI ROC(40) >= +0.25% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 40
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M103",
    "name": "[M103] OECD 경기순환변동치 전술 (고성장 60:40 + CLI 60일 ROC 0.4%)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "고성장 60:40 + CLI 60일 ROC 0.4%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M103_R1",
        "name": "CLI ROC(60) <= -0.4% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M103_R2",
        "name": "CLI ROC(60) >= +0.4% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M104",
    "name": "[M104] OECD 경기순환변동치 전술 (밸런스 40:60 + CLI 60일 ROC 0.35%)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "밸런스 40:60 + CLI 60일 ROC 0.35%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M104_R1",
        "name": "CLI ROC(60) <= -0.35% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M104_R2",
        "name": "CLI ROC(60) >= +0.35% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M105",
    "name": "[M105] OECD 경기순환변동치 전술 (CLI 60일 ROC 0.2% 마일드)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 60일 ROC 0.2% 마일드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M105_R1",
        "name": "CLI ROC(60) <= -0.2% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M105_R2",
        "name": "CLI ROC(60) >= +0.2% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.2
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M106",
    "name": "[M106] OECD 경기순환변동치 전술 (CLI 90일 ROC 0.6% 대형 사이클)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 90일 ROC 0.6% 대형 사이클",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M106_R1",
        "name": "CLI ROC(90) <= -0.6% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 90
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.6
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M106_R2",
        "name": "CLI ROC(90) >= +0.6% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 90
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.6
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M107",
    "name": "[M107] OECD 경기순환변동치 전술 (초방어 35:65 CLI 모멘텀)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "초방어 35:65 CLI 모멘텀",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M107_R1",
        "name": "CLI ROC(60) <= -0.3% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M107_R2",
        "name": "CLI ROC(60) >= +0.3% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.3
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M108",
    "name": "[M108] OECD 경기순환변동치 전술 (성장 55:45 CLI 90일 모멘텀)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "성장 55:45 CLI 90일 모멘텀",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M108_R1",
        "name": "CLI ROC(90) <= -0.5% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 90
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M108_R2",
        "name": "CLI ROC(90) >= +0.5% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 12,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 90
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M109",
    "name": "[M109] OECD 경기순환변동치 전술 (표준 50:50 CLI 60일 모멘텀)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "표준 50:50 CLI 60일 모멘텀",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M109_R1",
        "name": "CLI ROC(60) <= -0.4% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M109_R2",
        "name": "CLI ROC(60) >= +0.4% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M110",
    "name": "[M110] OECD 경기순환변동치 전술 (CLI 60일 ROC 0.45% 밸런스)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 60일 ROC 0.45% 밸런스",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M110_R1",
        "name": "CLI ROC(60) <= -0.45% 둔화 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -0.45
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M110_R2",
        "name": "CLI ROC(60) >= +0.45% 회복 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.45
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M111",
    "name": "[M111] OECD 경기순환변동치 전술 (CLI > 100 AND ROC > 0 (경기 확장기) 코스피 집중 / CLI < 100 AND ROC < 0 (수축기) 전량 대피)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI > 100 AND ROC > 0 (경기 확장기) 코스피 집중 / CLI < 100 AND ROC < 0 (수축기) 전량 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M111_R1",
        "name": "CLI < 100 AND ROC <= 0 침체기 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M111_R2",
        "name": "CLI >= 100 AND ROC >= 0 확장기 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M112",
    "name": "[M112] OECD 경기순환변동치 전술 (CLI 100 + ROC 60일 복합 경기사이클 4국면 배분)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 + ROC 60일 복합 경기사이클 4국면 배분",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M112_R1",
        "name": "CLI < 100 AND ROC <= 0 침체기 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M112_R2",
        "name": "CLI >= 100 AND ROC >= 0 확장기 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M113",
    "name": "[M113] OECD 경기순환변동치 전술 (성장형 CLI 100 + 모멘텀 확장 집중)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "성장형 CLI 100 + 모멘텀 확장 집중",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M113_R1",
        "name": "CLI < 100 AND ROC <= 0 침체기 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M113_R2",
        "name": "CLI >= 100 AND ROC >= 0 확장기 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M114",
    "name": "[M114] OECD 경기순환변동치 전술 (방어형 CLI 100 + 모멘텀 수축 철벽 대피)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "방어형 CLI 100 + 모멘텀 수축 철벽 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M114_R1",
        "name": "CLI < 100 AND ROC <= 0 침체기 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M114_R2",
        "name": "CLI >= 100 AND ROC >= 0 확장기 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M115",
    "name": "[M115] OECD 경기순환변동치 전술 (CLI > 100 AND 코스피 > SMA(60) 쌍끌이 상승 매수 / 이탈 시 현금화)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI > 100 AND 코스피 > SMA(60) 쌍끌이 상승 매수 / 이탈 시 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M115_R1",
        "name": "CLI < 100 OR 코스피 < SMA(60) 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M115_R2",
        "name": "CLI >= 100 AND 코스피 >= SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M116",
    "name": "[M116] OECD 경기순환변동치 전술 (CLI 100 + 코스피 60일 수급선 동시 확인 골디락스)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 100 + 코스피 60일 수급선 동시 확인 골디락스",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M116_R1",
        "name": "CLI < 100 OR 코스피 < SMA(60) 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M116_R2",
        "name": "CLI >= 100 AND 코스피 >= SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M117",
    "name": "[M117] OECD 경기순환변동치 전술 (CLI > 100 AND 환율 < SMA(60) 최상 경기 매수 / CLI < 100 & 환율 급등 시 85% 현금화)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI > 100 AND 환율 < SMA(60) 최상 경기 매수 / CLI < 100 & 환율 급등 시 85% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M117_R1",
        "name": "CLI < 100 OR 환율 > SMA(60) 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M117_R2",
        "name": "CLI >= 100 AND 환율 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M118",
    "name": "[M118] OECD 경기순환변동치 전술 (CLI 경기선행 + 원달러 환율 쌍방향 매크로 엔진)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "CLI 경기선행 + 원달러 환율 쌍방향 매크로 엔진",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M118_R1",
        "name": "CLI < 100 OR 환율 > SMA(60) 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M118_R2",
        "name": "CLI >= 100 AND 환율 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M119",
    "name": "[M119] OECD 경기순환변동치 전술 (성장형 CLI + 환율 복합 매크로)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "성장형 CLI + 환율 복합 매크로",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M119_R1",
        "name": "CLI < 100 OR 환율 > SMA(60) 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M119_R2",
        "name": "CLI >= 100 AND 환율 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M120",
    "name": "[M120] OECD 경기순환변동치 전술 (초방어 35:65 CLI + 환율 최악 국면 90% 대피)",
    "category": "Group C: 한국 OECD 경기순환변동치(KOR_CLI)",
    "rationale": "초방어 35:65 CLI + 환율 최악 국면 90% 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M120_R1",
        "name": "CLI < 100 OR 환율 > SMA(60) 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M120_R2",
        "name": "CLI >= 100 AND 환율 < SMA(60) 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M121",
    "name": "[M121] 글로벌 선행 크로스자산 전술 (미국 반도체(SOXX) > SMA(60) 돌파 시 코스피 매수 / 하향이탈 시 75% 현금화)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "미국 반도체(SOXX) > SMA(60) 돌파 시 코스피 매수 / 하향이탈 시 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M121_R1",
        "name": "SOXX < SMA(60) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M121_R2",
        "name": "SOXX >= SMA(60) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M122",
    "name": "[M122] 글로벌 선행 크로스자산 전술 (SOXX 60일선 상향 시 코스피 85% 집중 / 하향 시 80% 현금 대피)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 60일선 상향 시 코스피 85% 집중 / 하향 시 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M122_R1",
        "name": "SOXX < SMA(60) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M122_R2",
        "name": "SOXX >= SMA(60) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M123",
    "name": "[M123] 글로벌 선행 크로스자산 전술 (SOXX 120일 중기선 기준 반도체 사이클 스위칭)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 120일 중기선 기준 반도체 사이클 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M123_R1",
        "name": "SOXX < SMA(120) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M123_R2",
        "name": "SOXX >= SMA(120) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M124",
    "name": "[M124] 글로벌 선행 크로스자산 전술 (성장 55:45 + SOXX 60일선 선행 매수)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "성장 55:45 + SOXX 60일선 선행 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M124_R1",
        "name": "SOXX < SMA(60) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M124_R2",
        "name": "SOXX >= SMA(60) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M125",
    "name": "[M125] 글로벌 선행 크로스자산 전술 (초방어 35:65 + SOXX 60일선 쉴드)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "초방어 35:65 + SOXX 60일선 쉴드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M125_R1",
        "name": "SOXX < SMA(60) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M125_R2",
        "name": "SOXX >= SMA(60) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M126",
    "name": "[M126] 글로벌 선행 크로스자산 전술 (SOXX 20일선 단기 스나이퍼)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 20일선 단기 스나이퍼",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M126_R1",
        "name": "SOXX < SMA(20) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 20
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      },
      {
        "id": "M126_R2",
        "name": "SOXX >= SMA(20) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 20
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M127",
    "name": "[M127] 글로벌 선행 크로스자산 전술 (고성장 60:40 + SOXX 60일선)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "고성장 60:40 + SOXX 60일선",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M127_R1",
        "name": "SOXX < SMA(60) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M127_R2",
        "name": "SOXX >= SMA(60) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M128",
    "name": "[M128] 글로벌 선행 크로스자산 전술 (SOXX 90일 분기선 스위칭)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 90일 분기선 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M128_R1",
        "name": "SOXX < SMA(90) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 90
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M128_R2",
        "name": "SOXX >= SMA(90) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 90
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M129",
    "name": "[M129] 글로벌 선행 크로스자산 전술 (SOXX 20일 모멘텀 +5% 돌파 매수 / -5% 이탈 매도)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 20일 모멘텀 +5% 돌파 매수 / -5% 이탈 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M129_R1",
        "name": "SOXX ROC(20) <= -5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M129_R2",
        "name": "SOXX ROC(20) >= +5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M130",
    "name": "[M130] 글로벌 선행 크로스자산 전술 (SOXX 40일 ROC +8% 반도체 붐 탑승)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 40일 ROC +8% 반도체 붐 탑승",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M130_R1",
        "name": "SOXX ROC(40) <= -8% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 40
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M130_R2",
        "name": "SOXX ROC(40) >= +8% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 40
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 8
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M131",
    "name": "[M131] 글로벌 선행 크로스자산 전술 (SOXX 20일 ROC 4% 방어형)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 20일 ROC 4% 방어형",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M131_R1",
        "name": "SOXX ROC(20) <= -4% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M131_R2",
        "name": "SOXX ROC(20) >= +4% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 4
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M132",
    "name": "[M132] 글로벌 선행 크로스자산 전술 (SOXX 60일 ROC 10% 대형 사이클)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 60일 ROC 10% 대형 사이클",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M132_R1",
        "name": "SOXX ROC(60) <= -10% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -10
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M132_R2",
        "name": "SOXX ROC(60) >= +10% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 10
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M133",
    "name": "[M133] 글로벌 선행 크로스자산 전술 (SOXX 200일선 장기 추세 필터)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 200일선 장기 추세 필터",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M133_R1",
        "name": "SOXX < SMA(200) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 200
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M133_R2",
        "name": "SOXX >= SMA(200) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 200
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M134",
    "name": "[M134] 글로벌 선행 크로스자산 전술 (보수 35:65 SOXX 모멘텀)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "보수 35:65 SOXX 모멘텀",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M134_R1",
        "name": "SOXX ROC(20) <= -5% 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M134_R2",
        "name": "SOXX ROC(20) >= +5% 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 5
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M135",
    "name": "[M135] 글로벌 선행 크로스자산 전술 (SOXX 60일선 하향 시 전량(100%) 현금화)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 60일선 하향 시 전량(100%) 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M135_R1",
        "name": "SOXX < SMA(60) 반도체 이탈 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 100
        }
      },
      {
        "id": "M135_R2",
        "name": "SOXX >= SMA(60) 반도체 확장 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M136",
    "name": "[M136] 글로벌 선행 크로스자산 전술 (WTI 유가 > $85 돌파 시 무역적자/인플레 대비 70% 현금화 / $70 이하 안정 시 매수)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 유가 > $85 돌파 시 무역적자/인플레 대비 70% 현금화 / $70 이하 안정 시 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M136_R1",
        "name": "WTI > $85 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 85
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M136_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M137",
    "name": "[M137] 글로벌 선행 크로스자산 전술 (WTI 유가 > $90 고유가 충격 80% 현금 대피)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 유가 > $90 고유가 충격 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M137_R1",
        "name": "WTI > $90 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 90
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M137_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M138",
    "name": "[M138] 글로벌 선행 크로스자산 전술 (WTI 유가 > $80 선제적 유가 쇼크 차단)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 유가 > $80 선제적 유가 쇼크 차단",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M138_R1",
        "name": "WTI > $80 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 80
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M138_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M139",
    "name": "[M139] 글로벌 선행 크로스자산 전술 (WTI 유가 > $95 극단 유가쇼크 방어)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 유가 > $95 극단 유가쇼크 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M139_R1",
        "name": "WTI > $95 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 95
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M139_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M140",
    "name": "[M140] 글로벌 선행 크로스자산 전술 (초방어 35:65 + 유가 85달러 방어)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "초방어 35:65 + 유가 85달러 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M140_R1",
        "name": "WTI > $85 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 85
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M140_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M141",
    "name": "[M141] 글로벌 선행 크로스자산 전술 (WTI 60일 급등률 > 25% 오일쇼크 대피)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 60일 급등률 > 25% 오일쇼크 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M141_R1",
        "name": "WTI ROC(60) >= 25% 유가급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 25
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M141_R2",
        "name": "WTI ROC <= -10% 유가안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -10
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M142",
    "name": "[M142] 글로벌 선행 크로스자산 전술 (WTI 40일 ROC > 20% 긴급 매도)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 40일 ROC > 20% 긴급 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M142_R1",
        "name": "WTI ROC(40) >= 20% 유가급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 40
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M142_R2",
        "name": "WTI ROC <= -10% 유가안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 40
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -10
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M143",
    "name": "[M143] 글로벌 선행 크로스자산 전술 (고성장 60:40 + 유가 90달러 방어)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "고성장 60:40 + 유가 90달러 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M143_R1",
        "name": "WTI > $90 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 90
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M143_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M144",
    "name": "[M144] 글로벌 선행 크로스자산 전술 (WTI 20일 급등 15% 단기 오일쇼크 차단)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 20일 급등 15% 단기 오일쇼크 차단",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M144_R1",
        "name": "WTI ROC(20) >= 15% 유가급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 20
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M144_R2",
        "name": "WTI ROC <= -10% 유가안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 20
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -10
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M145",
    "name": "[M145] 글로벌 선행 크로스자산 전술 (유가 85불 & ROC 20% 동시 충격 방어)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "유가 85불 & ROC 20% 동시 충격 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M145_R1",
        "name": "SOXX > SMA(60) AND VIX < 20 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M145_R2",
        "name": "SOXX < SMA(60) OR VIX >= 30 위험 대피",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M146",
    "name": "[M146] 글로벌 선행 크로스자산 전술 (유가 88달러 중립 방어)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "유가 88달러 중립 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M146_R1",
        "name": "WTI > $88 고유가 쇼크 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 88
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M146_R2",
        "name": "WTI <= $72 유가 안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 72
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M147",
    "name": "[M147] 글로벌 선행 크로스자산 전술 (WTI 60일 30% 폭등 슈퍼쇼크 대피)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "WTI 60일 30% 폭등 슈퍼쇼크 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M147_R1",
        "name": "WTI ROC(60) >= 30% 유가급등 매도",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M147_R2",
        "name": "WTI ROC <= -10% 유가안정 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "WTI",
              "transform": "ROC",
              "p1": 60
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": -10
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M148",
    "name": "[M148] 글로벌 선행 크로스자산 전술 (VIX >= 32 패닉 투매 발생 시 저가 분할매수 75% / VIX <= 16 탐욕 시 차익실현)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX >= 32 패닉 투매 발생 시 저가 분할매수 75% / VIX <= 16 탐욕 시 차익실현",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M148_R1",
        "name": "VIX >= 32 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 32
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M148_R2",
        "name": "VIX <= 16 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 16
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M149",
    "name": "[M149] 글로벌 선행 크로스자산 전술 (VIX >= 35 극단적 공포 시 코스피 80% 저점 매집)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX >= 35 극단적 공포 시 코스피 80% 저점 매집",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M149_R1",
        "name": "VIX >= 35 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M149_R2",
        "name": "VIX <= 15 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M150",
    "name": "[M150] 글로벌 선행 크로스자산 전술 (VIX >= 30 공포 매수 / 17 이하 매도)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX >= 30 공포 매수 / 17 이하 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M150_R1",
        "name": "VIX >= 30 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M150_R2",
        "name": "VIX <= 17 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 17
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M151",
    "name": "[M151] 글로벌 선행 크로스자산 전술 (VIX >= 38 역사적 위기 바닥 풀매수 85%)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX >= 38 역사적 위기 바닥 풀매수 85%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M151_R1",
        "name": "VIX >= 38 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 38
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M151_R2",
        "name": "VIX <= 14 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 14
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M152",
    "name": "[M152] 글로벌 선행 크로스자산 전술 (초방어 35:65 + VIX 역발상)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "초방어 35:65 + VIX 역발상",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M152_R1",
        "name": "VIX >= 33 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 33
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M152_R2",
        "name": "VIX <= 15 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 60
        }
      }
    ]
  },
  {
    "id": "M153",
    "name": "[M153] 글로벌 선행 크로스자산 전술 (표준 50:50 VIX 콘트라리언)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "표준 50:50 VIX 콘트라리언",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M153_R1",
        "name": "VIX >= 34 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 34
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M153_R2",
        "name": "VIX <= 16 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 16
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      }
    ]
  },
  {
    "id": "M154",
    "name": "[M154] 글로벌 선행 크로스자산 전술 (VIX 28/18 민감 스윙)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX 28/18 민감 스윙",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M154_R1",
        "name": "VIX >= 28 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 28
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 65
        }
      },
      {
        "id": "M154_R2",
        "name": "VIX <= 18 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 4,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 18
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 55
        }
      }
    ]
  },
  {
    "id": "M155",
    "name": "[M155] 글로벌 선행 크로스자산 전술 (성장 60:40 + VIX 35 패닉 저가매수)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "성장 60:40 + VIX 35 패닉 저가매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M155_R1",
        "name": "VIX >= 35 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M155_R2",
        "name": "VIX <= 15 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 15
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M156",
    "name": "[M156] 글로벌 선행 크로스자산 전술 (VIX 40 세기적 폭락장 스나이퍼)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX 40 세기적 폭락장 스나이퍼",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M156_R1",
        "name": "VIX >= 40 공포 투매 저가 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 40
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M156_R2",
        "name": "VIX <= 14 탐욕 구간 차익실현",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 14
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M157",
    "name": "[M157] 글로벌 선행 크로스자산 전술 (SOXX 60일선 돌파 AND VIX < 20 평온기 코스피 집중)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 60일선 돌파 AND VIX < 20 평온기 코스피 집중",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M157_R1",
        "name": "SOXX > SMA(60) AND VIX < 20 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M157_R2",
        "name": "SOXX < SMA(60) OR VIX >= 30 위험 대피",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M158",
    "name": "[M158] 글로벌 선행 크로스자산 전술 (SOXX 반도체 상승 AND 저유가 안정기 매수)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 반도체 상승 AND 저유가 안정기 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M158_R1",
        "name": "SOXX > SMA(60) AND VIX < 20 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M158_R2",
        "name": "SOXX < SMA(60) OR VIX >= 30 위험 대피",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M159",
    "name": "[M159] 글로벌 선행 크로스자산 전술 (VIX 32 공포 + 반도체 반등 쌍끌이 매수)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "VIX 32 공포 + 반도체 반등 쌍끌이 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M159_R1",
        "name": "SOXX > SMA(60) AND VIX < 20 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M159_R2",
        "name": "SOXX < SMA(60) OR VIX >= 30 위험 대피",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M160",
    "name": "[M160] 글로벌 선행 크로스자산 전술 (SOXX 60일선 + WTI 90불 크로스 자산 필터)",
    "category": "Group D: 미국 반도체(SOXX) · 유가 · VIX 선행",
    "rationale": "SOXX 60일선 + WTI 90불 크로스 자산 필터",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M160_R1",
        "name": "SOXX > SMA(60) AND VIX < 20 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M160_R2",
        "name": "SOXX < SMA(60) OR VIX >= 30 위험 대피",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M161",
    "name": "[M161] 다중 매크로 앙상블 (환율 60일선 돌파 OR T10Y2Y 스티프닝 OR VIX 32 폭등 시 3중 위기 감지 75% 현금화)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "환율 60일선 돌파 OR T10Y2Y 스티프닝 OR VIX 32 폭등 시 3중 위기 감지 75% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M161_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0 OR VIX >= 32 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 32
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M161_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M162",
    "name": "[M162] 다중 매크로 앙상블 (3중 위기 카나리아 80% 현금 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "3중 위기 카나리아 80% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M162_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0.1 OR VIX >= 35 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.1
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M162_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M163",
    "name": "[M163] 다중 매크로 앙상블 (방어 40:60 + 3중 위기 감지 85% 현금화)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "방어 40:60 + 3중 위기 감지 85% 현금화",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M163_R1",
        "name": "환율 > SMA(120) OR T10Y2Y >= 0 OR VIX >= 30 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M163_R2",
        "name": "환율 < SMA(120) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M164",
    "name": "[M164] 다중 매크로 앙상블 (성장 55:45 + 3중 위기 감지)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "성장 55:45 + 3중 위기 감지",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M164_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0 OR VIX >= 35 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M164_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M165",
    "name": "[M165] 다중 매크로 앙상블 (초방어 35:65 + 3중 위기 90% 현금 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "초방어 35:65 + 3중 위기 90% 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M165_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0 OR VIX >= 30 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M165_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M166",
    "name": "[M166] 다중 매크로 앙상블 (3중 위기 표준 80% 스위칭)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "3중 위기 표준 80% 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M166_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0.2 OR VIX >= 34 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.2
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 34
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M166_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M167",
    "name": "[M167] 다중 매크로 앙상블 (3중 위기 밸런스 75%)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "3중 위기 밸런스 75%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M167_R1",
        "name": "환율 > SMA(90) OR T10Y2Y >= 0.05 OR VIX >= 33 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 90
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 33
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M167_R2",
        "name": "환율 < SMA(90) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 90
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M168",
    "name": "[M168] 다중 매크로 앙상블 (고성장 60:40 + 3중 위기 85% 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "고성장 60:40 + 3중 위기 85% 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M168_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0 OR VIX >= 36 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 36
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M168_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M169",
    "name": "[M169] 다중 매크로 앙상블 (3중 위기 발생 시 전량(100%) 현금 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "3중 위기 발생 시 전량(100%) 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M169_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0 OR VIX >= 40 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 40
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 100
        }
      },
      {
        "id": "M169_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M170",
    "name": "[M170] 다중 매크로 앙상블 (저낙폭 40:60 3중 위기)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "저낙폭 40:60 3중 위기",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M170_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0.15 OR VIX >= 32 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.15
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 32
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M170_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M171",
    "name": "[M171] 다중 매크로 앙상블 (3중 위기 민감형 포착)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "3중 위기 민감형 포착",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M171_R1",
        "name": "환율 > SMA(30) OR T10Y2Y >= 0 OR VIX >= 28 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 30
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 28
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      },
      {
        "id": "M171_R2",
        "name": "환율 < SMA(30) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 5,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 30
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 70
        }
      }
    ]
  },
  {
    "id": "M172",
    "name": "[M172] 다중 매크로 앙상블 (3중 위기 표준형)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "3중 위기 표준형",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M172_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0 OR VIX >= 30 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 30
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M172_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M173",
    "name": "[M173] 다중 매크로 앙상블 (초방어 장기 3중 위기)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "초방어 장기 3중 위기",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M173_R1",
        "name": "환율 > SMA(120) OR T10Y2Y >= 0 OR VIX >= 35 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M173_R2",
        "name": "환율 < SMA(120) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M174",
    "name": "[M174] 다중 매크로 앙상블 (성장 55:45 3중 위기)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "성장 55:45 3중 위기",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M174_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0.1 OR VIX >= 33 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.1
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 33
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M174_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M175",
    "name": "[M175] 다중 매크로 앙상블 (골드스탠다드 3중 위기)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "골드스탠다드 3중 위기",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M175_R1",
        "name": "환율 > SMA(60) OR T10Y2Y >= 0.05 OR VIX >= 35 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "T10Y2Y",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 0.05
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 35
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M175_R2",
        "name": "환율 < SMA(60) AND VIX < 20 위기 종료 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "VIX",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "VALUE",
            "rightValue": 20
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M176",
    "name": "[M176] 다중 매크로 앙상블 (CLI > 100 AND SOXX > 60일선 AND 환율 < 60일선 골디락스 3중 일치 시 코스피 85% 풀매집)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "CLI > 100 AND SOXX > 60일선 AND 환율 < 60일선 골디락스 3중 일치 시 코스피 85% 풀매집",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M176_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M176_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M177",
    "name": "[M177] 다중 매크로 앙상블 (골디락스 3중 확인 코스피 90% 집중 / 악화 시 85% 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "골디락스 3중 확인 코스피 90% 집중 / 악화 시 85% 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M177_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M177_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M178",
    "name": "[M178] 다중 매크로 앙상블 (방어 40:60 중기 골디락스 엔진)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "방어 40:60 중기 골디락스 엔진",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M178_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 120
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M178_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M179",
    "name": "[M179] 다중 매크로 앙상블 (성장 55:45 골디락스 85% 집중)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "성장 55:45 골디락스 85% 집중",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M179_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M179_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M180",
    "name": "[M180] 다중 매크로 앙상블 (초방어 35:65 골디락스 90% 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "초방어 35:65 골디락스 90% 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M180_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M180_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      }
    ]
  },
  {
    "id": "M181",
    "name": "[M181] 다중 매크로 앙상블 (엄격한 골디락스 85% 스위칭)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "엄격한 골디락스 85% 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M181_R1",
        "name": "CLI >= 100.2 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100.2
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M181_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M182",
    "name": "[M182] 다중 매크로 앙상블 (고성장 60:40 골디락스 95% 풀베팅)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "고성장 60:40 골디락스 95% 풀베팅",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M182_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 95
        }
      },
      {
        "id": "M182_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M183",
    "name": "[M183] 다중 매크로 앙상블 (민감 골디락스 스위칭)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "민감 골디락스 스위칭",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M183_R1",
        "name": "CLI >= 99.8 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 99.8
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M183_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M184",
    "name": "[M184] 다중 매크로 앙상블 (장기 추세 골디락스 엔진)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "장기 추세 골디락스 엔진",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M184_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 200
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M184_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 10,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M185",
    "name": "[M185] 다중 매크로 앙상블 (밸런스 40:60 골디락스)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "밸런스 40:60 골디락스",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M185_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M185_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M186",
    "name": "[M186] 다중 매크로 앙상블 (분기 골디락스 80%)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "분기 골디락스 80%",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M186_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 9,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 90
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 90
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M186_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 9,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 90
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M187",
    "name": "[M187] 다중 매크로 앙상블 (확실한 골디락스 확장)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "확실한 골디락스 확장",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M187_R1",
        "name": "CLI >= 100.5 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100.5
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M187_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M188",
    "name": "[M188] 다중 매크로 앙상블 (보수 35:65 골디락스)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "보수 35:65 골디락스",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M188_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M188_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M189",
    "name": "[M189] 다중 매크로 앙상블 (단중기 골디락스 스위퍼)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "단중기 골디락스 스위퍼",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M189_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 40
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 40
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M189_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 40
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M190",
    "name": "[M190] 다중 매크로 앙상블 (골디락스 이탈 시 전량(100%) 현금 대피)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "골디락스 이탈 시 전량(100%) 현금 대피",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M190_R1",
        "name": "CLI >= 100 AND SOXX > SMA AND 환율 < SMA 골디락스 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "SOXX",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "SOXX",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M190_R2",
        "name": "CLI < 100 OR 환율 > SMA 악화 시 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "KOR_CLI",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "VALUE",
            "rightValue": 100
          },
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 100
        }
      }
    ]
  },
  {
    "id": "M191",
    "name": "[M191] 다중 매크로 앙상블 (환율 60일선 아래 AND 코스피 60일선 위 듀얼 상승 시 매수 / 환율 급등 시 매도)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "환율 60일선 아래 AND 코스피 60일선 위 듀얼 상승 시 매수 / 환율 급등 시 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M191_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M191_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M192",
    "name": "[M192] 다중 매크로 앙상블 (T10Y2Y 정상화 침체 경보 OR 코스피 60일선 데드크로스 동반 매도)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "T10Y2Y 정상화 침체 경보 OR 코스피 60일선 데드크로스 동반 매도",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M192_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M192_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M193",
    "name": "[M193] 다중 매크로 앙상블 (CLI 100 + 코스피 120일 경기선 듀얼 방어)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "CLI 100 + 코스피 120일 경기선 듀얼 방어",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M193_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M193_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 120
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M194",
    "name": "[M194] 다중 매크로 앙상블 (미국 반도체 60일선 + 코스피 60일선 듀얼 모멘텀)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "미국 반도체 60일선 + 코스피 60일선 듀얼 모멘텀",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 55
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M194_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      },
      {
        "id": "M194_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M195",
    "name": "[M195] 다중 매크로 앙상블 (초방어 35:65 환율-수급선 듀얼 쉴드)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "초방어 35:65 환율-수급선 듀얼 쉴드",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 35
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M195_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M195_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 75
        }
      }
    ]
  },
  {
    "id": "M196",
    "name": "[M196] 다중 매크로 앙상블 (트리플 하이브리드 (환율 + 반도체 + 코스피 60일선))",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "트리플 하이브리드 (환율 + 반도체 + 코스피 60일선)",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M196_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M196_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  },
  {
    "id": "M197",
    "name": "[M197] 다중 매크로 앙상블 (금리차 + 반도체 + 코스피 60일선 앙상블)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "금리차 + 반도체 + 코스피 60일선 앙상블",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 45
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M197_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      },
      {
        "id": "M197_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 7,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M198",
    "name": "[M198] 다중 매크로 앙상블 (고성장 60:40 듀얼 모멘텀 90% 매수)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "고성장 60:40 듀얼 모멘텀 90% 매수",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 60
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M198_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M198_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 6,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      }
    ]
  },
  {
    "id": "M199",
    "name": "[M199] 다중 매크로 앙상블 (CLI + 환율 + 수급선 4중 앙상블)",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "CLI + 환율 + 수급선 4중 앙상블",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 40
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M199_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      },
      {
        "id": "M199_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 80
        }
      }
    ]
  },
  {
    "id": "M200",
    "name": "[M200] 다중 매크로 앙상블 (궁극의 매크로 앙상블 챔피언 (CLI+SOXX+일드커브))",
    "category": "Group E: 다중 매크로 앙상블 & 위기 복합 감지",
    "rationale": "궁극의 매크로 앙상블 챔피언 (CLI+SOXX+일드커브)",
    "allocations": [
      {
        "ticker": "KPI200",
        "weightPct": 50
      }
    ],
    "rebalanceEnabled": true,
    "rebalance": {
      "periodMode": "QUARTERLY",
      "bandMode": "ABS_PP",
      "bandThreshold": 6,
      "customDays": 60
    },
    "rulesEnabled": true,
    "rules": [
      {
        "id": "M200_R1",
        "name": "환율 > SMA OR 코스피 < SMA 매도",
        "enabled": true,
        "logic": "OR",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "SELL",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 90
        }
      },
      {
        "id": "M200_R2",
        "name": "환율 < SMA AND 코스피 >= SMA 매수",
        "enabled": true,
        "logic": "AND",
        "cooldownDays": 8,
        "conditions": [
          {
            "left": {
              "ticker": "USDKRW",
              "transform": "PRICE"
            },
            "operator": "<",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "USDKRW",
              "transform": "SMA",
              "p1": 60
            }
          },
          {
            "left": {
              "ticker": "KPI200",
              "transform": "PRICE"
            },
            "operator": ">=",
            "rightMode": "INDICATOR",
            "rightIndicator": {
              "ticker": "KPI200",
              "transform": "SMA",
              "p1": 60
            }
          }
        ],
        "action": {
          "targetTicker": "KPI200",
          "type": "BUY",
          "sizingMode": "BALANCE_PCT",
          "sizingValue": 85
        }
      }
    ]
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STRATEGIES_KOSPI_MACRO_200, kAlloc, reb };
}
