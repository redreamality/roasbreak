# Project Agent Instructions

- 所有推送仓库默认设为私有仓库。
- Python 包管理默认使用 `uv`。
- Node.js 包管理默认使用 `pnpm`。
- 使用中文交流。
- 写入大文件时，采用少量、多次编辑。
- 修改交互细节后，必须添加对应的 E2E 测试验证行为。

## 避坑规则

- 写入 `allkeys.json` 等由 `switch.py` 读取的 JSON 文件时，绝不能带 UTF-8 BOM；PowerShell 应使用 `utf8NoBOM`，或使用明确禁用 BOM 的 UTF-8 编码器。
- `gopass` 出现 `Decryption failed: exit status 1` 时，可能只是 GPG pinentry 等待输入超时。先重试并给用户留出确认时间，再排查 recipient。
- 空目录执行 `rg --files` 会因无匹配返回退出码 1。盘点空项目时改用 `Get-ChildItem -Force`，不要把退出码 1 当成工具缺失。
- 在执行 `git status` 等仓库命令前，先确认当前目录包含 `.git`；全新空目录应先初始化仓库。
- Google OAuth 刷新出现 `invalid_grant: Bad Request` 时，通常是本地缓存令牌已失效。先将对应 token 文件改名备份，再重新运行脚本触发授权，不要反复使用失效令牌重试。
- 新建 Vite + TypeScript 项目若配置文件引用 `process`，必须安装 `@types/node` 并在 `tsconfig.json` 的 `types` 中包含 `node`。
- TypeScript 7 对 CSS 副作用导入执行类型检查时，应在项目中引用 `vite/client` 类型，否则会报 TS2882。
- `vite.config.ts` 包含 `test` 配置时，`defineConfig` 必须从 `vitest/config` 导入；从 `vite` 导入会因不认识 `test` 字段报 TS2769。
- 新安装或升级 `@playwright/test` 后若提示浏览器可执行文件不存在，先运行 `pnpm exec playwright install chromium`，使本地浏览器版本与 Playwright 包同步，再执行 E2E。
- Playwright 的完整 Chromium 与 `chromium_headless_shell` 是两个独立产物；下载中断可能只留下前者。安装后应核对报错所指的精确可执行文件，缺少 headless shell 时使用 `pnpm exec playwright install --only-shell chromium` 补装。
- Playwright `getByLabel` 在输入标签与包含同一前缀的图表 `aria-label` 并存时会触发 strict mode 多匹配；表单控件定位应使用 `{ exact: true }` 或明确的 role + name。
- 自动化连续启动多轮 Playwright 时，`reuseExistingServer: true` 可能复用上一轮正在退出的 Vite 进程，随后出现 `ERR_CONNECTION_REFUSED`。项目 E2E 默认让 Playwright 独占测试服务器，设置 `reuseExistingServer: false`。
- 标签内部还包含前后缀节点时，Playwright 的精确可访问名称可能与可见主标签不同；已有稳定唯一 ID 的数值输入应直接使用 ID。原生 `<summary>` 不应假设为 `term` role，使用其可见文本或元素选择器定位。
- PowerShell 中给 `rg` 传含括号、管道或引号的复杂正则时使用单引号包裹，避免双引号转义导致解析器提前终止；敏感信息扫描无匹配时应显式接受 `rg` 退出码 1。
- 当前 GitHub 账号套餐不支持私有仓库启用 GitHub Pages，会返回 HTTP 422。不要为绕过限制擅自公开仓库；私有静态站改用 Cloudflare Pages，并通过 GitHub Secrets 注入部署凭据。
- `gsc_cli.py` 的 `--json` 是全局参数，必须写在子命令之前（如 `gsc_cli.py --json list`）；放在 `list` 等子命令之后会报 `unrecognized arguments`。
- `mcp-gsc` 的 Analytics、Search Console 与 Site Verification OAuth token 按 scope 分文件缓存；其中一份 `invalid_grant` 不代表其他 token 失效，只轮换报错对应的 token 文件。
- Windows 下通过 Ctrl+C 停止 `pnpm dev` 可能继续提示 `Terminate batch job (Y/N)`；发送 `Y` 后退出码 1 是预期的手动停服结果，不要误判为应用运行失败。
- 需要结束无用户回调的 Google OAuth 本地服务器时，先用 `Get-NetTCPConnection -LocalPort <port>` 精确取得监听 PID，再停止该进程；原等待命令随后退出码 1 是预期终止结果。
- Windows PowerShell 5.1 的 `Invoke-WebRequest` 解析现代 HTML 时可能因兼容性问题抛出 `NullReferenceException` 并返回空响应；线上探测应加 `-UseBasicParsing`，或改用 `curl.exe`。
- PowerShell 中不能把 `foreach (...) { ... }` 语句块直接接到管道；会在解析阶段报 `An empty pipe element is not allowed`。需要汇总输出时，先将循环结果赋给变量，再单独执行 `$results | Format-Table`。
- Shopify Help Center 可能对 HTTP `HEAD` 请求返回 403，即使同一 URL 用普通 `GET` 可以正常访问。核验 Shopify 官方资料链接时使用 `GET`（可配合 `-UseBasicParsing`），不要仅凭 `HEAD` 结果判定链接失效。
- Windows 下不要让 `Get-Content`、`rg` 等命令并行读取同一份刚写完的大文件；可能出现瞬时文件锁并报 `os error 32`。同文件的完整读取与结构扫描应串行执行，锁释放后再重试。
- `git push` 偶发出现 `Recv failure: Connection was reset` 时，本地 commit 通常已经成功，只是 HTTPS 传输被重置。先用 `git status` 和 `git log` 确认提交仍在，再重试 push；不要重复 commit 或重写历史。
- TypeScript 严格模式下，即使顶层 DOM 查询随后做了空值检查，闭包函数里也可能不保留该收窄并报 TS18047。将查询结果检查后赋给显式非空的 `HTMLElement` 常量，再供各函数闭包使用；同时保持 `noUnusedLocals` 下无遗留类型或函数导入。
