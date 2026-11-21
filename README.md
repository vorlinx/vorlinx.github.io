# Vorlinx 官网

纯静态、多语言官网，发布入口为根目录 `index.html`。生成的 HTML 已内嵌完整 CSS 和 JavaScript，避免新版 HTML 与旧缓存样式、脚本混用；正文、导航和元信息在不运行 JavaScript 时也完整可读。

## 本地预览

```sh
./start.sh
```

打开 <http://localhost:2611>，按 Ctrl+C 停止。需要 Python 3 和 Node.js；服务仅监听本机。脚本先生成页面，再监听源码与原始截图变化。保存后等待终端生成成功，刷新浏览器即可。已启动的旧版 Python 服务需要停止并重新运行一次脚本，才能开启自动生成。

初次生成或替换截图需要本机有 `cwebp`（WebP 工具）。没有新截图时不会重新编码已有派生图片。GitHub Pages 直接提供已提交的 HTML 与资源，不需要 Node、Python 或构建服务。

## 源码与生成

- `index.html`：默认简体中文结构，也是其他语言页面共用的模板。编辑其中的页面结构即可；不要编辑标记为 `INLINE-CSS`、`INLINE-JS`、`SEO` 的自动生成区域。
- `style.css`：唯一的样式源码。
- `app.js`：图标和下载说明交互源码。
- `i18n.js`：三语言文案、菜单、语言切换和元信息更新源码。
- `site.config.json`：发布域名、默认语言及语言列表。
- `scripts/build-site.mjs`：生成完整静态页面、robots.txt 和 sitemap.xml，同时检查并准备图片派生资源。
- `scripts/prepare-images.mjs`：从原 PNG 生成内容指纹命名的 PNG 回退资源与无损 WebP 响应式资源。
- `scripts/watch-site.mjs`：本地监听与自动生成。

手动生成与检查：

```sh
node scripts/build-site.mjs
node scripts/check-site.mjs
node scripts/check-language-runtime.mjs
```

生成后提交 HTML、资源、源码与脚本。修改拆分源码后需要重新生成，页面不再直接请求 `.css` 或 `.js` 文件。浏览器仍可能缓存旧 HTML，但它携带的是相互匹配的旧样式和脚本；本次方案不承诺绕过所有浏览器或 CDN 的 HTML 缓存。

## 多语言页面与 SEO

正式首页为 `/zh-hans-cn/`、`/zh-hant-tw/`、`/en-us/`；根网址打开默认简体版本。各语言下都有 `faq/`、`privacy/`、`support/`、`about/`。这些地址同时供用户和搜索引擎访问。

每页包含独立标题和摘要、canonical、hreflang、社交分享元信息和与内容相符的结构化数据。语言切换保留当前页面类别和原有动画；旧 `?lang=...` 链接仍能识别。根 `404.html` 供 GitHub Pages 错误路由使用，各语言亦提供 404 页面；错误页面标为 noindex，不在 sitemap 中，也不会自动跳首页伪装成功。

修改 `site.config.json` 的 `baseUrl` 后重新生成，可更新发布网址。换域名仍需另行配置 GitHub Pages、DNS 和旧地址迁移。

Search Console 所有权验证、站点地图提交和在线性能验收尚未执行。爬虫规则允许公开官网被抓取，包括搜索及 AI 爬虫；不保证收录、排名或进入模型训练。没有添加统计追踪或虚构评分、价格。应用的本地文件与官网爬虫无关。

## 截图

共用品牌图标在 `assets/shared/`。各语言的原始 PNG 保留在以下目录，不会被图片优化脚本改写：

```text
assets/zh-hans-cn/
assets/zh-hant-tw/
assets/en-us/
```

| 文件名 | 内容 |
| --- | --- |
| `link.png` | 首页文件画布 |
| `groups.png` | 分组 |
| `pdf.png` | PDF 批注与便签 |
| `files.png` | Markdown 编辑与任务 |
| `reading.png` | 自定义音色朗读 |
| `search.png` | 自然语言搜索 |
| `import.png` | 手机导入 |
| `sharing.png` | 分享方 |
| `recipient.png` | 接收方 |
| `backup.png` | 加密备份 |

替换同名原图后重新生成即可。生成器自动读取每种语言的实际尺寸，输出 `picture`、WebP `srcset`、`sizes` 与 PNG 回退；切换语言同步更新尺寸和资源。新图片内容产生新文件名，避免复用旧缓存。派生资源在 `assets/optimized/`，映射在 `assets/image-manifest.json`，不应手工编辑。

为兼容可能仍被缓存的旧页面，生成器保留旧的内容指纹资源，不会自动删除。图片优化不向外部服务上传文件。

软件画面不叠加网页模拟便签或高亮，真实截图中的效果原样保留。日后若放录屏，需将对应画面单独改为 video。

可选演示图脚本 `scripts/generate-example-screenshots.py` 默认保留现有 PNG；仅显式传入 `--overwrite` 才覆盖。它用于生成概念资料，不要对已替换的实拍截图运行覆盖命令。

## 发布内容状态

发布渠道为 Mac App Store，正式下载链接、联系邮箱、发布主体等信息仍待提供。部分模型或语言资源需要先准备；长音频相关语音能力用到了 macOS 26 API，推荐配置不等于所有功能的最低系统版本。多云加密备份同步明确标为后续计划。

隐私政策以本地处理、模型下载、主动局域网分享、加密备份与用户管理数据为基础，正式发布前需确认真实数据行为及联系信息。用户许可链接指向 Apple 官方标准 EULA。

## GitHub Pages

将仓库推送至 GitHub，Settings → Pages 发布源选择 `main`、根目录 `/`。`.nojekyll` 保证静态文件直接提供。网站地址以 `site.config.json` 配置为准。
