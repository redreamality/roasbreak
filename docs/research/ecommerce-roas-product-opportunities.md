# 面向电商用户的 ROAS 决策产品机会研究

> 调研日期：2026-08-13  
> 范围：ROAS Break 面向电商投手、店主/经营者、增长负责人的产品扩展机会  
> 方法：阅读当前仓库，并优先核对 Google Ads、Google Analytics、Shopify、Amazon Ads、TikTok Ads 的官方资料。本文明确区分“来源事实”“推论”和“建议”。

## 结论先行

当前产品是一个清晰、可信的**单次首购盈亏线计算器**：它能根据 AOV、毛利或逐项可变成本、支付/平台费、退货折扣准备金和当前 ROAS，计算盈亏平衡 ROAS、最高 CPA、单笔利润及每千元广告费利润。

它现在“薄”的根因不是结果卡片少，而是只回答了一个问题：**当前 ROAS 是否超过首单盈亏线？** 电商经营者接下来还要回答四个会直接改变动作的问题：

1. 为了保留目标利润，平台中的目标 ROAS / CPA 应该设多少？
2. 不同商品、折扣、渠道、新老客结构下，应该推什么，而不是只看全店平均？
3. 首单亏损时，复购价值是否足以支撑更高 CAC，多久回本，现金是否撑得住？
4. Meta、Google、TikTok、Shopify 等口径冲突时，哪个数字可用于加减预算？

因此最优产品方向不是先做更多内容页或广告术语百科，而是把工具从“算一个阈值”推进为一条短决策链：

```text
订单真实净收入
  -> 首单贡献利润
  -> 目标利润 ROAS / CPA
  -> 新客 LTV 与 CAC 回收
  -> 场景/商品/渠道比较
  -> 可执行的预算判断（并显示归因口径与不确定性）
```

建议优先做三个模块：

- **P0：口径护栏 + 情景区间**：先明确收入、退货、税费、归因窗口的口径，并用保守/基准/乐观区间代替伪精确值。
- **P0：目标利润与平台目标转换器**：在口径成立后，从“盈亏线”推进到“应该在广告平台填多少”。
- **P1：新客 CAC / 复购回收计算器**：区分新老客，用毛利 LTV 而非销售额 LTV，回答可承受 CAC 与回本月数。

## 1. 当前产品边界

### 已有能力（代码事实）

当前计算模型见 `src/lib/calculator.ts`，页面内容与输入见 `index.html`：

- 两种输入方式：毛利率快捷模式、逐项成本模式。
- 输入：AOV、毛利率或产品/履约/其他可变成本、支付与平台费率、退货与折扣准备金、当前 ROAS。
- 输出：贡献毛利、盈亏平衡 ROAS、最高 CPA、当前单笔利润、每 1,000 美元广告费利润、安全边际。
- 支持 URL 分享，不存储客户数据。
- 页面教育内容覆盖公式、成本项、FAQ 和一个演算案例。

### 当前模型隐含假设（推论）

- 每单经济性可由一个全店平均 AOV 与平均成本代表。
- `returnPct` 被当作收入的固定比例扣减；没有区分退款金额、退货后可回收库存、逆向物流与支付手续费损失。
- `grossMarginPct` 与费用、退货准备金的口径天然兼容。
- 当前 ROAS 的收入分子与计算器 AOV 使用同一种收入定义。
- 广告归因订单都可视作增量订单。
- 获客只看首单，不考虑新老客混合、复购、订阅与回本时间。
- 成本、转化率、客单价不会随着预算规模变化。

这些假设适合快速首算，但不适合直接支撑大额预算、跨平台比较或 LTV 驱动的亏损获客。

## 2. 三类核心用户及其任务

### 2.1 电商投手 / 代理商

核心任务：

- 把经营目标翻译为 Google/Meta/TikTok 的目标 ROAS 或目标 CPA。
- 判断一个广告组/活动是继续、降预算、提预算还是等待归因成熟。
- 解释“平台 ROAS 很好但财务不赚钱”或不同平台都声称同一收入的问题。
- 对比创意、渠道、商品时，避免被不同 AOV、毛利和新客比例误导。

成功标准：结果能直接映射到广告平台设置或预算动作，并清楚标记数据口径和成熟度。

### 2.2 店主 / 经营者

核心任务：

- 确认卖一单后真正留下多少现金与贡献利润。
- 理解折扣、包邮、退货、支付费、市场佣金变化对可承受获客成本的影响。
- 在“更高销量”和“更高利润”之间选择目标，而不是追求行业通用 ROAS。
- 评估促销、涨价、组合装、免邮门槛是否真的改善获客能力。

