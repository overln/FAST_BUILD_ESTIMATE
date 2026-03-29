# FAST_BUILD_ESTIMATE

FAST_BUILD_ESTIMATE 是一个住宅内装估算工具，用于快速估算墙面面积、天花面积，以及 `GIB`、`Stopping`、`Painting` 和总价区间。

## 工具用途

这个工具适合在项目早期做预算参考，帮助用户根据房屋基础信息快速得到一个大致的工程量和价格范围。

## 输入项

用户输入：

- `floor_area_m2`
  房屋建筑面积
- `external_wall_length_m`
  外墙长度
- `building_type`
  建筑类型，可选：
  `detached_house` / `townhouse` / `duplex`
- `bathrooms`
  卫生间数量，可选：
  `1` / `2` / `3_plus`
- `finish_level`
  装修档次，可选：
  `basic` / `standard` / `high_end`

## 输出项

系统会输出：

- `External Wall Area`
- `Internal Wall Area`
- `Total Wall Area`
- `Ceiling Area`
- `GIB` 的 `Low / Mid / High`
- `Stopping` 的 `Low / Mid / High`
- `Painting` 的 `Low / Mid / High`
- `Total` 的 `Low / Mid / High`

## Settings 参数说明

### 1. Building

- `wall_height`
  墙高，用于计算外墙面积
- `storey_factor`
  层数系数，用于把外墙长度换算成实际外墙施工面积

### 2. Internal Wall Factor

- `detached_house`
  独立住宅的内墙系数
- `townhouse`
  联排住宅的内墙系数
- `duplex`
  双拼住宅的内墙系数

说明：
建筑类型不同，内部隔墙复杂度不同，因此对应不同的内墙面积系数。

### 3. Rates

GIB：

- `gib_wall_rate`
  墙面 GIB 单价
- `gib_ceiling_rate`
  天花 GIB 单价

Stopping：

- `stopping_wall_rate`
  墙面批荡/找平单价
- `stopping_ceiling_rate`
  天花批荡/找平单价

Painting：

- `paint_wall_rate`
  墙面油漆单价
- `paint_ceiling_rate`
  天花油漆单价

说明：
墙面和天花单价分开设置，方便后续独立调整。

### 4. Finish

- `basic`
  基础装修系数
- `standard`
  标准装修系数
- `high_end`
  高端装修系数

说明：
装修档次越高，价格系数越高。

### 5. Wet Area

- `1`
  1 个卫生间时的湿区价格系数
- `2`
  2 个卫生间时的湿区价格系数
- `3_plus`
  3 个及以上卫生间时的湿区价格系数

说明：
`bathrooms` 不参与面积计算，只用于价格调整。

### 6. Range

- `low_factor`
  低位报价系数
- `high_factor`
  高位报价系数

说明：
系统会先算出 `Mid`，再通过这两个系数推导 `Low` 和 `High`。

## 计算方法

### 一、默认外墙长度

如果用户没有手动覆盖外墙长度，系统可按以下方式自动推算：

`default_external_wall_length_m = 4 × sqrt(floor_area_m2)`

### 二、面积计算

1. 外墙面积

`external_wall_area = external_wall_length_m × wall_height × storey_factor`

2. 内墙面积

先根据 `building_type` 读取对应的 `internal wall factor`：

- `detached_house`
- `townhouse`
- `duplex`

然后计算：

`internal_wall_area = external_wall_area × internal_wall_factor`

3. 墙面总面积

`wall_area = external_wall_area + internal_wall_area`

4. 天花面积

`ceiling_area = floor_area_m2`

### 三、价格计算

先根据 `finish_level` 读取装修系数：

- `basic`
- `standard`
- `high_end`

再根据 `bathrooms` 读取湿区价格系数：

- `1`
- `2`
- `3_plus`

#### GIB

`gib_mid = (wall_area × gib_wall_rate + ceiling_area × gib_ceiling_rate) × finish_factor × wet_area_factor`

#### Stopping

`stopping_mid = (wall_area × stopping_wall_rate + ceiling_area × stopping_ceiling_rate) × finish_factor × wet_area_factor`

#### Painting

`paint_mid = (wall_area × paint_wall_rate + ceiling_area × paint_ceiling_rate) × finish_factor × wet_area_factor`

### 四、区间计算

每个项目都会先计算 `Mid`，然后得到区间：

- `low = mid × low_factor`
- `high = mid × high_factor`

所以最终会得到：

- `gib.low / gib.mid / gib.high`
- `stopping.low / stopping.mid / stopping.high`
- `paint.low / paint.mid / paint.high`

### 五、总价计算

- `total.low = gib.low + stopping.low + paint.low`
- `total.mid = gib.mid + stopping.mid + paint.mid`
- `total.high = gib.high + stopping.high + paint.high`

## 使用说明

1. 输入房屋面积、外墙长度、建筑类型、卫生间数量和装修档次。
2. 查看右侧的面积结果和价格区间。
3. 如需调整估算规则，可进入 `Settings` 页面修改参数。
4. 保存后，新的参数会立即影响估算结果。

## 说明

- 这是预算参考工具，不是最终报价单。
- 工程师可根据项目经验调整参数，以适配不同地区、标准和施工条件。
