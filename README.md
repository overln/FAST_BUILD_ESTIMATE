# FAST_BUILD_ESTIMATE

`FAST_BUILD_ESTIMATE` 是一个面向住宅内装早期报价的极简估算工具。

当前版本聚焦于 `V1.0 AI 报价系统逻辑（简化版）`，只接受少量输入，快速估算以下项目：

- `fixing`
- `stopping`
- `square stop`
- `external corner`
- `painting`
- `render`

系统目标不是替代正式报价，而是在项目早期给出一个结构清晰、可解释、可快速调整的参考范围。

## 1. 详细使用方法

### 1.1 安装与启动

安装前端依赖：

```bash
npm install
```

启动本地开发环境：

```bash
npm run dev
```

生成生产版本：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

### 1.2 当前页面输入

当前 app 主页面接受以下输入：

1. `floor_area`
   内部建筑面积。
   页面提示为：`Use internal floor area / 使用室内建筑面积`

2. `finish_level`
   装修复杂度等级，可选：
   - `simple`
   - `standard`
   - `complex`

3. `intertenancy_wall`
   是否存在分户双层墙，可选：
   - `yes`
   - `no`

4. `external_corner_type`
   外角处理类型，可选：
   - `standard`
   - `premium`

5. `render_area`
   可选输入。
   注意：`render_area` 不参与油漆面积计算，只单独计价。

### 1.3 当前计算逻辑

#### 基础面积

```text
ceiling_area = floor_area
```

`wall_factor` 默认值：

- `simple = 2.5`
- `standard = 2.65`
- `complex = 2.85`

```text
wall_area = floor_area × wall_factor
```

#### Fixing / Stopping

默认：

```text
fixing_area = wall_area
stopping_area = wall_area
```

如果 `intertenancy_wall = yes`：

```text
fixing_area = wall_area × 1.12
stopping_area = wall_area
```

说明：

- 双层板只影响 `fixing`
- 不影响 `stopping`

#### Stopping Breakdown

```text
square_stop_length = floor_area × 1.0
external_corner_length = floor_area × 0.30
```

`external_corner_type` 规则：

- `standard`：使用基础 `corner_rate`
- `premium`：只在基础 `corner_rate` 上增加 `premium_add_rate`，不再使用隐藏倍数放大

#### Painting

`paint_factor` 默认值：

- `simple = 1.10`
- `standard = 1.14`
- `complex = 1.20`

```text
paint_area = (wall_area + ceiling_area) × paint_factor
```

说明：

`paint_factor` 默认已经吸收以下零碎项目：

- doors
- skirting
- window reveals
- trims

因此当前版本不再单独拆分这些输入。

#### Render

```text
render_area = user input
```

注意：

- `render_area` 不参与 `paint_area`
- 只按 `render_rate` 单独计价

#### 报价结构

```text
total_price =
  fixing_area × fixing_rate
  + stopping_area × stopping_rate
  + square_stop_length × square_stop_rate
  + external_corner_length × corner_rate
  + paint_area × paint_rate
  + render_area × render_rate
```

系统输出 `low / mid / high` 三档区间。

### 1.4 Settings 页面怎么用

`Settings` 页面用于选择报价预设和做 PDF 摘要检查，适合工程负责人或报价负责人统一控制工具行为。

当前页面提供：

- `Balanced`、`Conservative`、`Aggressive` 三个报价预设
- 当前内部单价和报价区间摘要
- PDF 上传后的报价摘要检查
- 重置和保存本地配置

使用方式：

1. 在主页面点击 `Settings`
2. 选择报价预设，或上传 PDF 做摘要检查
3. 点击 `Save`
4. 返回主页面查看结果变化

参数保存在浏览器 `localStorage` 中，只影响当前浏览器本地。

正式报价的参数拟合不在网页里直接自动完成。推荐继续把报价明细整理为结构化 CSV，再运行 `calibration` 工具生成建议参数并人工审核。

### 1.5 校准工具怎么用

项目带有一个本地校准工具，用于把历史项目数据转成建议参数。

安装依赖：

```bash
uv sync --project calibration
```

运行校准：

```bash
uv run --project calibration python calibration/calibrate.py \
  --projects calibration/input/projects.sample.csv \
  --config calibration/input/current_config.sample.json \
  --output calibration/output
```

输出文件：

- `calibration/output/project_report.csv`
- `calibration/output/group_summary.csv`
- `calibration/output/recommended_config.json`

如果原始数据在 PDF 中，可以先用本地工具抽文本，例如：

```bash
brew install poppler
pdftotext -layout "/path/to/file.pdf" output.txt
```

再人工整理进 CSV。

## 2. 现在的能力边界

当前版本能力边界很明确。

### 2.1 当前能做的事

- 用 4 到 5 个输入快速给出早期报价区间
- 输出各工种的面积、长度和单项价格
- 通过 `Settings` 快速调整系数与单价
- 用 CSV 历史数据做半自动参数校准
- 用 `low / mid / high` 表达偏保守的报价区间

### 2.2 当前不能做的事

- 不能读取图纸自动算量
- 不能直接理解 PDF 内容并自动生成最终结构化报价，仍需要文本抽取和人工整理
- 不能稳定估算所有门、窗、踢脚线、五金、外墙、材料供应、P&G 等完整报价项
- 不能只靠现有数据自动判断 `finish_level`
- 不能只靠现有数据自动判断 `intertenancy_wall`
- 不能只靠现有数据自动判断 `external_corner_type`
- 不能把历史整单 `Proposal Total` 直接拿来做当前简化模型的可靠校准

### 2.3 为什么有这些边界

因为当前 app 是一个刻意简化的模型。

它的核心设计原则是：