成功标准：少量可信输入即可得到直观的单位经济性和决策建议，且不会要求用户先成为归因专家。

### 2.3 增长负责人 / 财务协同者

核心任务：

- 从首购 ROAS 延伸到新客 CAC、贡献毛利 LTV、回本周期和现金需求。
- 按商品、渠道、新老客、地区或场景分配预算。
- 对平台归因、店铺归因和实际总订单做 reconciliation（对账），并识别非增量收入。
- 在预算增加后效率下降的情况下，找“下一元广告费”的边际回报，而不是只看平均 ROAS。

成功标准：工具允许保存/比较假设、解释差异，并输出一个可审计的计算口径。

## 3. 一手资料事实及其产品含义

### 3.1 ROAS 是收入指标，不是利润指标

**来源事实**

- Google Ads 将目标 ROAS 定义为每 1 美元广告花费期望获得的平均转化价值；官方示例为 5 美元销售额 / 1 美元广告费 = 500% ROAS。目标设得过高可能限制流量。[Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)
- Amazon Ads 将 ROAS 定义为广告活动收入除以广告花费；ACOS 是广告花费除以广告收入，二者互为倒数。[Amazon Ads：ACOS guide](https://advertising.amazon.com/library/guides/acos-advertising-cost-of-sales) / [Amazon Ads：ROAS guide](https://advertising.amazon.com/library/guides/return-on-ad-spend-roas)
- Amazon Ads 明确指出盈亏平衡 ACOS 与利润率直接相关，ACOS 需低于利润率才能保留利润。[Amazon Ads：ACOS guide](https://advertising.amazon.com/library/guides/acos-advertising-cost-of-sales)

**推论**

现有产品的核心定位是对的：平台 ROAS 只有结合贡献毛利才有经营意义。但“盈亏线”只是经营目标的下界；用户仍需要把目标利润反推为平台目标。

**建议**

新增“目标利润模式”，允许输入希望每单保留的金额或贡献利润率，并输出：

- 目标 ROAS = `1 /（贡献毛利率 - 目标保留利润率）`
- 目标 CPA = `单笔贡献毛利 - 单笔目标保留利润`
- 目标 ACOS = `1 / 目标 ROAS`
- 平台填写值：同时显示 `x` 与 `%`（如 `2.50x = 250%`），避免 Google 的百分比与其他界面的倍数混淆。

### 3.2 “AOV”和“收入”在不同报表中未必同口径

**来源事实**

- Shopify 销售报表中的 AOV 为“毛销售额（不含后续调整）减折扣（不含后续调整）/ 订单数”；后续编辑、换货和退货属于 adjustments。[Shopify：Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report)
- Shopify 营销报表的 AOV 包含税、运费和折扣，并且发生在退货之前；其营销报表也可能包含 canceled、pending、unpaid 订单。[Shopify：Marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports)
- Shopify 将净销售额定义为毛销售额减折扣、减销售冲销；总销售额还会加税、关税、运费和费用。销售报表不等于实际收付款，且 chargeback 不计入销售报表。[Shopify：Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report)
- GA4 推荐的电商事件可以记录 item、coupon、discount、shipping、tax、purchase、refund 等字段；`purchase.value` 是商品价格乘数量之和，并将税和运费作为独立参数。[Google Analytics：Measure ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)

**推论**

用户从 Shopify、GA4 或广告平台复制同一个叫作“AOV”或“revenue”的数，可能得到不同盈亏线。只提高小数精度不会提高决策准确度。

**建议**

在输入端增加“收入口径”选择与内联检查：

- 商品净收入（推荐）：扣折扣、退款/冲销，不含税，运费单列。
- 平台报告收入：要求用户说明是否含税、运费、退货。
- 若选 Shopify 营销 AOV，自动提示“通常含税/运费且在退货前”，并打开对应调整项。
- 把“Returns + discounts”拆为折扣、退款/销售冲销、退货处理/逆向物流；这三者对利润的机制不同。

### 3.3 平台归因不是同一个真相

**来源事实**

- Shopify 营销报表提供 last non-direct click、last click、first click、any click、linear 等归因模型。官方特别说明 any click 会把 100% credit 分给每个被点击渠道，因此总 credit 会超过实际订单数，适合看单渠道或与渠道自报归因对账。[Shopify：Marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports)
- Shopify first interaction 会在访客 30 天未购买后重置；每次下单后，下一来源也会成为下一单的 first interaction。[Shopify：Marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports)
- Shopify 表示营销归因销售只包含可直接追踪的营销流量，因此会与其他销售报表不同；referrer 也可能因 Do Not Track、代理/防火墙或短链而缺失。[Shopify：Marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports)
- TikTok Ads 区分点击归因（CTA）和展示归因（VTA）；VTA purchase 是归因给广告展示的购买。TikTok Shop 的 assisted 指标可基于购买前 28 天内的广告曝光。[TikTok Ads：Attribution Metrics](https://ads.tiktok.com/help/article/attribution?lang=en)
- TikTok 广告组可配置 click-through 1/7/14/28 天、view-through Off/1/7 天等窗口，官方建议根据业务目标测试窗口。[TikTok Ads：Attribution windows](https://ads.tiktok.com/resources/help/article/about-attribution-windows-at-the-ad-group-level?lang=en)
- Meta Ads Insights API 以账户、campaign、ad set、ad 等层级返回广告表现，查询包含时间、归因设置、fields 和 breakdowns；Meta 官方要求通过 Pixel 或 Conversions API 配置所需 action 的跟踪。[Meta Marketing API：Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)
- Meta 官方说明多个 breakdown 指标属于估算值；跨不同 attribution settings 聚合时，部分 action 指标或 breakdown 可能不可用。[Meta Marketing API：Breakdowns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns)

**推论**

多个渠道各自报告的 attributed revenue 不能简单相加。平台 ROAS 超过盈亏线，也不等于广告创造了同等数量的增量订单。

**建议**

增加“归因口径护栏”，至少记录：

- 来源：广告平台 / Shopify / GA4 / 财务订单。
- 归因模型与窗口；点击和展示是否都计入。
- 数据截止日期与转化延迟是否成熟。
- 平台归因收入之和 / 店铺净销售额，若高于 100% 明确显示“归因重叠”，而不是将其包装成 blended ROAS。

产品文案必须称为“归因 ROAS”或“店铺整体 MER”，不应统一叫“真实 ROAS”。

### 3.4 广告决策必须考虑转化延迟与学习量

**来源事实**

- Google Ads 建议 ROAS 评估时间范围排除最近的转化延迟期；Target ROAS 推荐会排除最近几天，因为点击或互动后的转化可能延迟发生。[Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)
- Google Ads 在修改转化价值报告后，建议等待 4 周或 3 个转化周期；改变目标后，系统也需要约 1–2 个转化周期达到新目标。[Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)
- Google Ads 的 Target ROAS 对不同活动类型有最低转化量要求；例如 Search/Shopping 为过去 30 天至少 15 次转化，Demand Gen 要求更高。[Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)

**推论**

“过去 3 天 ROAS 低于盈亏线，立即关广告”不是普适建议。样本量小或归因未成熟时，工具应降低结论强度。

**建议**

提供轻量“数据成熟度检查”：输入观察天数、购买数、典型转化延迟、平台后端窗口，输出：

- 已成熟日期（例如只评估 `今天 - P90 转化延迟` 以前的数据）。
- 样本量/自动出价适用性提示。
- “可行动 / 继续观察 / 数据不足”状态；避免只用红绿灯判断利润。

### 3.5 电商获客价值经常跨越首单

**来源事实**

- Shopify 客户报表原生区分 first-time 与 returning customers，报告客户平均订单数、平均订单额和预期购买价值。[Shopify：Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports)
- Shopify cohort analysis 按首次下单日期组织 cohort，用于分析客户获取与留存；可查看复购、留存率、净销售额、AOV、每客户支出、首购营销渠道和订阅/一次性订单比例。[Shopify：Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports#customer-cohort-analysis)
- Shopify 的未来每客户支出预测要求最多 24 个月店铺历史数据，并明确提示预测不保证未来销售。[Shopify：Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports#projections)
- Shopify RFM 使用最近购买、购买频率、消费金额对客户分组，并强调分数只基于该店自身数据，而非行业标准。[Shopify：Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports#rfm-analysis)

**推论**

对补充剂、订阅、美妆等高复购品类，只看首单盈亏会压低合理 CAC；但直接用销售额 LTV 或预测终身价值又可能高估可支配获客预算。更可靠的是有限时间窗内的**累计贡献毛利 LTV**。

**建议**

新增“新客 CAC 回收”模块，默认使用 30/60/90/180/365 天窗口：

- `窗口贡献 LTV = 各期净收入 × 各期贡献毛利率 - 售后/服务等增量成本`
- `允许 CAC = 窗口贡献 LTV - 目标累计利润`
- `回本月 = 累计贡献毛利首次覆盖 CAC 的月份`
- 显示首购、复购、订阅的分拆，而不是一个不可审计的“终身价值”。
- 未提供实际 cohort 数据时只给情景估算，清楚标注为假设，不提供行业默认复购率。

### 3.6 商品、渠道和客户价值并不相同

**来源事实**

- GA4 电商事件可在 item 层记录 SKU、品类、品牌、优惠券、折扣、价格与数量，并覆盖浏览、加购、结账、购买和退款事件。[Google Analytics：Measure ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- Google Ads 允许用 conversion value rules 对更高价值的客户、设备或地区乘以不同价值因子；价值出价的前提是不同转化对业务有不同价值。[Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)
- Shopify cohort analysis 可按首单的营销渠道、商品、订阅等条件过滤并比较 cohort。[Shopify：Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports#customer-cohort-analysis)

**推论**

全店平均盈亏线会隐藏“高 ROAS 低毛利商品”和“低首单 ROAS 高复购商品”的差异。比较广告时，贡献利润/新客贡献价值通常比收入 ROAS更接近经营目标。

**建议**

做“商品/场景比较器”，先允许手工创建 2–5 个场景：

- 商品/组合装、AOV、毛利、履约与退货率。
- 新客比例与窗口贡献 LTV。
- 渠道归因 ROAS、CPA、订单数、广告费。
- 统一输出贡献利润、贡献利润 ROAS、每新客贡献价值和目标差距。

批量 CSV 或 Shopify/平台连接应放在验证手工工作流之后。

### 3.7 数据回填、退款修正与成本覆盖率决定结果可信度

**来源事实**

- Google Ads 转化可在点击后于所选转化窗口内继续上报，窗口最长可到 90 天；近期报告可能出现成本已计入而转化尚未补齐，官方建议评估完整数据时避开尚未成熟的日期。[Google Ads：Find conversion reporting delays](https://support.google.com/google-ads/answer/6239119?hl=en)
- Google Ads 支持对已上报转化做 restate 或 retract，用于退货、取消、部分退款和客户价值变化；调整会影响 conversion value 及相关自动出价。[Google Ads：About conversion adjustments](https://support.google.com/google-ads/answer/7686447?hl=en)
- GA4 Data API 区分 `grossPurchaseRevenue`（未减退款的购买收入）、`purchaseRevenue`（购买收入减退款交易收入）和 `totalRevenue`（购买、订阅、广告等收入减退款）。[GA4 Data API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- Shopify 只有在成交当时已记录商品成本的销售才会进入 COGS / gross profit；`cost per item` 本身不包含税、运输和其他成本。[Shopify：Profit reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/profit-reports) / [Finance reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/finances-report)

**推论**

同一店铺的 ROAS 与毛利会随“数据截止日、是否扣退款、成本覆盖率”改变。产品应给结果附可信度，而不是只给更多小数位。

**建议**

- 显示成本覆盖率：有成本的销售额 / 参与计算的销售额；未覆盖全部 SKU 时降低建议强度。
- 显示退款调整状态与数据成熟日；允许用户保存“初报”和“成熟后复盘”。
- 导入数据时保留 gross revenue、net/purchase revenue、payment/payout，不用一个模糊的 revenue 字段覆盖所有口径。

## 4. 代表性竞品观察

以下是竞品页面在调研日的公开页面观察，作用是识别计算器品类的常见基线，不作为指标定义的权威来源。

| 产品 | 页面可见能力 | 对本产品的启示 |
|---|---|---|
| [Daymark](https://www.usedaymark.io/tools/break-even-roas-calculator) | target profit margin、target ROAS、max allowable CAC、margin buffer | “目标利润 → 目标 ROAS/CAC”已接近品类标配，单独增加它只能补齐基线 |
| [Eightx](https://eightx.co/tools/break-even-roas-calculator) | monthly revenue、fixed cost、paid share、target ROAS、max monthly ad budget、margin waterfall、MER | 月度预算和 margin waterfall 能连接经营视角，但线性预算推算必须声明效率不变假设 |
| [Calcrux](https://calcrux.com/tools/ecommerce/break-even-roas-calculator) | desired profit margin、target ROAS/ACoS、滑杆、个性化建议 | ACOS 与交互式 what-if 已出现；差异化不能停留在“有滑杆”，而要指出哪个经营杠杆最值得改及影响多少 |

**竞品推论**

- target ROAS、target ACOS、目标利润和预算估算应视为产品完整性的必要补齐，而非长期壁垒。
- 更有区分度的组合是：**严谨口径护栏 + 经营杠杆敏感性排序 + 首单/LTV 边界 + 多 SKU/场景比较**。
- 当前产品的简洁与无需登录是优势；不必为了看起来“更完整”先做重型 dashboard。

## 5. 决策公式与口径建议

下列公式是产品建议，不是各平台统一标准。实现时应允许用户查看公式、单位和采用的数据口径。

| 决策指标 | 建议公式 | 回答的问题 | 关键边界 |
|---|---|---|---|
| 订单贡献毛利 | 净商品收入 - COGS - 履约 - 支付/市场费 - 售后准备金 | 广告前一单能贡献多少钱？ | 税、运费、折扣、退货必须明示 |
| 盈亏平衡 ROAS | 净收入 / 订单贡献毛利；等价于 `1 / 贡献毛利率` | 最低收入回报是多少？ | 只覆盖广告和所列可变成本 |
| 盈亏平衡 ACOS | 订单贡献毛利 / 净收入；等价于 `1 / BE ROAS` | Amazon 等界面可容许广告费率？ | 与贡献毛利率同值（用百分比显示） |
| 目标 CPA | 订单贡献毛利 - 单笔目标利润 | 为实现利润目标最多付多少获客费？ | 若混有老客，应先分新老客 |
| 最高 CPC | 目标 CPA × 点击后购买转化率 | 在既定转化率下最多出多少点击费？ | 必须明确 CVR 分母为点击，不是曝光/会话 |
| 目标 ROAS | 净收入 / 目标 CPA | 广告平台应该瞄准什么值？ | 目标过高可能牺牲流量/规模 |
| 当前贡献利润 | 归因订单数 × 订单贡献毛利 - 广告费 | 当前广告在所选归因口径下贡献多少？ | 不是增量利润证明 |
| 贡献利润 ROAS | 当前贡献利润 / 广告费 | 每元广告费带来多少广告后贡献利润？ | 为负时要同时显示绝对金额 |
| MER / blended ROAS | 店铺净收入 / 全部广告费 | 整体营销投入与收入的关系？ | 受自然流量、品牌、促销等共同影响 |
| 新客贡献 CAC 上限 | 选定窗口累计贡献毛利 LTV - 目标累计利润 | 首单亏损时最多能为新客支付多少？ | 必须使用贡献毛利 LTV，非销售额 LTV |
| 回本期 | 累计贡献毛利首次覆盖 CAC 的周期 | 现金多久收回？ | 需要真实 cohort 或明确假设 |

### 退货建模不应只用一个百分比

推荐的简化建模：

`预期退货损失 = 退款收入 + 逆向物流 + 不可回收商品成本 + 不退还手续费 - 可回收库存价值 - 退货费`

早期版本可以让用户选择：

- 简单准备金（当前行为）。
- 详细退货模式：退货率、平均退款比例、商品可回收率、逆向物流、退货费。

这比把折扣和退货合并更具决策价值，因为降低折扣、降低退货率和提高商品可回收率是三种不同经营动作。

### 预算推演必须有规模假设

静态单位经济性只能推算“若 ROAS 不变，投入 X 会怎样”，不能证明 ROAS 在扩量后不变。建议把结果写为场景：

- `预计订单 = 广告预算 × 假设 ROAS / AOV`
- `预计贡献利润 = 广告预算 ×（假设 ROAS × 贡献毛利率 - 1）`
- 同时展示保守/基准/乐观 ROAS，不输出单点“推荐预算”。

平台本身也显示效率和规模存在权衡：Google 明确提示目标 ROAS 设得过高会限制流量，并建议通过降低目标 ROAS增加转化量。[Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)

## 6. 功能机会池

### 基础能力：收入、成本与归因口径护栏

**决策价值**：最高，是所有目标计算的前置依赖。

**最小功能**：收入口径预设、税/运费/折扣/退款包含关系、成本覆盖检查、归因来源/模型/窗口、数据成熟日；结果旁始终显示口径摘要。

**交付关系**：它不必成为独立页面，可以和机会 A 同版交付；但计算顺序、引导顺序和测试必须先验证口径再展示目标。没有这层护栏，目标 ROAS 功能只会放大错误输入。

### 机会 A：目标利润与平台目标转换器

**决策价值**：最高。把计算器结果直接转为投手能设置的目标。

**最小功能**：目标利润可按每单金额、收入百分比或广告后贡献率输入；输出目标 ROAS、目标 CPA、目标 ACOS、当前差距。

**护栏**：目标 CPA 小于等于 0 时解释成本结构不可行；区分 `Break-even`、`Minimum acceptable` 和 `Stretch`，不使用笼统的 “good ROAS”。

### 机会 B：经营杠杆敏感性面板

**决策价值**：很高。回答“应该优化哪一个经营变量”。

**最小功能**：对 AOV、COGS、折扣、退货、履约、支付费、转化后 ROAS 逐项做 ±5%/±10% 或用户自定义变化，按对目标 CPA/利润的影响排序。

**建议输出**：不是装饰性图表，而是动作表，例如“将退货准备金从 12% 降至 9%，目标 CPA 增加 $X；将 AOV 提高 $10，目标 CPA 增加 $Y”。

**边界**：变量并非独立；涨价可能降低转化率，免邮可能提升 AOV又增加履约成本。面板应叫“单变量情景”，不能叫因果预测。

### 机会 C：场景/商品比较器

**决策价值**：很高。解决全店平均掩盖利润差的问题。

**最小功能**：保存 2–5 个 SKU、组合装、地区或渠道场景；比较盈亏线、目标 CPA、贡献利润与风险项。

**推荐比较单元**：先按“商品经济性 × 获客渠道”组合，而不是只按广告活动，因为同一活动中的商品 mix 会改变利润。

### 机会 D：新客 CAC 与回本期

**决策价值**：高，但输入要求更高。

**最小功能**：首单贡献、30/60/90/180/365 天复购贡献、新客 CAC、目标回本窗口、回本月。

**护栏**：默认不提供行业 LTV；至少要求低/中/高三种复购情景，实际 cohort 数据优先。

### 机会 E：广告数据成熟度与归因检查

**决策价值**：高，能减少误杀广告和重复归因。

**最小功能**：来源、归因模型/窗口、点击/展示、购买数、观察期、典型延迟；显示成熟度、平台总归因/店铺销售对账比例和警告。

**边界**：这是一致性检查，不是多触点归因模型，更不是增量实验替代品。

### 机会 F：促销与免邮模拟器

**决策价值**：中高，店主特别容易理解并复用。

**最小功能**：原价/折扣、满减门槛、预计件单数、运费收入与补贴、礼品成本；比较促销前后目标 CPA 和需要达到的转化率/AOV改善。

**关键输出**：为了保持相同利润，订单量或转化率至少要提升多少，而不只是“折后 ROAS”。

### 机会 G：月度预算与利润情景

**决策价值**：中。它是业界计算器常见功能，但若只做线性乘法差异化很弱。

**最小功能**：预算、假设 ROAS、AOV、贡献率，输出订单、净收入、广告后贡献利润；支持三情景。

**护栏**：明确“ROAS 随规模不变”是假设；不输出无依据的最佳预算。

### 机会 H：数据导入与平台连接

**决策价值**：长期高，早期优先级低。

**候选顺序**：CSV 模板 → Shopify 订单/商品成本 → GA4 → 单个广告平台 → 多渠道对账。

**为何后做**：口径映射、授权、退货时滞、商品成本完整性和归因差异会快速把轻量计算器变成数据产品；应先验证用户是否持续使用上述决策工作流。

### 机会 I：漏斗瓶颈诊断

**决策价值**：中高，但容易滑向泛广告 dashboard。

**最小功能**：手工输入 impressions、clicks、sessions、product views、add to cart、checkout、purchase，明确计算 CTR、CPC、点击后 CVR、加购率、结账率、CPA。

**来源事实**：GA4 的推荐电商事件链覆盖商品列表、商品详情、加购、结账、购买、退款与促销。[Google Analytics：Measure ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce) TikTok 的基础 CVR 为 conversions / impressions，另有 `CVR (clicks)`，因此产品不能显示没有分母说明的“CVR”。[TikTok Ads：Basic data definitions](https://ads.tiktok.com/resources/help/article/basic-data?lang=en)

**边界**：漏斗变化能定位相关环节，不能仅凭比率自动判定创意、价格或信任是因果根因。先把它作为“为何利润未达目标”的按需诊断，而不是首屏指标墙。

### 机会 J：扩量守门条件

**决策价值**：中高；适合在数据导入后形成日常使用。

**最小功能**：只有在利润安全边际、样本量、归因成熟度、退款/成本覆盖率、订单集中度都达标时，才显示“具备扩量观察条件”；否则指出缺失证据。

**边界**：它不能给出因果性的最佳预算，只能降低“少数爆单或未成熟数据导致误扩量”的风险。

### 价值 / 复杂度矩阵

| 机会 | 决策价值 | 实现/数据复杂度 | 预计使用频率 | 建议阶段 |
|---|---:|---:|---:|---:|
| 收入口径与成本护栏 | 5 | 2 | 每次首次/改成本 | P0，先做 |
| 目标利润与 ROAS/CPA/ACOS | 5 | 2 | 每次定目标 | P0 |
| 经营杠杆敏感性 | 5 | 3 | 促销/优化时高频 | P0，差异化核心 |
| 三情景预算/利润推演 | 4 | 2 | 周/月度 | P0 |
| 多 SKU / 场景比较 | 5 | 3 | 周度/活动前 | P1 |
| 新客 CAC / 贡献 LTV / 回本 | 5 | 4 | 月度/季度 | P1 |
| 归因与数据成熟度检查 | 5 | 3（手工）/5（连接） | 日/周度 | P1 |
| 促销与免邮模拟 | 4 | 3 | 活动前 | P1 |
| 漏斗瓶颈诊断 | 4 | 3 | 日/周度 | P1 后段 |
| 扩量守门条件 | 4 | 5 | 日/周度 | P2，依赖数据接入 |
| CSV / 平台连接 | 5 | 5 | 高频 | P2，验证工作流后 |

评分是基于本产品现状的产品判断，不是用户调研结果。最高优先级并非单纯选择价值最高项，而是先满足依赖：**口径正确 → 目标可算 → 杠杆可行动 → 场景可比较 → 数据可自动化**。

## 7. 优先级路线

### P0：把“盈亏线”变成可执行目标

1. **收入口径与成本完整性护栏**：税、运费、折扣、退款/冲销、chargeback、退货处理分开或明确包含关系。
2. **目标利润模式与目标 ROAS/CPA/ACOS**。
3. **经营杠杆敏感性**：告诉用户哪个变量最值得优化。
4. **三情景输出**：保守/基准/乐观，突出假设变化后的区间。

理由：都能在现有单页、无账号、手工输入的架构上完成，同时让结果从“知道门槛”升级为“设置目标并选择经营动作”。**依赖顺序必须是先确定收入口径和成本覆盖，再计算目标 ROAS**；否则只是在更方便地输出一个错误目标。交付上二者可以同属 P0 的一个版本。其中 target ROAS/ACOS 和预算是代表性竞品已覆盖的标配；真正应拉开差距的是**利润目标 + 口径护栏 + 杠杆排序**的组合。

### P1：覆盖电商增长的两类关键异质性

1. **多 SKU / 组合装 / 促销场景比较**。
2. **新客 CAC、窗口贡献 LTV 与回本期**。
3. **归因口径和数据成熟度检查**。
4. **可保存/命名/复制的场景**，分享链接中包含假设说明。

理由：这组功能能分别解决商品 mix、客户生命周期和平台口径差异，但需要更多输入与解释，适合在 P0 的计算模型稳定后加入。

### P2：从计算器走向数据工作台

1. CSV 批量商品/渠道导入与模板。
2. Shopify/GA4/广告平台连接、刷新和口径映射。
3. 实际 vs 目标跟踪、cohort 趋势、异常提示。
4. 多用户注释、版本和预算审批。

理由：价值可能最高，但会引入账户体系、权限、数据质量、隐私与持续运维，不应在核心决策工作流尚未验证前提前建设。

## 8. 推荐的首屏与内容层级（非视觉设计稿）

现有页面不必通过增加大量科普段落来“变厚”。更有效的内容结构是渐进式决策：

1. **输入**：先选任务（找盈亏线 / 定利润目标 / 评估当前广告），再填少量基础值。
2. **核心结果**：盈亏线与目标线并列，显示最大 CPA、ACOS 及当前差距。
3. **下一动作**：一条具体判断，例如“当前归因 ROAS 高于目标 18%，但数据仍在转化延迟期”。
4. **杠杆**：按影响排序的 3 个可改变变量。
5. **情景**：复制当前方案做促销、成本或 ROAS 对比。
6. **高级边界**：新客 LTV、归因和数据成熟度按需展开。

内容页可以围绕高意图任务扩展，但应该复用同一计算模型，而不是孤立文章：

- Target ROAS / Target CPA / Target ACOS calculator。
- Discount profitability / free shipping threshold calculator。
- New customer CAC payback calculator。
- Contribution margin vs gross margin explainer。
- Shopify/GA4/Meta revenue口径对照表。

## 9. 明确不建议做的事情

- **不提供“行业平均好 ROAS”作为默认目标**：官方资料也强调目标取决于利润率和业务目标；行业均值不能代替单位经济性。
- **不把平台归因收入直接当作增量收入**：归因 credit 可重叠，展示归因也可能被计入。
- **不把销售额 LTV 直接当 CAC 上限**：它忽略 COGS、履约、退款与服务成本。
- **不根据单一平均 ROAS 给确定的最优预算**：扩量可能改变受众、竞价、商品 mix 和效率。
- **不一开始做跨平台自动数据仓库**：先验证决策问题，再承担连接器和数据治理成本。
- **不堆 CTR、CPC、CPM 等所有广告指标**：它们是诊断漏斗的输入，不应取代利润目标；只有能解释“为何未达目标”和“下一步改什么”时才加入。
- **不使用不可解释的个性化建议分数**：建议必须能追溯到用户输入、公式与假设。

## 10. 需要验证的产品假设

建议先以 8–12 位目标用户做任务访谈和可点击原型测试，覆盖品牌店主、in-house 投手、代理商和财务/增长负责人。优先验证：

1. 用户是否能准确拿到“净商品收入、贡献成本、新客比例、归因窗口”，还是只能拿到报表中的宽泛 AOV/ROAS。
2. 三类用户中，谁最愿意反复回来：每天看广告的投手、每月做预算的负责人，还是偶发计算的店主。
3. 目标利润输入偏好：每单金额、收入百分比、广告后贡献率还是月利润目标。
4. 杠杆排序是否会改变实际动作，还是只被当作解释性内容。
5. 多 SKU 比较的真实粒度：单品、品类、bundle、活动还是落地页。
6. 用户能否提供真实 cohort，及其愿意采用的 LTV 时间窗和回本上限。
7. 平台归因与 Shopify/GA4 对账是否为高频痛点，用户是否愿意为数据连接付费。

建议为每个 P0 功能定义行为指标，而不是只看访问量：

- 使用目标利润模式并复制目标值的比例。
- 创建第二个场景的比例。
- 修改敏感性建议中的变量并保存/分享的比例。
- 7/30 天重复访问率。
- 用户在访谈中能否正确复述“此数使用什么收入和归因口径”。

## 11. 来源索引与证据边界

### 主要一手来源

- [Google Ads：About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)
- [Google Ads：Find conversion reporting delays](https://support.google.com/google-ads/answer/6239119?hl=en)
- [Google Ads：About conversion adjustments](https://support.google.com/google-ads/answer/7686447?hl=en)
- [Google Analytics：Measure ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [GA4 Data API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [Shopify：Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report)
- [Shopify：Marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports)
- [Shopify：Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports)
- [Shopify：Profit reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/profit-reports)
- [Shopify：Finance reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/finances-report)
- [Amazon Ads：ACOS guide](https://advertising.amazon.com/library/guides/acos-advertising-cost-of-sales)
- [Amazon Ads：ROAS guide](https://advertising.amazon.com/library/guides/return-on-ad-spend-roas)
- [Meta Marketing API：Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)
- [Meta Marketing API：Breakdowns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns)
- [TikTok Ads：Attribution Metrics](https://ads.tiktok.com/help/article/attribution?lang=en)
- [TikTok Ads：Attribution windows](https://ads.tiktok.com/resources/help/article/about-attribution-windows-at-the-ad-group-level?lang=en)
- [TikTok Ads：Basic data definitions](https://ads.tiktok.com/resources/help/article/basic-data?lang=en)

### 证据边界

- Meta Business Help 页面在本次公开浏览环境中要求登录，本文没有引用无法直接核验的 Meta 默认归因窗口或产品行为；涉及 Meta 的建议仅按“广告平台归因”一般问题表述。
- 官方资料能证明平台的定义、字段、设置与限制，不能证明本产品用户一定需要某功能；功能优先级是基于目标用户任务和现有产品边界的产品推论，需要通过用户研究验证。
- 本文没有采用泛营销博客的“行业平均 ROAS、平均退货率、平均复购率”等数字，避免把不可迁移的基准写成默认事实。
- 文中预算、LTV、退货和贡献利润公式是推荐建模口径，并非会计、税务或平台统一规范。
