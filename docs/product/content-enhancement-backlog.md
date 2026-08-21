# ROAS Break 内容增强 Backlog

> 创建日期：2026-08-19<br>
> 状态：执行中<br>
> 最近同步：2026-08-21（`main` 分支 `dc8d676`）<br>
> 内容策略：[`content-enhancement-strategy.md`](./content-enhancement-strategy.md)<br>
> 来源研究：[`cross-border-commerce-content-research.md`](../research/cross-border-commerce-content-research.md)

## 使用方式

- `P0`：先完成，建立内容质量、发现和转化闭环。
- `P1`：在 P0 有索引、查询或工具使用信号后扩展。
- `P2`：需要新数据能力、持续编辑资源或需求验证。
- 每个页面只指定一个主搜索意图和一个主工具动作。
- 涉及导航、表单、URL 状态、转换器或其他交互变化时，必须同步添加 E2E。
- 完成勾选前必须满足该项验收标准，不能只以“页面已创建”结项。

## 本轮已完成的规划工作

- [x] `DOC-001` 核验 FastMoss “跨境媒体”18 个条目及主题。
- [x] `DOC-002` 核验海外代表站点的内容模型与一手来源。
- [x] `DOC-003` 盘点当前 6 个工具、5 篇指南和内容缺口。
- [x] `DOC-004` 形成内容策略、主题架构和优先选题池。
- [x] `DOC-005` 将旧内页规划标记为历史记录，避免重复建设。

## P0-A：内容基础设施

- [x] `CONTENT-001` 建立可维护的内容资产清单。
  - 产出：记录 URL、主题集群、主意图、对应工具、发布/审阅日期、来源复查期限和状态。
  - 依赖：无。
  - 验收：现有 5 篇指南和后续新稿均有唯一记录；能识别意图重复、过期来源和孤立页面。

- [x] `CONTENT-002` 把 `/guides/` 改为主题导航。
  - 产出：Unit Economics、Paid Media Metrics、Promotions & Merchandising、Customer Economics、Planning & Measurement 五组。
  - 依赖：`CONTENT-001`。
  - 验收：现有每篇指南只进入一个主组；桌面和移动端均可扫描；更新导航 E2E 和无横向溢出断言。

- [x] `CONTENT-003` 建立统一文章模板和编辑 brief。
  - 产出：直接答案、公式/规则、透明算例、取数路径、常见错误、来源、审阅信息、工具 CTA、相邻链接和结构化数据检查项。
  - 依赖：无。
  - 验收：用模板重构一篇现有指南后，无冗余占位段落；编辑者能从 brief 直接判断是否与现有意图冲突。

- [x] `CONTENT-004` 补全作者、发布者、审阅日期和纠错信息。
  - 产出：5 篇现有指南的可见元信息与一致的 `Article`/`BreadcrumbList` JSON-LD。
  - 依赖：明确作者/审阅责任人。
  - 验收：正文所见信息与结构化数据一致；来源和审阅日期可访问；对应 E2E 读取 JSON-LD 原始 `textContent()` 验证。

- [x] `CONTENT-005` 建立来源复查制度。
  - 产出：平台工作流 90 天、稳定概念 180 天的复查期限，以及链接失效处理规则。
  - 依赖：`CONTENT-001`。
  - 验收：每篇内容都有来源主体、URL、最后核验日期、下次复查日期；没有用聚合页支撑关键公式。

- [x] `CONTENT-006` 建立内容到工具的事件基线。
  - 产出：`guide_view`、`guide_to_tool_clicked`、session 级来源 guide、首次真实 `calculation_completed` 和成功复制事件；只发送固定 tool/guide/path ID。
  - 依赖：现有隐私同意机制。
  - 验收：拒绝 Analytics 时不加载/发送；接受后不发送计算金额、URL query 或个人数据；补充隐私与 E2E 验证。

