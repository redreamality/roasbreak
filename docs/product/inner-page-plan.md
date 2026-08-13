# ROAS Break 内页规划

> 日期：2026-08-13  
> 状态：产品规划，尚未进入实现  
> 前置研究：[`docs/research/ecommerce-roas-product-opportunities.md`](../research/ecommerce-roas-product-opportunities.md)

## 1. 规划目标

ROAS Break 的首页继续承担核心任务：用最少输入计算首单盈亏平衡 ROAS。内页不应只是为了增加页面数量，而要承接首页之后的下一步经营决策。

内页体系要完成三件事：

1. 把盈亏线转换成可以用于投放的利润目标。
2. 告诉经营者哪些变量最值得调整，以及调整后的结果。
3. 用准确的口径说明解决计算中的疑问，并把用户送回对应工具完成任务。

建议的决策链：

```text
首页：我的盈亏线是多少？
  -> 目标页：为了保留利润，ROAS / CPA / ACoS 应设多少？
  -> 杠杆页：AOV、成本、折扣、退货中，改什么最有效？
  -> 场景页：促销、商品或预算方案之间，哪个结果更好？
  -> 生命周期页：首单亏损时，复购能否回本？
```

## 2. 页面分层

### 2.1 核心工具页

工具页必须让用户完成一个独立决策，拥有不同的输入、计算结果和下一动作。

| 页面 | 用户问题 | 产品角色 |
|---|---|---|
| `/` | 我的广告最低需要多少 ROAS 才不亏？ | 首单盈亏入口 |
| `/target-roas-calculator/` | 为了保留目标利润，我应该设置多少 ROAS、CPA 或 ACoS？ | 投放目标转换 |
| `/profit-lever-calculator/` | 改哪个经营变量最能提高可承受获客成本？ | 经营动作排序 |
| `/promotion-profit-calculator/` | 折扣、满减、免邮需要带来多少增量才值得？ | 促销决策 |
| `/cac-payback-calculator/` | 首单亏损能否由复购收回，多久回本？ | 新客生命周期决策 |
| `/scenario-planner/` | 多个商品、渠道或预算方案哪个更优？ | 多场景比较 |

### 2.2 知识页

知识页负责解释容易导致错误计算的口径，不单独复制完整计算器。每页应有明确的“回到哪个工具验证”的动作。

| 页面 | 核心问题 | 主要承接工具 |
|---|---|---|
| `/guides/contribution-margin-vs-gross-margin/` | 为什么 gross margin 不能直接代表广告预算？ | 首页、目标页 |
| `/guides/roas-vs-acos/` | ROAS 与 ACoS 如何互换，分别在哪个平台使用？ | 目标页 |
| `/guides/attributed-roas-vs-mer/` | 平台归因 ROAS 与店铺整体 MER 为什么不同？ | 首页、后续归因检查 |
| `/guides/ecommerce-revenue-basis/` | AOV、gross sales、net sales、total sales 应使用哪个？ | 所有工具页 |
| `/guides/returns-and-discounts/` | 折扣、退款、退货成本为什么不能混成一个数字？ | 杠杆页、促销页 |

### 2.3 聚合页

首批不单独建设营销式落地页。工具达到三个以上后再增加 `/tools/`，知识页达到四个以上后再增加 `/guides/`。聚合页只用于快速定位任务，不做大段品牌宣传。

## 3. 首批发布范围

首批建议只交付两个工具内页和两个知识页：

1. `/target-roas-calculator/`
2. `/profit-lever-calculator/`
3. `/guides/contribution-margin-vs-gross-margin/`
4. `/guides/roas-vs-acos/`

选择原因：

- 两个工具页可以完整组成“知道门槛 -> 设置目标 -> 选择动作”的最短闭环。
- 目标 ROAS 是品类必要能力，经营杠杆排序是可形成区分度的能力。
- 两个知识页分别解决最常见的输入误区和平台语言差异。
- 都能复用现有单位经济模型，不要求账户、数据导入或第三方授权。

暂不首发：

- 促销页：依赖更细的折扣、件单数、运费模型。
- CAC 回本页：需要先定义 cohort 和贡献 LTV 数据结构。
- 场景规划页：应先验证单场景模型和 URL 状态是否稳定。
- 平台归因对账：手工版价值有限，自动版需要数据连接。

## 4. 页面一：Target ROAS Calculator

### 页面任务

把已有贡献毛利转换为目标利润下的 Target ROAS、Target CPA 和 Target ACoS，给投手一个可直接使用、但带清晰口径的目标。