1. 输入极简
2. 不读图纸
3. 不拆过多细项
4. 用系数吸收复杂度
5. 默认值偏保守

这意味着它适合“快速参考”，不适合“完整施工预算还原”。

## 3. 现在的数据拟合情况

### 3.1 当前已经做过的数据整理

目前已经从以下 3 份 PDF 中抽取文本并整理为 CSV 样本：

- `Dan Allison.pdf`
- `Dash Build.pdf`
- `New Boots & Partner Ltd.pdf`

相关文件：

- PDF 抽取文本：`calibration/input/pdf_text/`
- 样本 CSV：`calibration/input/projects.sample.csv`

### 3.2 现阶段能拟合的部分

基于现有数据，当前更适合拟合这些数值参数：

- `fixing_rate`
- `stopping_rate`
- `square_stop_rate`
- `corner_rate`
- `paint_rate`

这些参数与历史明细金额之间的关系相对直接。

`range.low_factor / range.high_factor` 也可以由历史总价误差辅助校准，但至少需要 8 条有效样本；样本不足时保持当前默认区间。

### 3.3 现阶段不能可靠拟合的部分

以下字段目前不能只靠现有样本稳定自动拟合：

- `finish_level`
- `intertenancy_wall`
- `external_corner_type`
- `render_rate`
- `paintFactor`
- `wallFactor`
- 面积段折扣或加价系数
- 报价区间系数

原因：

- 样本量太少，目前只有 3 个主要样本
- PDF 报价口径不一致
- 很多标签不是原始显式字段，而是人工判断字段
- 某些项目包含 app 当前没有建模的费用项目

### 3.4 当前已经做出的参数调整

根据现有样本，项目已经把默认工种单价先调整到一个更贴近样本的阶段性版本：

- `fixing_rate = 42`
- `stopping_rate = 20`
- `square_stop_rate = 9`
- `corner_rate = 25`
- `paint_rate = 19`
- `range.low_factor = 0.85`
- `range.high_factor = 1.6`

这些值不是“最终最优值”，而是结合样本和模型边界后的阶段性版本。

默认面积段系数目前保持为 `1`。面积段仍用于校准报告分组观察，但不会在主 app 中隐藏地把某一面积段打折或加价。

## 4. 现在存在的问题以及解决方法

### 4.1 问题一：历史报价和 app 模型口径不一致

现有 PDF 报价通常包含：

- GIB supply
- doors / skirting / trims
- exterior painting / staining
- non-measured costs / P&G
- 特殊 stopping 项目

但当前 app 只估：

- fixing
- stopping
- square stop
- external corner
- paint
- render

这会导致如果直接用整单 `Proposal Total` 做拟合，模型会被拉歪。

解决方法：

1. 校准时只使用 app 当前可估范围内的金额
2. 对超出当前模型的项目单独排除
3. 在 CSV 中用 `include_*` 字段控制某工种是否参与总价校准

### 4.2 问题二：标签字段缺失

当前数据里，很多关键输入并没有结构化保存：

- `finish_level`
- `intertenancy_wall`
- `external_corner_type`

这会导致输入结构虽然正确，但历史数据不能直接自动学习这些标签。

解决方法：

1. 在历史项目 CSV 中补充这些字段
2. 由熟悉报价逻辑的人手动标注
3. 先做“人工补标签 + 自动回推参数”的半自动流程

建议新增的最小字段：

```csv
floor_area,finish_level,intertenancy_wall,external_corner_type,render_area
```

### 4.3 问题三：样本量不足

当前只有少量样本，无法稳定拟合：

- `paintFactor`
- `wallFactor`
- `premium_add_rate`
- `render_rate`
- 不同复杂度层级之间的边界

解决方法：

1. 每个等级至少累计 10 到 20 个项目
2. `intertenancy_wall = yes` 需要单独积累样本
3. `premium external corner` 也需要单独积累样本
4. 把工种明细金额尽量保留下来，而不是只保留总价

### 4.4 问题四：某些因子被用来吸收太多业务差异

例如 `paintFactor` 当前同时在吸收：

- 墙面和天花关系
- 门和踢脚线
- reveals / trims
- 项目复杂度

这让拟合结果很容易失真。

解决方法：

1. 短期：继续保留简化模型，但不要过度自动调整 `paintFactor`
2. 中期：把零碎 paint 附加项拆成可选系数或固定附加率
3. 长期：按真实报价结构拆更细的子模块

### 4.5 问题五：当前模型适合早期估算，不适合完整报价复刻

当前系统擅长的是“快速、可解释、可调”，而不是“完整明细复刻”。

解决方法有两条路线：

1. 保持当前极简输入模型
   - 继续用于早期预算和快速筛选
   - 强化 CSV 校准流程

2. 升级成更完整的报价模型
   - 新增 door / skirting / trims / exterior / supply / P&G 等模块
   - 让历史整单报价更容易对齐系统输出

## 5. 推荐的下一步

### 路线 A：保持 V1.0 极简模型

适合当前阶段，建议：

1. 继续积累历史项目
2. 强制补齐输入标签
3. 只校准当前模型覆盖到的工种
4. 定期人工审核 `recommended_config.json`

### 路线 B：进入 V1.1

如果你希望更接近真实报价单，建议在下一版加入：

1. door / skirting / trims 模块
2. exterior scope 模块
3. supply / P&G 的处理方式
4. 可选的项目范围开关

## 6. 当前结论

当前系统已经具备：

- 极简输入
- 快速估算
- 可配置参数
- 初步校准能力

但还没有达到：

- 全自动数据拟合
- 完整报价复刻
- 用少量 PDF 样本稳定学习所有输入标签

最现实的工作方式是：

`人工补标签 + 自动回推数值参数 + 人工审核上线`

这也是当前版本最稳妥、最实用的使用方式。