- [x] `CONTENT-007` 为内容链接增加自动校验。
  - 产出：构建或测试阶段检查站内链接、canonical、sitemap 覆盖和关键一手来源格式。
  - 依赖：确定实现方式。
  - 验收：故意加入不存在的站内链接时测试失败；外链网络波动不直接阻断构建，而进入可审阅报告。

## P0-B：升级已有 5 篇指南

- [x] `GUIDE-001` 升级 Contribution Margin vs Gross Margin。
  - 补充：margin 与 markup 边界、完整订单成本表、Shopify 取数入口、预填 Break-even 案例。
  - 验收：不发布无来源行业毛利；用户能从页面确认哪些成本未纳入并进入详细成本模式。

- [x] `GUIDE-002` 升级 ROAS vs ACoS。
  - 补充：Amazon Ads 工作流、break-even ACoS 与 target ACoS、转换器可访问性、预填 Target 案例。
  - 验收：与 Amazon 当前官方定义一致；交互变化有 ROAS/ACoS 双向转换 E2E。

- [x] `GUIDE-003` 升级 Attributed ROAS vs MER。
  - 补充：平台收入重复归因、店铺总收入边界、月度对账步骤和 Meta/Google/TikTok 章节入口。
  - 验收：不把 MER 称为利润；不声称多个平台相加就是增量收入。

- [x] `GUIDE-004` 升级 Ecommerce Revenue Basis。
  - 补充：Shopify gross/net/total sales 字段映射、税与运费边界、退款成熟度、预填工具例子。
  - 验收：平台字段引用官方帮助；页面明确 ROAS Break 采用的建模选择而非声称唯一会计标准。

- [x] `GUIDE-005` 升级 Returns, Refunds, and Discounts。
  - 补充：return rate 与 return loss rate、折扣和退款区别、成熟 cohort、Promotion/Profit Lever 双向入口。
  - 验收：百分比与百分点不混用；案例包含可回收商品和不可回收损失的边界。

## P0-C：第一批新内容

- [x] `NEW-001` 发布 How to Calculate Break-even ROAS from Shopify Reports。
  - 主意图：从 Shopify 报表取得 ROAS Break 输入。
  - 对应工具：Break-even ROAS。
  - 验收：列出当前官方字段和路径、净收入口径、成本缺失项；至少一个带预填 URL 的完整案例。

- [x] `NEW-002` 发布 What Is a Good ROAS for Your Profit Margin?。
  - 主意图：根据自身贡献毛利判断 ROAS，不寻找通用平均值。
  - 对应工具：Break-even / Target ROAS。
  - 验收：首屏明确“没有脱离成本结构的通用 good ROAS”；展示 3 个透明假设场景，不称为行业 benchmark。

- [x] `CNT-003`（研究清单）发布 Ecommerce Profit Formulas。
  - 主意图：用一致的收入、成本、转化和时间边界连接贡献毛利、ROAS、CPA、POAS、MER 与 CAC payback。
  - 对应工具：Target ROAS，并通过目录连接其他决策工具。
  - 验收：包含统一单位、透明算例、Global/USD 范围边界、结构化来源和可恢复 CTA；目录、sitemap、移动端及结果路径 E2E 均已覆盖。

- [x] `NEW-003` 把 Profit Margin to Allowable CPA and Target ROAS 合并进既有资产，不新增竞争 URL。
  - 主意图：把订单利润转换成 CPA、ROAS 和 ACoS 上限。
  - 对应工具：Target ROAS。
  - 验收：区分 break-even 与 retained-profit target；不可行目标有明确解释；不与 Contribution Margin 指南重复定义段落。
  - 完成证据：Ecommerce Profit Formulas 统一 CPA/ROAS/ACoS 公式，Target ROAS 工具处理 retained-profit 与不可行状态，Google Target 指南承接平台工作流。

