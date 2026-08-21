# 跨境电商媒体与 ROAS Break 内容增强研究

> 调研日期：2026-08-19<br>
> 范围：FastMoss「跨境资源站」中的“跨境媒体”栏目、海外电商/零售/营销内容站点，以及 ROAS Break 的内容扩展机会<br>
> 方法：先读取当前仓库，再核对 FastMoss 页面及其公开接口；站点主题优先依据各站官方首页、About、栏目页或资源中心。本文将“来源事实”“分析判断”“产品建议”分开，不使用第三方流量估算，也不把站点自述当成独立排名证据。

## 结论先行

FastMoss 当前“跨境媒体”栏目共有 18 个条目，但它并不是一份按影响力排序的媒体榜单。条目混合了资讯媒体、工具导航、卖家社区、产业智库、活动/服务平台和区域垂直站；FastMoss 接口里的 17 个有效条目均标记为中国区，`ext1` 至 `ext5` 也都是占位符 `#`，不能据此推出站点标签或质量等级。[FastMoss 跨境资源站](https://www.fastmoss.com/zh/links) / [FastMoss 公开接口](https://www.fastmoss.com/api/info/link)（访问日期：2026-08-19）

样本中最常见的内容是平台新闻、政策变化、运营文章和资源导航。知无不言代表社区问答，霞光社、品牌方舟和亿邦动力更偏研究/品牌全球化，RuClub123 则体现区域垂直化。这个分布说明“再做一个跨境资讯站”很难形成 ROAS Break 的独特价值；这是一项基于样本的分析判断，不是全行业份额结论。

海外对照站点显示出几种更适合借鉴的内容模型：按固定主题持续报道的 newsroom、以一手数据为核心的研究产品、面向经营者的实操内容、可检索的证据库，以及平台官方的结构化知识中心。它们的共同点不是文章数量，而是读者能明确知道内容解决什么问题、证据从哪里来、下一步做什么。

ROAS Break 已经拥有 6 个盈利决策工具和 5 篇口径指南。建议把定位收窄为 **Ecommerce Profit Decision Library（电商利润决策库）**：每个页面只回答一个可计算的经营问题，以官方定义和透明公式为依据，用可恢复的场景或计算器承接下一步。优先建设“利润口径、渠道指标翻译、促销/定价、CAC 回收、归因与数据成熟度”五个内容系列，不投入需要每日追更的泛新闻。

## 1. 调研边界与证据规则

### 1.1 什么可以从 FastMoss 得出

**来源事实**

- FastMoss 页面可切换到“跨境媒体”，公开接口返回栏目 `id=900002` 和 18 个条目。[页面](https://www.fastmoss.com/zh/links) / [接口](https://www.fastmoss.com/api/info/link)（访问日期：2026-08-19）
- 其中 TT123 的 `url` 和 `type` 都是 `#`，当前目录没有提供可访问的目标站点。其余 17 项的 `type` 为 `LK`，`region` 为 `CN`。[FastMoss 公开接口](https://www.fastmoss.com/api/info/link)（访问日期：2026-08-19）
- 接口中的 `brief` 是目录对站点的介绍，其中包含“领先”“最大”、用户量或曝光量等宣传性表述。

**不能据此得出的结论**

- 18 个条目的先后顺序不等于流量、影响力、内容质量或商业价值排名。
- FastMoss 对站点的宣传数字没有提供独立证据，因此本文不转述为事实。
- 目录没有覆盖所有中国或海外电商媒体，不能用它计算市场占有率或内容供给比例。
- 同名域名的存在不能修复 TT123 的无效链接；在无法确认 FastMoss 条目实际指向前，本文将它标记为“未完成一手核验”。

### 1.2 本文如何标注结论

- **来源事实**：可以在仓库文件、站点官方页面或官方接口中直接核对。
- **分析判断**：由多个来源归纳出的模式，不冒充站点自述或市场统计。
- **建议**：针对 ROAS Break 的取舍，需要后续通过搜索表现、站内行为和用户反馈验证。
- 下表“访问日期”均指本轮实际核验日期；遇到滑块验证、TLS 或 Cookie 校验时，会在核验说明中如实记录。

## 2. ROAS Break 当前内容基线

**仓库事实**

- `public/sitemap.xml` 当前列出 6 个工具入口：Break-Even ROAS、Target ROAS、Profit Lever、Promotion Profit、CAC Payback、Scenario Planner。
- `guides/index.html` 当前列出 5 篇指南：Contribution Margin vs Gross Margin、ROAS vs ACoS、Attributed ROAS vs MER、Ecommerce Revenue Basis、Returns, Refunds, and Discounts。
- 工具已经形成“盈亏线 -> 利润目标 -> 经营杠杆 -> 促销阈值 -> CAC 回收 -> 场景比较”的决策链；指南主要解释收入、成本、退货和归因口径。
- 当前指南篇幅短、动作明确并能链接到工具，这是可保留的基础；但站内尚没有清晰的主题集群、可见的审校/更新说明、平台系列和统一的方法论入口。

**分析判断**

项目的差异化资产是计算模型与“利润而非营收”的立场，不是新闻采编能力。内容扩展应让更多真实经营问题进入现有工具，而不是把工具放到大量泛资讯文章旁边。

## 3. FastMoss“跨境媒体”18 站逐条核验

下表完整覆盖 FastMoss 当前 18 个条目。表中官方来源与 FastMoss 页面/接口的访问日期均为 **2026-08-19**；主题来自站点自己发布的首页、About、栏目或资源页，不采用 FastMoss brief 中未经独立证明的流量和行业地位说法。

| # | 站点 | 一手核验后的主题 | 主要内容形态 | 官方来源与核验说明 |
|---:|---|---|---|---|
| 1 | 跨境眼 | 跨境资讯、物流/海外仓资源、活动、工具和行业报告 | 综合内容 + 资源匹配 + 活动 | [首页](https://www.kuajingyan.com/)；[行业报告](https://hd.kuajingyan.com/report/index) |
| 2 | 卖家之家 | 费用/FBA/TikTok/关键词/文本/AI 等卖家工具，并连接活动、服务商和物流资源 | 工具优先 + 服务导航 | [工具页](https://mjzj.com/tools)；[关于我们](https://mjzj.com/about/aboutus) |
| 3 | 跨境知道 | 平台新闻与政策、运营知识、行业报告、洞察、全球开店和服务资源 | 快讯 + 实操内容 + 报告 | [首页](https://www.ikjzd.com/)；[报告](https://www.ikjzd.com/reports)；[洞察](https://www.ikjzd.com/insights) |
| 4 | M123 | 按平台、地区和任务组织的跨境网址/产品目录，包含独立站、TikTok、AI、选品和关键词工具 | 工具/网址导航 | [首页](https://www.m123.com/) |
| 5 | 亿恩网 | 跨境新闻、深度内容、平台运营营销、课堂、招聘、生态导航和行业活动 | 垂直媒体 + 学习/活动服务 | [关于我们](https://www.ennews.com/aboutus)；[工具网站](https://www.ennews.com/Home/Index/platform)。首页本轮触发滑动验证，未用验证页补充事实。 |
| 6 | 蓝海亿观 | Amazon、TikTok Shop、Temu、Shopee 等平台动态，品牌案例、运营实操、政策和服务生态 | 平台资讯 + 案例/实操 | [首页](https://www.egainnews.com/)；[Amazon 栏目](https://www.egainnews.com/category/amazon) |
| 7 | 知无不言 | Amazon、Walmart、独立站、Shopify、Google、TikTok、AI 等运营与营销问题 | 同行问答 + 学习社区 | [首页](https://www.wearesellers.com/)；[社区分类](https://www.wearesellers.com/explore/category-directory) |
| 8 | 36氪出海 | 全球新经济、中国企业全球化、商业深度内容、社群和跨境服务，范围宽于电商 | 商业媒体 + 社群/服务 | [首页](https://letschuhai.com/)；[电商平台栏目](https://letschuhai.com/industry/dianshangpingtai) |
| 9 | AMZ123 | 从 Amazon 导航扩展到跨境资讯、干货、报告、数据、工具箱、活动和服务 | 门户 + 工具 + 报告 | [首页](https://www.amz123.com/)；[报告](https://www.amz123.com/report)；[工具箱](https://www.amz123.com/minitools) |
| 10 | 大数跨境 | 快讯、报告、百科、平台知识体系、工具、全球开店、活动和企业资料 | 开放内容平台 + 资源库 | [首页](https://www.10100.com/)；[研究报告](https://www.10100.com/report)；[工具箱](https://www.10100.com/tools) |
| 11 | 霞光社 | 全球市场产业研究，覆盖跨境电商、数字基础设施、制造和泛娱乐 | 深度内容 + 智库报告 + 活动 | [关于我们](https://xiaguangshe.com/about/)；[智库报告](https://xiaguangshe.com/report/) |
| 12 | 品牌方舟 BrandArk | 中国品牌全球化、品牌案例、增长、融资、财报、行业趋势和新兴市场 | 品牌案例 + 趋势/财报内容 | [首页](https://www.brandark.com/)；首页官方自述长期关注全球化、跨境出海和品牌增长。 |
| 13 | 出海网 | 企业跨境服务、展会、品牌出海、分销、快讯、报告、全球开店、选品和区域资源 | 内容 + 展会/服务平台 | [首页](https://www.chwang.com/)；[报告](https://www.chwang.com/report)；[选品](https://www.chwang.com/selection) |
| 14 | 雨果网 | 平台、服务商、工厂和卖家连接，覆盖选品、平台招商、独立站和品牌出海方案 | 产业生态 + 内容/服务 | [首页](https://www.cifnews.com/)；[独立站栏目](https://www.cifnews.com/website) |
| 15 | 亿邦动力 | 电商与产业数字化知识服务，包含资讯、案例、研究、会议和跨境电商垂直内容 | 商业媒体 + 智库/会展 | [首页](https://www.ebrun.com/)；[知识](https://www.ebrun.com/knowledge/)；[跨境电商标签](https://www.ebrun.com/label/6) |
| 16 | 扬帆出海 | 泛互联网出海资讯、报告、社群、投融资和本地化资源，覆盖游戏、AI、广告和支付 | 资讯/报告 + 社群/资源对接 | [首页](https://www.yfchuhai.com/)；[报告](https://www.yfchuhai.com/report/) |
| 17 | TT123 | FastMoss brief 称其为 TikTok 电商工具导航和媒体，涉及选品、实操与社媒趋势 | 无法一手核验 | FastMoss 的目标 URL 与 `type` 均为 `#`；只保留[目录接口](https://www.fastmoss.com/api/info/link)事实，不把同名域名自动视为该条目官网。 |
| 18 | RuClub123 | Ozon、Wildberries、Yandex 等俄罗斯市场的平台资讯、运营、物流、海外仓、选品和本地服务 | 区域垂直导航 + 运营内容 | [首页](https://www.ruclub123.com/)；[Ozon 运营](https://www.ruclub123.com/logistics4/) |

### 3.1 样本中的五类内容模型

以下是对 18 个条目的归类判断，不代表全行业市场份额。

| 内容模型 | 代表站点 | 样本中的主题信号 | 对 ROAS Break 的含义 |
|---|---|---|---|
| 快讯与平台政策 | 跨境知道、亿恩网、蓝海亿观、雨果网 | 平台动态、政策、热点、卖家新闻、运营文章 | 更新频率高且同质化明显，不宜成为小型工具站的主战场。 |
| 工具与资源导航 | 卖家之家、M123、AMZ123、大数跨境、跨境眼 | 工具箱、网址目录、报告、服务商、全球开店 | 用户愿意从“任务入口”开始；ROAS Break 应强化工具与指南的双向导航，但不做泛工具黄页。 |
| 社区型知识 | 知无不言 | 问答、同行经验、按平台/任务分类 | 真实问题是选题来源；在缺少审核机制前，不应直接开放低质量 UGC。 |
| 深度研究与品牌全球化 | 36氪出海、霞光社、品牌方舟、亿邦动力 | 案例、财报、趋势、研究报告、活动 | 可借鉴“有证据的专题”，但 ROAS Break 应聚焦可计算的经营问题，而非宏观叙事。 |
| 区域/渠道垂直 | RuClub123；TT123 的目录描述 | 单一区域或 TikTok 等单渠道任务 | 垂直化有利于清楚定义用户和数据口径；可先做平台利润指南，再决定是否扩到国家/区域。 |

### 3.2 从中国站点能学到什么，不能照搬什么

**可借鉴**

- 以平台、地区、经营任务三种入口组织内容，而不是只按发布日期排列。
- 把工具、报告、操作指南和服务资源放在同一任务路径中。
- 用固定栏目建立回访理由，例如平台更新、案例、报告、问答。

**不建议照搬**

- 追逐每条平台快讯：维护成本高，且与 ROAS Break 的盈利计算能力无直接关联。
- 建立无审核的工具/服务商大全：会稀释品牌，也会引入商业关系和质量验证负担。
- 使用“行业第一”“最全”或未经披露方法的流量数字：与项目现有的透明计算立场冲突。
- 把平台归因收入、GMV 新闻或热销榜直接解释为利润机会；必须先补成本、退货、费用和归因口径。

## 4. 海外电商内容站点与官方资源基准

这里的“代表站点”用于比较内容模型，并非流量或权威排名。选择标准是：有可访问的官方 About/栏目页、覆盖零售/电商/营销的不同内容形态，并能给 ROAS Break 提供具体借鉴。下表所有链接访问日期均为 **2026-08-19**。

| 站点/资源 | 官方定位支持的主题 | 内容模型 | 可借鉴点 | 一手来源 |
|---|---|---|---|---|
| Retail Dive | 影响零售行业的新闻和趋势 | 固定 beat 的行业 newsroom | 用明确栏目持续覆盖一个经营面，而不是混合所有“出海”话题 | [About](https://www.retaildive.com/about/) |
| Digital Commerce 360 | 零售与 B2B 电商研究、媒体 | 新闻 + 研究/数据产品 | 将新闻解释与结构化研究分层，研究页说明范围和方法 | [About](https://www.digitalcommerce360.com/about/) |
| Modern Retail | 从数字视角解释零售行业重塑，包括平台、品牌和渠道变化 | 深度报道 + 产业解释 | 围绕一个清楚论点组织专题，而非堆叠快讯 | [About](https://www.modernretail.co/about/) |
| Practical Ecommerce | 帮助商家改善线上业务，形式包括专家文章、评论、指南、webcast 和 podcast | 经营者实操媒体 | 同一主题可用指南、案例、访谈等不同深度承接 | [About Us](https://www.practicalecommerce.com/about-us) |
| Marketplace Pulse | 用数据和专业分析帮助企业理解电商市场 | 数据型电商情报 | 数据来源、指标定义和更新时间应成为内容本身的一部分 | [About](https://www.marketplacepulse.com/about) |
| Baymard Institute | 独立研究在线用户体验，覆盖从字段到完整移动体验的研究 | 可检索 UX 证据库 | 把研究结论拆成可引用、可更新、可执行的证据单元 | [About](https://baymard.com/about) |
| Shopify Blog Topics | 覆盖电商营销、经营线上业务等大量主题 | 平台官方主题库 | 用用户任务和业务阶段做稳定分类，并把文章送到对应帮助/产品动作 | [Topics](https://www.shopify.com/blog/topics) |
| BigCommerce Articles | 面向电商经营者的系统资源文章 | 平台官方教育中心 | 采用基础概念、策略和平台操作的层级结构 | [Ecommerce Articles](https://www.bigcommerce.com/articles/) |
| Think with Google | 搜索、视频、消费者需求和营销策略洞察 | 平台研究/趋势中心 | 平台变化应引用平台官方解释，再补独立的利润含义 | [Search and video insights](https://www.thinkwithgoogle.com/intl/en-apac/marketing-strategies/search/) |
| Google Merchant Center Help | 商品数据、Merchant Center 设置与故障处理 | 结构化官方帮助中心 | 平台事实按任务拆分，并维护清晰层级和更新入口 | [Get started with Merchant Center](https://support.google.com/merchants/topic/7294166?hl=en) |
| TikTok for Business Blog | 产品更新、营销指南、研究与广告洞察 | 平台官方 newsroom + 指南 | 把“产品变化事实”与“经营建议”分开，注明适用市场和日期 | [Business Blog](https://ads.tiktok.com/business/en-US/blog) |
| Meta for Business News | Facebook、Instagram、Messenger 的业务资讯 | 平台官方更新中心 | 平台功能/归因变更应链接原始公告，不从二手快讯推导公式 | [Business News](https://www.facebook.com/business/news) |
| Amazon Ads Guides | ACoS、ROAS 等广告指标定义与使用说明 | 单指标官方指南 | 平台术语页应给换算、盈亏阈值、局限和工具入口 | [ACoS guide](https://advertising.amazon.com/library/guides/acos-advertising-cost-of-sales)；[ROAS guide](https://advertising.amazon.com/library/guides/return-on-ad-spend-roas) |

### 4.1 海外样本的内容模型启示

**来源事实归纳**

- 行业媒体通常明确自己的 beat：Retail Dive 聚焦零售新闻与趋势，Modern Retail 聚焦零售重塑，Digital Commerce 360 明确区分零售和 B2B 电商研究。
- Practical Ecommerce 把文章、指南、webcast 和 podcast 组合成面向经营者的内容体系，而不是只提供新闻列表。
- Marketplace Pulse 和 Baymard 把数据/研究作为产品核心；来源、研究范围和证据的可检索性比单篇文章标题更重要。
- Shopify、BigCommerce、Google、TikTok、Meta 和 Amazon 的官方资源按任务或指标组织，适合作为平台事实的首要来源，但其内容服务于各自平台，不能替代独立的跨平台利润判断。

**对 ROAS Break 的建议**

1. 学习“窄而深”的 beat：只持续覆盖会改变电商利润、获客阈值和预算决策的主题。
2. 学习数据型站点的证据纪律：每页显示公式、来源、适用范围、访问/审校日期和局限。
3. 学习实操媒体的多层内容：短答案解决定义，完整指南解决决策，工具完成计算，案例解释边界。
4. 学习官方帮助中心的任务分类，但保持跨平台独立性；官方定义之后必须回答“这对贡献利润意味着什么”。
5. 不复制 newsroom 的日更节奏；只有平台变化会改变输入、公式或结果解释时，才进入更新队列。

## 5. 建议的内容增强方向

### 5.1 定位：从计算器集合到利润决策库

建议对外承诺保持简单：

> **Know the profit threshold, understand the metric, test the decision.**<br>
> 看清利润阈值，理解指标口径，验证经营动作。

内容体系按四层组织：

```text
官方定义与数据口径
  -> 透明公式与经营含义
  -> 可编辑的示例/场景
  -> 对应工具中的计算和下一动作
```

每篇内容必须至少完成其中三层；纯资讯、纯术语解释和没有数据来源的“行业平均值”不进入主内容库。

### 5.2 五个主题支柱

| 主题支柱 | 用户要解决的问题 | 已有资产 | 内容缺口与建议 |
|---|---|---|---|
| 订单单位经济 | 一单真实留下多少钱，哪些成本能用于广告预算？ | Break-Even、Profit Lever；贡献毛利、收入口径、退货指南 | 增加公式总览、费用清单、缺失成本检查和可复制工作表。 |
| 渠道指标翻译 | Google、Amazon、Meta、TikTok 的 ROAS/ACoS/CPA 各代表什么？ | Target ROAS；ROAS vs ACoS、Attributed ROAS vs MER | 增加按平台的利润阈值指南，并统一解释倍数、百分比、归因窗口和收入分子。 |
| 定价与促销经济 | 折扣、免邮、组合装需要多少增量才不伤利润？ | Promotion Profit、Scenario Planner | 增加免邮、折扣 vs bundle、涨价、费用变化等决策指南，全部回到促销/场景工具。 |
| 新客价值与现金回收 | 首单亏损能否由复购收回，多久回本？ | CAC Payback | 增加新客 ROAS、贡献 LTV、cohort 数据准备和回本现金需求指南。 |
| 归因与数据可信度 | 平台数据什么时候成熟，退款与重复归因如何处理？ | Attributed ROAS vs MER、Revenue Basis | 增加转化延迟、归因窗口、退款回填、平台/店铺对账和数据成熟度检查。 |

### 5.3 明确不做的内容

- 不做泛跨境日报、融资快讯、热销产品榜和服务商软文。
- 不发布没有样本、时间范围和计算方法的“行业 ROAS 基准”。
- 不把平台官方案例中的 attributed revenue 直接称为增量收入或利润。
- 不为每个近义关键词复制一篇页面；同一决策的 ROAS、CPA、ACoS 输出应在一个页面解决。
- 不在来源失效或平台规则不明时给确定性结论；标注待核验并降低页面优先级。

## 6. 研究导出的内容清单

以下是建议的主题列表，不代表已经授权实现。优先级依据是：与现有工具的连接强度、经营决策的明确程度、一手来源可得性和维护成本。

### P0：先建立可信度与核心决策闭环

| ID | 页面/改动 | 回答的问题 | 主要承接 |
|---|---|---|---|
| CNT-001 | 统一升级现有 5 篇指南 | 每篇是否有清楚定义、完整示例、来源、审校日期、假设和下一动作？ | 对应现有工具 |
| CNT-002 | 新建 `/methodology/` | ROAS Break 使用什么收入口径、成本边界、舍入规则与审校流程？ | 全站信任入口 |
| CNT-003 | 新建 `/guides/ecommerce-profit-formulas/` | 贡献毛利、盈亏 ROAS、目标 CPA、POAS、MER、CAC 回收如何关联？ | Tools directory |
| CNT-004 | 新建 `/guides/poas-vs-roas/` | 收入 ROAS 为什么可能盈利很差，何时看贡献利润/广告费？ | Break-Even、Scenario Planner |
| CNT-005 | 新建 `/guides/new-customer-roas-vs-blended-roas/` | 新客获客和新老客混合收入为什么需要不同阈值？ | CAC Payback、Scenario Planner |
| CNT-006 | 新建 `/guides/shopify-net-sales-for-roas/` | Shopify 的 gross/net/total sales、税、运费、退款如何进入 ROAS？ | Break-Even、Revenue Basis |
| CNT-007 | 新建 `/guides/amazon-break-even-acos/` | Amazon ACoS 如何由贡献毛利变成盈亏线和利润目标？ | Target ROAS |
| CNT-008 | 新建 `/guides/google-ads-target-roas-profit/` | Google 的 tROAS 百分比如何从目标利润反推，何时会过高？ | Target ROAS |
| CNT-009 | 新建 `/guides/free-shipping-profit-threshold/` | 免邮需要提升多少 AOV、订单或 CVR 才能补回履约成本？ | Promotion Profit |
| CNT-010 | 新建 `/guides/discount-vs-bundle-profit/` | 同一销量目标下，直接折扣与组合装哪个贡献利润更好？ | Promotion Profit、Scenario Planner |

### P1：补齐平台口径、回收与数据质量

| ID | 页面/改动 | 回答的问题 | 主要承接 |
|---|---|---|---|
| CNT-011 | 新建 `/guides/meta-ads-roas-and-attribution/` | Meta 的归因窗口和平台收入如何影响盈亏判断？ | Break-Even、Attributed ROAS vs MER |
| CNT-012 | 新建 `/guides/tiktok-shop-roas-and-attribution/` | 点击/展示归因和 TikTok Shop 收入口径如何进入利润判断？ | Break-Even、Scenario Planner |
| CNT-013 | 新建 `/guides/cac-payback-cohort-data/` | 30/60/90/180/365 天累计贡献数据应如何准备？ | CAC Payback |
| CNT-014 | 新建 `/guides/conversion-delay-and-data-maturity/` | 最近几天的 ROAS 是否已经成熟到可以调预算？ | Target ROAS |
| CNT-015 | 新建 `/guides/refunds-and-conversion-adjustments/` | 退款、取消和部分退款应如何回填广告/分析数据？ | Returns and Discounts |
| CNT-016 | 新建 `/guides/marketplace-fees-profit-checklist/` | 佣金、支付、FBA/履约、仓储和广告费哪些不能遗漏？ | Break-Even、Profit Lever |
| CNT-017 | 新建 `/guides/average-vs-marginal-roas/` | 平均 ROAS 很好时，为什么加预算仍可能减少利润？ | Scenario Planner |
| CNT-018 | 新建 `/guides/currency-tax-duty-roas/` | 跨币种、VAT/GST、关税和汇率变化应放在收入还是成本？ | Break-Even、Profit Lever |

### P2：有真实数据后再扩展

| ID | 页面/改动 | 前置条件 |
|---|---|---|
| CNT-019 | 透明案例系列：商品、渠道、促销、CAC 回收各 1 篇 | 有可公开的输入、假设、结果和授权；不能用虚构案例冒充客户结果。 |
| CNT-020 | 平台规则更新日志 | 已建立来源负责人、检查周期和“影响公式/仅影响文案”的分级流程。 |
| CNT-021 | 国家/区域利润清单 | 用户数据证明某市场有持续需求，并能获得当地税费/平台官方来源。 |
| CNT-022 | 模板下载/CSV 导入指南 | 对应工具已支持稳定的数据输入与错误提示。 |

### 6.1 首批内容的一手资料底座

平台事实应优先从下列官方页面开始，所有链接访问或复核日期为 **2026-08-19**：

- 收入、退款和商品字段：[GA4 ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)；Shopify [Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) 与 [Marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports)。Shopify 页面可能拒绝自动化 GET，发布前应在浏览器再次人工核验正文与更新时间。
- Google 目标与延迟：[About Target ROAS bidding](https://support.google.com/google-ads/answer/6268637?hl=en)；[conversion adjustments](https://support.google.com/google-ads/answer/7686447?hl=en)。
- Amazon 指标：[ACoS](https://advertising.amazon.com/library/guides/acos-advertising-cost-of-sales)；[ROAS](https://advertising.amazon.com/library/guides/return-on-ad-spend-roas)。
- TikTok 归因：[Attribution windows](https://ads.tiktok.com/resources/help/article/about-attribution-windows-at-the-ad-group-level?lang=en)；平台页面的适用地区和当前版本必须随文章记录。
- Meta 归因与报告：[Marketing API Insights](https://developers.facebook.com/docs/marketing-api/insights/)；页面中要区分平台报告能力与独立增量性结论。

## 7. 内容发布标准

### 7.1 每篇决策指南的固定结构

1. **一个经营问题**：标题和开头直接说明要做什么决定。
2. **60 秒答案**：给结论、适用条件和最重要的风险，不用长背景铺垫。
3. **口径表**：列出分子、分母、是否含税/运费/退款、归因窗口和数据日期。
4. **透明公式**：变量名与工具一致，单位和百分点明确分开。
5. **完整示例**：输入、过程、结果、敏感变量都可复算；示例明确标记，不冒充行业基准。
6. **做出动作**：链接到唯一最相关的计算器，并尽量把示例或用户状态带入工具。
7. **边界与反例**：说明何时不能使用该结论，例如样本未成熟、ROAS 非增量、LTV 没有 cohort 数据。
8. **来源与更新**：显示官方来源、访问日期、最后审校日期、适用地区和更正入口。

### 7.2 信息架构

- `/guides/` 按五个主题支柱分组，同时保留“从哪个决定开始”的任务入口；不要默认按发布时间排序。
- 当同一平台达到至少 3 篇真正不同的决策内容后，再考虑建立平台聚合页；不要先创建空目录或薄页。
- 每个工具页链接 2–4 篇最相关指南，每篇指南只设置一个主工具 CTA，避免循环导航。
- 平台名、指标名和公式进入统一术语表；ROAS、MER、POAS、ACoS、CAC、LTV 的大小写与定义全站一致。

### 7.3 更新与质量控制

- 平台官方页面变更、公式输入变化、链接失效或用户更正，触发内容复核。
- 只影响界面名称的变化标记为“文案更新”；改变指标口径、归因窗口或可用数据的变化标记为“计算影响”，优先处理。
- 平台系列至少每季度检查一次来源可达性；不是为了机械改日期，只有核验完成后才能更新 `dateModified`。
- 涉及税务、法律、合规和国家费率的页面必须给出地域/时间边界，并避免个案建议。

## 8. 分阶段 TODO

> 状态同步：2026-08-21，依据 `main` 分支 `8974a66`、`content/content-inventory.json`、内容校验和 E2E。`[x]` 表示仓库产物与现有验收证据均已存在；部分完成仍保留 `[ ]`，并在条目中说明剩余工作。

### 阶段 A：内容基础设施

- [x] 完成 CNT-001：用统一模板审计并升级原有 5 篇指南。
- [x] 完成 CNT-002：发布方法论页，公开收入、成本、归因、舍入和来源规则。
- [x] 为指南增加可见的最后审校日期、来源列表、适用范围和更正入口；全部已登记资产使用唯一 `data-content-scope` 显示地区/平台边界，并由内容校验强制检查。
- [x] 将 `/guides/` 从平铺列表改为五个主题支柱，并补充主题导航及移动端 E2E。
- [x] 建立来源清单字段：每条来源记录 URL、所有者、核验日期、适用地区和复核状态；父资产的 URL/file 明确影响页面，内容校验强制检查结构、日期、HTTPS、正文引用和发布前 verified 状态。

### 阶段 B：首批高意图内容

- [x] 发布 CNT-003：电商利润公式总览。
- [ ] 发布 CNT-004：POAS vs ROAS。
- [x] 发布 CNT-006：Shopify 收入口径。
- [x] 发布 CNT-007：Amazon break-even ACoS。
- [x] 发布 CNT-008：Google tROAS 利润目标。
- [x] 在每篇页面验证“指南 -> 工具 -> 结果”的完整路径；参数化 E2E 覆盖全部已发布指南/方法论的可见结果、输入和 URL 恢复，并同时运行桌面与移动项目。
- [ ] 对相似查询做内容合并检查，防止现有 ROAS vs ACoS、Revenue Basis 被新页面重复覆盖。**部分完成：** 内容校验已强制 `primaryIntent` 非空且大小写无关精确唯一；仍缺能识别近义意图的发布前人工审查记录。

### 阶段 C：促销、新客与平台口径

- [ ] 发布 CNT-005：新客 ROAS vs blended ROAS。
- [ ] 发布 CNT-009：免邮利润阈值。
- [ ] 发布 CNT-010：折扣 vs bundle 利润。
- [ ] 发布 CNT-011：Meta 广告 ROAS 与归因。
- [ ] 发布 CNT-012：TikTok Shop ROAS 与归因。
- [x] 发布 CNT-013：CAC payback cohort 数据准备。
- [ ] 发布 CNT-014：转化延迟与数据成熟度。
- [ ] 发布 CNT-015：退款与 conversion adjustments。
- [ ] 用站内搜索词、工具使用路径和用户问题决定 CNT-016 至 CNT-018 的顺序，不凭“热门赛道”猜测。

### 阶段 D：验证后扩展

- [ ] 启动 CNT-019 透明案例系列；前置条件是取得透明、可公开且有授权的数据。
- [ ] 启动 CNT-020 平台规则更新日志；前置条件是平台变更确实影响计算或决策，并已明确来源负责人。
- [ ] 启动 CNT-021 国家/区域内容；前置条件是出现持续区域需求且能维护当地一手来源。
- [ ] 启动 CNT-022 模板下载/CSV 导入指南；前置条件是对应工具已有稳定输入、校验和错误恢复能力。

### 8.1 后续执行计划

1. **关闭剩余 P0 质量缺口**：把近义意图人工审查、事实/建议与算例复算、生产 smoke 和发布检查保存为可复核记录；自动字段与本地 E2E 不能替代这些发布证据。
2. **完成剩余核心决策内容**：接着做 CNT-004 和 CNT-005，补齐利润指标边界及新客口径；再做 CNT-009、CNT-010 和 backlog 中的折扣/贡献 LTV 条目，补齐促销与客户经济主题。
3. **补平台与数据成熟度工作流**：完成 CNT-011、CNT-012、CNT-014、CNT-015；每篇记录平台适用地区、当前归因/报表口径、核验日期和复查周期。
4. **用真实信号决定第二批顺序**：依据 Search Console 查询、`guide_to_tool_clicked`、计算完成和用户问题，在 CNT-016 至 CNT-018 之间排序；没有信号时不扩写。
5. **建立复盘门禁后再进入 P2**：每篇发布后执行生产验证，并在 30/60/90 天做“扩展、重写、合并、继续观察”决策；只有前置条件满足时才启动 CNT-019 至 CNT-022。

## 9. 衡量方式

不以文章数量作为主要成功指标。建议按以下信号评估内容是否增强了产品：

- 指南到对应工具的点击率，以及进入工具后的有效输入/计算完成率。
- 从工具返回相关指南的比例，判断口径说明是否解决了真实疑问。
- 场景链接复制、结果复制和后续工具跳转等决策动作。
- 进入站点的查询是否逐步从泛“ROAS 是什么”转向“break-even ACoS”“free shipping threshold”等具体经营任务。
- 来源失效数、超过复核周期的页面数和更正响应时间。
- 同一主题下的回访与跨页使用，而不是单篇短时浏览量。

## 10. 来源覆盖与限制

- FastMoss 栏目已完整覆盖 18/18 条，并通过页面与公开接口交叉核验。
- 17 个有效目标中均核对了官方首页、About、栏目或资源页；亿恩首页触发滑动验证，但使用其官方 About/平台页；TT123 因 FastMoss 链接为 `#`，未完成条目归属的一手核验。
- 海外基准覆盖 13 个内容/资源模型，全部使用各站官方 About、栏目、资源或指标指南；它们是有意选择的比较样本，不是“全球前 13”排名。
- 本文不包含第三方流量、SEO 难度、关键词量或商业收入数据。页面优先级需要在实施前结合 Search Console、站内行为和实际用户问题复核。
- 站点栏目和平台规则会变化；本文是 2026-08-19 的可复核快照，不应当作永久目录。