### 推荐 URL 与页面标题

- URL：`/target-roas-calculator/`
- Title：`Target ROAS Calculator for Ecommerce | ROAS Break`
- H1：`Target ROAS Calculator`
- 核心描述：`Set a ROAS, CPA, and ACoS target from the profit you need to keep.`

不为 Target CPA 和 Target ACoS 建立独立近似页面。三者是同一利润目标的不同表达，应在一个页面内同步输出。

### 输入

基础经济性：

- 收入口径摘要：净商品收入是否已扣折扣与退款，是否排除税。
- AOV / 净订单收入。
- 毛利快捷模式或逐项成本模式。
- 支付费、平台费、履约、退货准备金。

利润目标：

- 分段选择：每单保留金额 / 收入百分比。
- 目标利润值。
- 可选当前归因 ROAS 或当前 CPA，用于比较差距。

### 输出

结果按决策层级显示：

1. **Target ROAS**：同时显示倍数和 Google Ads 百分比，例如 `2.50x / 250%`。
2. **Target CPA**：为达到利润目标可承受的最高单笔获客费用。
3. **Target ACoS**：供 Amazon 等工作流使用。
4. **Break-even 与 Target 的差距**：清楚区分零利润底线和计划目标。
5. **Current gap**：当前表现高于或低于目标多少，并显示对应每单利润差。
6. **口径摘要**：结果采用的收入、成本、退货和归因定义。

### 状态与护栏

- 目标利润为零时，Target 与 Break-even 相等，明确说明这是底线而非增长目标。
- 目标利润等于或高于贡献毛利时，结果不可行，不生成无穷大目标。
- 缺少成本项时显示“未纳入”而不是默认等于零且不提示。
- 当前 ROAS 来自广告平台时标记为 `Attributed ROAS`，不称为真实利润。
- 提醒目标 ROAS 过高可能换来更低流量，但不替用户推荐一个无依据的目标。

### 页面结构

1. 页面标题与一句任务说明。
2. 输入与核心结果，保持在首个主要视区内。
3. Break-even / Target / Current 三条线的比较。
4. 口径摘要和缺失成本提示。
5. “Improve this target”入口，携带当前状态进入杠杆页。
6. 公式与一个完整示例。
7. 相关知识：贡献毛利、ROAS 与 ACoS。
8. 精简 FAQ，仅回答本页计算边界。

### 关键转化动作

- `Copy targets`：复制 ROAS、CPA、ACoS 和口径摘要，不只复制 URL。
- `Share scenario`：生成可恢复状态的链接。
- `Find the best lever`：进入利润杠杆页。

## 5. 页面二：Profit Lever Calculator

### 页面任务

回答“要提高利润或放宽 CPA，优先改哪个变量”。它不是泛化建议列表，而是根据同一套订单经济性逐项计算影响。

### 推荐 URL 与页面标题

- URL：`/profit-lever-calculator/`
- Title：`Ecommerce Profit Lever Calculator | ROAS Break`
- H1：`Profit Lever Calculator`
- 核心描述：`Compare the impact of AOV, product cost, fees, fulfillment, discounts, and returns on your ad economics.`

“ROAS sensitivity calculator”可以作为页面副标题和搜索语义，但不单独建同质页面。

### 进入方式

- 从首页或 Target 页携带当前输入进入，避免重复填写。
- 无状态直接访问时使用与首页一致的示例值，并标记为示例。
- 用户可命名场景，例如 `Core product`、`Holiday offer`。

### 输入

基准场景：

- 继承净订单收入、COGS、履约、费用、折扣、退货与目标利润。
- 选择最终关心的结果：Target CPA / 每单利润 / Target ROAS。

变化方式：

- 快捷幅度：`Small`、`Medium`、`Custom`，而不是让所有变量同时暴露复杂输入。
- 每个变量的变化值和方向，例如 AOV `+$5`、COGS `-3%`、退货率 `-2pp`。
- 允许启用或排除某个变量参与排序。

### 输出

主结果是一张按影响排序的动作表：

| 优先级 | 单变量变化 | 对目标 CPA 的影响 | 对每单利润的影响 | 新 Target ROAS |
|---|---|---:|---:|---:|
| 1 | AOV +$10 | +$X | +$Y | Zx |
| 2 | Return allowance -2pp | +$X | +$Y | Zx |
| 3 | COGS -5% | +$X | +$Y | Zx |

同时显示：

