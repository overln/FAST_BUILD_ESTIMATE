# Calibration System

这个目录是本地校准工具，用于建立“估算 -> 实际 -> 修正”的闭环。

工具使用：

- `Python`
- `pandas`
- 输入文件：`CSV`
- 输出文件：`CSV` / `JSON`

## 目录结构

```text
calibration/
├── README.md
├── requirements.txt
├── calibrate.py
├── input/
│   ├── projects.sample.csv
│   └── current_config.sample.json
└── output/
```

## 作用

这个工具读取：

1. 当前参数配置 `JSON`
2. 历史项目数据 `CSV`

然后输出：

1. 每个项目的估算结果和误差明细
2. 按装修档次、intertenancy、面积段分组后的误差汇总
3. 一份建议参数 `recommended_config.json`

## 安装

使用 `uv` 创建并管理虚拟环境：

```bash
uv venv
source .venv/bin/activate
uv sync --project calibration
```

## 输入文件

### 1. 配置文件

示例文件：

`calibration/input/current_config.sample.json`

结构与前端 `Settings` 配置一致，包括：

- `wallFactor`
- `paintFactor`
- `fixing`
- `stoppingBreakdown`
- `externalCorner`
- `rates`
- `range`

### 2. 项目数据

示例文件：

`calibration/input/projects.sample.csv`

支持的主要字段：

- `project_name`
- `floor_area`
- `finish_level`
- `intertenancy_wall`
- `actual_total`

可选字段：

- `render_area`
- `actual_wall_area`
- `actual_paint_area`
- `actual_fixing_area`
- `actual_square_stop_length`
- `actual_external_corner_length`
- `actual_fixing`
- `actual_stopping`
- `actual_square_stop`
- `actual_corner`
- `actual_paint`
- `actual_render`
- `include_fixing`
- `include_stopping`
- `include_square_stop`
- `include_corner`
- `include_paint`
- `include_render`

说明：

- 只有 `actual_total` 时，也可以做总价误差分析和区间校准
- `finish_level` 必须是 `simple`、`standard` 或 `complex`
- `intertenancy_wall` 必须是 `yes` 或 `no`
- 如果提供 `actual_wall_area`，可以更好地反推 `wallFactor`
- 如果提供 `actual_paint_area`，可以更好地反推 `paintFactor`
- 如果提供各工种实际金额，可以更好地校准各项单价
- 如果某个报价范围不包含某个工种，把对应 `include_*` 填成 `no`，该工种会从总价校准里排除
- 样本数少于 8 条时，工具不会自动推荐 `wallFactor`、`paintFactor`、长度系数、intertenancy 系数或报价区间，避免少量正式报价把默认模型拉歪

## 运行

```bash
uv run --project calibration python calibration/calibrate.py \
  --projects calibration/input/projects.sample.csv \
  --config calibration/input/current_config.sample.json \
  --output calibration/output
```

## 输出文件

运行后会生成：

- `project_report.csv`
  每个项目的估算值、实际值、误差率
- `group_summary.csv`
  按装修档次、intertenancy、面积段分组的误差汇总
- `recommended_config.json`
  根据历史样本推导出的建议参数

## 校准逻辑

### 1. 面积参数

- `wallFactor`
  如果有 `actual_wall_area`，按 `finish_level` 反推建议值
- `paintFactor`
  如果有 `actual_paint_area`，按 `finish_level` 反推建议值
- `intertenancy_multiplier`
  如果有 `actual_fixing_area`，按 intertenancy 项目反推建议值
- `square_stop_factor` / `external_corner_factor`
  如果有对应实际长度，按 `floor_area` 反推建议值

这些面积和长度参数至少需要 8 条有效样本才会自动生成新建议；样本不足时保留当前配置。

### 2. 单价

- `fixing_rate`
- `stopping_rate`
- `square_stop_rate`
- `corner_rate`
- `paint_rate`
- `render_rate`

如果有各项实际金额，会按当前估算面积或长度回推建议单价。

`render_rate` 会忽略只触发最低收费的样本，避免把最低收费误当成每平米单价。

### 3. Range 系数

根据历史项目中：

`actual_total / estimated_total_mid`

的分布，计算建议的：

- `low_factor`
- `high_factor`

默认取 10% 分位数和 90% 分位数。

区间系数至少需要 8 条有效总价样本才会自动生成新建议；样本不足时保留当前配置。

## 注意

- 这是“建议参数生成器”，不是自动上线工具
- 推荐做法是：先看 `recommended_config.json`，人工审核后，再手动更新线上参数
- 样本量太少时，建议不要直接采用所有推荐值，优先看总价误差和工种单价是否合理