- [x] `NEW-004` 发布 Google Ads Target ROAS vs Break-even ROAS。
  - 主意图：解释出价目标和经营底线的区别。
  - 对应工具：Target ROAS。
  - 验收：引用 Google 当前官方定义；不承诺设置某值必然获得相同实际 ROAS；包含转化价值和归因边界。

- [x] `NEW-005` 发布 Amazon Break-even ACoS and Target ACoS。
  - 主意图：从贡献毛利和保留利润求 ACoS。
  - 对应工具：ROAS vs ACoS / Target ROAS。
  - 验收：与 `GUIDE-002` 分工明确，前者回答具体经营工作流，后者维护核心指标关系；包含一个完整 Seller 场景。

- [x] `NEW-006` 把 Discount Break-even 合并进 Discount vs Bundle Profit。
  - 主意图：折扣需要多少订单或 CVR 提升才能不降低总利润。
  - 对应工具：Promotion Profit。
  - 验收：包含价格、成本、履约、流量基线和增量假设；不把相关性写成折扣因果效果。
  - 完成证据：同一页面和 Promotion Profit 预填场景覆盖订单量/CVR 阈值、成本边界与非因果限制。

- [x] `NEW-007` 发布 Contribution LTV vs Revenue LTV for CAC。
  - 主意图：为什么累计销售额不能直接当成 allowable CAC。
  - 对应工具：CAC Payback。
  - 验收：定义明确时间窗；扣除每次订单的变量成本；不外推“终身”价值或插入行业复购率。

- [x] `NEW-008` 发布 CAC Payback by 30/60/90/180/365-day Cohort。
  - 主意图：用成熟 cohort 找到回本检查点。
  - 对应工具：CAC Payback。
  - 验收：解释累计贡献必须单调与否的输入护栏、未回本状态和数据成熟度；案例可恢复。

- [x] `NEW-009` 发布 Meta Attributed ROAS vs Ecommerce Profit 工作流。
  - 主意图：把 Meta 的归因收入转换成贡献利润判断。
  - 对应资产：Attributed ROAS vs MER / Target ROAS。
  - 验收：引用可公开核验的官方来源；若官方帮助要求登录，明确证据限制，不猜默认窗口。

- [x] `NEW-010` 发布 TikTok Ads Attribution Windows and Profit Inputs。
  - 主意图：理解 TikTok 归因窗口和基础指标如何映射到经营模型。
  - 对应工具：Target / Scenario。
  - 验收：引用 TikTok 官方帮助；不混淆 TikTok Ads 与 TikTok Shop GMV；记录核验日期。

- [x] `NEW-011` 发布 Product vs Channel Profitability Scenario。
  - 主意图：比较高 ROAS/低毛利与低 ROAS/高毛利方案。
  - 对应工具：Scenario Planner。
  - 验收：使用透明的虚构案例，明确规模与转化不保持线性的限制；提供两个以上可恢复场景。

- [x] `NEW-012` 发布 Ecommerce Variable-cost Checklist。
  - 主意图：检查广告前贡献成本是否覆盖完整。
  - 对应工具：Break-even / Profit Lever。
  - 验收：按收入扣减、商品、履约、支付/平台、退货、客服等分组；可直接复制；不把税务或会计建议泛化。

## P0-D：发布与复盘

- [x] `RELEASE-001` 为每篇新内容建立发布前检查。
  - 检查：主意图唯一、来源可访问、事实/建议分离、算例复算、CTA 可恢复、元信息完整、无薄内容占位。
  - 验收：检查结果随提交保存；任何关键项失败则不进 sitemap。自动门禁与 `content/content-manual-review.json` 已覆盖 23 个资产及语义意图、事实/建议、算例复算三类独立审查，缺失或陈旧记录会阻断发布。