- 基准值与变化后值，避免只显示百分比。
- 最值得验证的前三个杠杆。
- 结果敏感度：轻微变化是否会跨越盈亏线或目标线。
- `Single-variable scenario` 标签，明确这不是因果预测。

### 交互边界

- 不自动把多个最优变化相加，避免忽略变量间关系。
- 用户可以选两项手动组合成一个场景，但结果标记为组合假设。
- 涨价不自动假设转化率不变；免邮不自动假设 AOV 上升。
- 金额变化和百分点变化必须使用不同单位，例如 `-2pp` 而不是 `-2%`。
- 原始变量为零时，不用相对百分比制造不可理解的变化。

### 页面结构

1. 页面标题与基准场景名称。
2. 基准经济性摘要，支持展开编辑。
3. 关注结果与变化幅度控制。
4. 按影响排序的动作表。
5. 选中某个动作后的 Before / After 明细。
6. 组合成场景并复制分享。
7. 解释敏感性分析的边界。
8. 下一步入口：促销模拟或多场景比较，首批以 `Coming later` 占位不可取，应在功能存在后再显示。

### 关键转化动作

- `Apply as scenario`：将某项变化形成新的可分享方案。
- `Compare with baseline`：进入 Before / After 比较状态。
- `Copy action summary`：复制基准、变化、结果与假设。

## 6. 首批知识页

### 6.1 Contribution Margin vs Gross Margin

- URL：`/guides/contribution-margin-vs-gross-margin/`
- 用户意图：理解为什么广告投放不能只看商品毛利率。
- 必须回答：两者定义、哪些成本通常遗漏、如何影响 BE ROAS、一个数字例子、从 Shopify 或财务数据中如何取值。
- 页面动作：`Calculate with contribution costs`，进入首页成本拆分模式。
- 禁止内容：行业平均毛利率、无来源 benchmark、重复首页全部 FAQ。

推荐内容顺序：

1. 两个指标的一句话区别。
2. 并排成本清单。
3. 同一订单在两种口径下的 ROAS 差异。
4. 电商常见漏项：履约、支付费、折扣、退款、退货处理。
5. 什么时候用 gross margin，什么时候用 contribution margin。
6. 带预填值的计算入口。

### 6.2 ROAS vs ACoS

- URL：`/guides/roas-vs-acos/`
- 用户意图：在 Meta/Google 的 ROAS 与 Amazon 的 ACoS 之间转换。
- 必须回答：两者公式、倒数关系、方向差异、Break-even ACoS 为什么等于贡献毛利率、目标利润如何降低允许 ACoS。
- 页面动作：`Convert a profit target`，进入 Target 页。
- 页面内可保留一个轻量双向换算器，但不复制完整单位经济输入。

推荐内容顺序：

1. ROAS 高为好、ACoS 低为好的核心区别。
2. 双向即时换算。
3. `4.0x = 25%` 等常用对照表。
4. Break-even 与 Target 的差异。
5. Amazon / Google 等显示格式说明。
6. 带当前换算结果进入 Target 页。

## 7. 后续页面定义

### Promotion Profit Calculator

- URL：`/promotion-profit-calculator/`
- 核心输入：原价、促销价/折扣、件单数、COGS、履约、支付费、运费收入与补贴、礼品成本、当前 CVR。
- 核心输出：促销前后贡献利润、目标 CPA、Break-even ROAS，以及为保持总利润所需的最低订单量/CVR提升。
- 独立成页原因：它改变的不只是 ROAS，而是价格、商品 mix、履约和转化的联合场景。

### CAC Payback Calculator

- URL：`/cac-payback-calculator/`
- 核心输入：首单贡献、新客 CAC、30/60/90/180/365 天累计复购贡献、目标累计利润。
- 核心输出：允许 CAC、回本日/月、未回本缺口、保守/基准/乐观情景。
- 独立成页原因：生命周期模型与首单订单模型的数据结构明显不同。

### Scenario Planner

- URL：`/scenario-planner/`
- 核心输入：2–5 个已保存场景，或复制当前工具状态形成场景。
- 核心输出：贡献利润、Target CPA、Target ROAS、风险提示的并排比较。
- 上线条件：至少两个独立工具已使用统一状态模型，且用户确实有创建第二场景的行为。

## 8. 导航与内链结构

### 全站导航

首批发布后建议导航为：

```text
ROAS BREAK
Tools
  Break-Even ROAS
  Target ROAS
  Profit Levers
Guides
```

- 桌面端 `Tools` 可以是菜单；移动端展开为简单链接列表。
- 当前首页的 `Formula / Examples / FAQ` 属于页内导航，不再占用全站主导航。
- 工具不足三个时不需要 `/tools/` 聚合页，菜单可直接指向工具。
- 知识页聚合上线后，`Guides` 指向 `/guides/`；此前直接链接最相关的知识页即可。

### 上下文内链

内链应围绕用户下一步，而不是在页尾堆“相关文章”：

| 当前页面 | 下一步一 | 下一步二 |
|---|---|---|
| Break-Even 首页 | Set a profit target | Understand contribution margin |
| Target ROAS | Find the best profit lever | Understand ROAS vs ACoS |
| Profit Levers | Apply as a scenario | Review returns and discounts |
| Contribution Margin guide | Calculate cost breakdown | Set a profit target |
| ROAS vs ACoS guide | Convert current metric | Set a profit target |

每个页面最多突出一个主要下一步和一个解释性链接，避免工具页变成入口目录。

### 面包屑

- 工具页：`Home / Tools / Target ROAS Calculator`
- 知识页：`Home / Guides / ROAS vs ACoS`
- 页面中面包屑保持低视觉权重，但提供结构化数据。

## 9. 跨页状态与共享计算模型

### URL 状态

继续沿用无账户、URL 可恢复的产品优势。不同页面使用一致的参数名，不在每页发明新的缩写。

建议共享状态：

```text
revenueBasis
orderValue
grossMarginPct
productCost
fulfillmentCost
otherVariableCost
feePct
discountPct
returnAllowancePct
targetProfitType
targetProfitValue
currentRoas
currency
```

原则：

- URL 只保存用户输入与明确选择，不保存可重新计算的派生结果。
- 未知参数忽略；无效值回退到页面默认值并提示，不让页面崩溃。
- 参数升级需保留旧链接兼容，必要时增加显式版本号。
- 分享摘要始终包含收入口径和未纳入成本，不能只分享一个 Target ROAS。
- 首批仍在浏览器本地计算，不收集订单或客户级数据。

### 共享领域模型

实现前应先把单位经济性从“首页表单字段集合”提升为共享模型：

```text
Revenue basis
  -> order revenue
  -> discounts / refunds / tax / shipping treatment

Variable economics
  -> COGS
  -> fulfillment
  -> fees
  -> return loss
  -> contribution before ads

Acquisition target
  -> break-even spend
  -> retained profit
  -> target CPA / ROAS / ACoS
```

页面只负责收集不同任务所需的输入和解释结果。公式不应分别复制到多个页面，否则修正退货或收入定义时容易产生口径漂移。

### 页面技术形态建议

推荐采用可独立输出 HTML 的多页面结构，共享 TypeScript 计算库和 UI 组件，而不是先引入完整客户端路由：

- 每个工具和知识页拥有稳定 URL、独立 title、description、canonical 和结构化数据。
- 页面初始正文无需等待 JavaScript 才可读取。
- 互动计算仍由客户端 TypeScript 提供。
- 后续若账户、保存场景和工作台成为核心，再评估应用路由。

这是实现方向，不在本规划阶段改动构建配置。

## 10. 页面模板与内容规范

### 工具页模板

```text
Breadcrumb
Literal H1 + one-sentence task statement
Interactive tool
Result interpretation / next action
Method and formula
Worked example
Relevant guide links
Task-specific FAQ
```

工具必须早于长篇解释出现。用户不应滚过 SEO 内容后才能开始计算。

### 知识页模板

```text
Breadcrumb
Question-led H1
Direct answer
Comparison / formula / example
Common input mistakes
Embedded lightweight conversion or prefilled tool action
Primary-source references
Related tool
Focused FAQ
```

### 内容去重规则

- 一个搜索意图只指定一个主页面。
- Target ROAS、Target CPA、Target ACoS 合并为同一工具页，不建立三套换皮页。
- 公式可以跨页简述，但完整解释只在主知识页维护。
- 每页的示例必须服务该页决策，不复制首页的 `$100 / 40% / 2.5x` 案例。
- FAQ 不跨页面整段重复；相同问题链接到主解释页。
- 不按 Meta、Google、TikTok 分别复制同一计算器；平台差异只在格式、归因和操作说明中体现。

### 视觉与交互连续性

- 延续当前克制、工作型界面和深色结果区，不为每个内页重新发明品牌样式。
- 工具页结果应保持高信息密度，避免把每个指标做成独立大卡片。
- 工具中只显示当前任务需要的字段，高级口径和详细成本使用渐进展开。
- 结果变化不能导致关键控件跳位；对比表、刻度和操作区使用稳定尺寸。
- 所有输入都有明确单位；`%`、百分点、倍数和金额不能混用。