- [ ] `RELEASE-002` 每篇发布后验证生产环境。
  - 检查：HTTP 200、canonical、robots、sitemap、结构化数据、桌面/移动布局、站内/站外链接、工具状态传递。
  - 验收：关键路径由 Playwright smoke 或现有 E2E 覆盖；不只检查构建成功。**基础设施完成、当前发布仍阻断：** `pnpm production:smoke` 与浏览器模式已覆盖生产 HTTP、robots、sitemap、canonical、schema、链接、桌面/移动布局和 CTA 状态；最新本地内容尚未部署，不能标记本轮生产验证通过。

- [x] `RELEASE-003` 建立 30/60/90 天内容复盘。
  - 检查：索引、查询、点击、guide-to-tool、计算完成、复制/分享和来源新鲜度。
  - 验收：每次复盘得出“扩展、重写、合并、保留观察”之一，不以继续发布作为默认结论。
  - 完成证据：`content/content-performance-reviews.json`、`pnpm review:check` 和 `--draft` 建立 UTC 检查点与到期阻断；草稿占位、跨资产行为、未来/陈旧证据、未知 Git commit 和无证据扩展均会失败。2026-08-21 为 0 completed、0 due、69 scheduled。

## P1：经营场景与模板

- [x] `P1-001` Free-shipping Threshold Profitability。
  - 先验证搜索/用户需求，再决定是指南、Promotion 模式还是新工具。
  - 验收：同时处理运费收入、商家运费、AOV/件单数和订单提升假设；交互实现有 E2E。

- [x] `P1-002` Bundle Pricing and AOV Contribution。
  - 产出：bundle 前后收入、COGS、件单履约和可承受 CPA 的透明案例。
  - 验收：不默认 bundle 一定提高转化；复用 Profit Lever 或 Promotion，而非复制计算公式。

- [ ] `P1-003` Return-rate Impact on Allowable CPA。
  - 产出：Returns 指南的任务型扩展或交互案例。
  - 验收：与现有主指南 canonical/意图分工明确；区分退货率、退款率和净损失率。
  - 状态：既有 Returns 与 Refund Adjustments 已覆盖口径，但尚无独立 allowable CPA 任务的使用信号，暂不新增 URL。

- [x] `P1-004` New-customer ROAS vs Blended ROAS。
  - 产出：新客收入、总收入、首单贡献和复购贡献的口径图与案例。
  - 验收：不把平台归因的新客标签当作财务真相；明确 cohort 窗口。

- [x] `P1-005` MER, Platform ROAS, and Finance Reconciliation。
  - 产出：月度对账检查表，作为现有 Attributed ROAS vs MER 指南的扩展。
  - 验收：不会与现有页面竞争相同主意图；包含延迟转化、退款更新和不同收入窗口。
  - 完成证据：合并到 Attributed ROAS vs MER，并由 Conversion Delay 和 Refunds/Conversion Adjustments 补齐成熟度与回填流程。

- [ ] `P1-006` Payment and Marketplace Fee Impact。
  - 产出：固定费、百分比费、分层费率对贡献利润与 allowable CPA 的影响。
  - 验收：来源与适用时间明确；不维护容易过期的全平台费率大全。
  - 状态：Variable-cost Checklist 已覆盖字段归属；固定费、比例费和分层费率的独立需求尚未验证，暂缓扩写。

- [ ] `P1-007` BFCM Promotion Planning。
  - 产出：季节性促销场景模板和 Promotion 预填案例。
  - 验收：每年复查；不发布没有样本方法的 BFCM benchmark；过季仍保留长期可用的公式价值。
  - 状态：缺少季节性查询、用户问题或可复核样本，保留候选。

- [ ] `P1-008` Monthly Ad Budget and Contribution-profit Scenarios。
  - 先以内容/模板验证，再决定是否开发新工具。
  - 验收：预算、CPA/CVR、订单量和利润关系明确；不假设扩量效率不变。
  - 状态：Scenario Planner 已提供透明情景能力，但没有月度预算模板的稳定使用证据，暂不新建页面或工具。