## 11. SEO 与结构化数据

每个工具页至少包含：

- 独立且字面明确的 title、H1、meta description、canonical。
- `WebApplication` 结构化数据。
- 仅在页面可见内容确实包含相应问答时使用 `FAQPage`。
- 面包屑存在时添加 `BreadcrumbList`。
- Open Graph 标题和说明与页面任务一致；首批可以复用品牌图，后续再按工具生成结果型图片。

每个知识页至少包含：

- 明确的主问题和直接答案。
- 官方资料引用与更新时间。
- `Article` 和 `BreadcrumbList` 结构化数据。
- 返回工具的功能性链接，而不是泛化 CTA。

站点地图仅包含已发布、可索引且有完整内容的页面。未完成的占位页不进入导航、站点地图或结构化数据。

## 12. 分阶段发布计划

### Release 1：目标闭环

- 收入口径和成本覆盖护栏进入共享模型。
- 上线 Target ROAS Calculator。
- 上线 Contribution Margin vs Gross Margin。
- 首页新增唯一下一步：`Set a profit target`。
- 验证用户能否从首页完成目标设置并复制结果。

### Release 2：动作闭环

- 上线 Profit Lever Calculator。
- 上线 ROAS vs ACoS。
- Target 页增加 `Find the best lever`。
- 验证用户是否会采用某个杠杆、创建第二场景或分享摘要。

### Release 3：电商经营场景

- 根据行为数据在 Promotion Profit 与 Scenario Planner 之间二选一优先开发。
- 如果高频用户集中在店主和活动策划，优先促销页。
- 如果高频用户集中在投手和代理商，优先场景比较。

### Release 4：生命周期

- 完成 cohort 与贡献 LTV 数据定义后上线 CAC Payback。
- 不在没有时间窗、贡献毛利和回本护栏时提前展示一个笼统 LTV/CAC 比率。

## 13. 分析事件与验证指标

首批需要记录的行为事件：

```text
tool_view
calculation_completed
revenue_basis_confirmed
target_type_changed
target_copied
scenario_shared
next_tool_opened
lever_selected
lever_applied
guide_to_tool_clicked
```

事件只记录功能行为、页面和非敏感枚举，不上报用户输入的收入、成本或利润金额。

核心验证指标：

- 首页到 Target 页的进入率。
- Target 页完成计算和复制目标的比例。
- Target 页进入 Lever 页的比例。
- Lever 页选择并应用某个动作的比例。
- 分享场景的比例。
- 7 天和 30 天重复访问率。
- 用户是否能准确复述结果所采用的收入和成本口径。

不以页面数量、停留时长或 FAQ 展开次数作为主要成功指标。

## 14. 实现验收门槛

每个新工具页发布前必须满足：

- 与共享计算库的公式测试一致，包含不可行目标、零贡献和极端输入。
- URL 可恢复所有输入、模式和关键选择。
- 从上游页面进入时正确继承状态，返回时不丢失原方案。
- 桌面与移动端无横向溢出、文本遮挡或结果跳位。
- 键盘可完成主要工作流，表单标签和状态提示可被辅助技术识别。
- 复制摘要包含目标、单位、口径和假设。
- 页面在 JavaScript 失败时仍能读取标题、解释和公式。
- 添加对应 E2E：完成主流程、无效/不可行状态、跨页状态、分享恢复和移动端布局。
- canonical、站点地图、结构化数据与实际 URL 一致。

知识页发布前必须满足：

- 主结论有可核验来源，事实与产品建议分开。
- 页面没有与已有页面竞争同一主搜索意图。
- 至少一个示例不是对首页案例的重复。
- 工具入口携带正确模式或预填值。

## 15. 当前需要先决定的产品问题

进入实现前只需确认三项，不需要一次决定全部后续页面：

1. Target 页默认目标输入使用“每单保留金额”还是“收入百分比”。建议默认收入百分比，同时允许切换金额，因为它更容易跨 AOV 变化比较。
2. 收入口径护栏做成首次必选，还是有推荐默认值。建议默认“净商品收入，不含税，折扣和退款已扣除”，但必须让用户确认。
3. Profit Lever 的主排序指标使用 Target CPA 还是每单利润。建议默认 Target CPA，因为它能直接连接投放动作，同时允许切换为每单利润。

除此之外，促销、场景比较、LTV 和平台连接均可根据首两次发布的行为数据决定，不应阻塞首批内页。