- [ ] `P1-009` Scale-spend Profit Guardrail Checklist。
  - 产出：目标差距、数据成熟度、库存、回本和边际效率检查表。
  - 验收：不输出无依据的自动扩量建议；每条守门条件可由用户输入或数据验证。
  - 状态：数据成熟度与商品/渠道场景已覆盖部分判断边界，尚无完整守门清单的真实需求信号。

- [ ] `P1-010` Shopify Product-level Profit Workflow。
  - 产出：手工导出/映射到 Scenario Planner 的流程。
  - 验收：先证明手工流程被使用，再立项 CSV；涉及文件上传前重新做隐私和安全评审。
  - 状态：Product vs Channel 场景已验证比较模型；尚无 Shopify 手工导出流程的使用数据，CSV 前置条件未满足。

## P2：数据产品与长期编辑

> 2026-08-21 已完成前置条件评估，当前六项均暂缓；证据、未满足条件和重开门槛见 [`conditional-expansion-evaluation.md`](./conditional-expansion-evaluation.md)。未勾选表示能力未实现，不表示评估遗漏。

- [ ] `P2-001` 评估商品/渠道 CSV 导入。
  - 前置条件：`P1-010` 有稳定使用证据；字段模型、大小限制、错误恢复和本地处理方式已定义。
  - 验收：不上传客户或订单级个人数据；导入、校验、删除、移动端和失败状态均有 E2E。

- [ ] `P2-002` 评估 Shopify/GA4/广告平台连接。
  - 前置条件：手工平台工作流已证明高频痛点；OAuth、权限、存储、删除和成本有独立方案。
  - 验收：默认最小只读 scope；可撤销；平台字段到领域模型有单一映射源；不在内容任务中顺带实现。

- [ ] `P2-003` 评估 Actual vs Target 趋势与 cohort 监控。
  - 前置条件：有可靠的时间窗、数据修正和成熟度定义。
  - 验收：区分归因更新与真实经营变化；历史重算和缺失数据有明确表现。

- [ ] `P2-004` 建立自有 benchmark 方法。
  - 前置条件：拥有合法、足量且可解释的数据；隐私与统计方法完成审查。
  - 验收：公开时间、地域、样本、筛选、指标定义、分布和局限；否则继续不发布 benchmark。

- [ ] `P2-005` 评估独立中文 `/zh/` 内容集。
  - 前置条件：中文查询或用户渠道有明确需求；有持续本地化责任人。
  - 验收：独立 URL、hreflang、术语表和来源维护；不混排、不自动索引机器直译。

- [ ] `P2-006` 评估季度趋势综述。
  - 前置条件：有稳定编辑日历和一手数据/平台变更来源。
  - 验收：每期提供长期可复用的经营解释；不转向融资快讯、PR 聚合或日更新闻。

## 统一 Definition of Done

一项可索引内容只有同时满足以下条件才可勾选完成：

- [ ] 主问题、目标读者和对应工具明确，且与现有页面无主意图冲突。
- [ ] 首屏有直接答案；定义、单位、公式和案例经独立复算。
- [ ] 关键事实引用一手来源，附最后核验日期；事实、建模选择和建议分开。
- [ ] 至少一个透明算例，不使用伪造客户结果或无方法行业平均值。
- [ ] 主 CTA 能完成一个下一动作；预填 URL 可恢复且不含个人/机密数据。
- [ ] title、description、canonical、可见审阅信息、Article/Breadcrumb JSON-LD 完整一致。
- [ ] 站内链接、sitemap、robots 和生产 HTTP 状态正确。
- [ ] 移动端与桌面端无横向溢出或遮挡；交互变化已有 E2E。
- [ ] Analytics 拒绝状态仍可完整使用；事件不携带金额、query 或个人数据。
- [ ] 资产清单记录发布状态与来源复查期限；复盘账本能由 `publishedOn` 推导下一次 30/60/90 天检查点。
