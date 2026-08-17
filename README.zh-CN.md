# dsh-anchored-monitor

> DeepSeek Harness 实时思维链锚定监控与干预插件。
> 持续监测每个 reasoning 块的 we / let's / let me 指纹, 让会话稳定在 spec 波段,
> 轨迹漂移时自动分级干预把模型拉回来。

[![npm version](https://img.shields.io/npm/v/@a9i5k4/dsh-anchored-monitor)](https://www.npmjs.com/package/@a9i5k4/dsh-anchored-monitor)
[![GitHub stars](https://img.shields.io/github/stars/Aik358/dsh-anchored-monitor?style=social)](https://github.com/Aik358/dsh-anchored-monitor)
[![license](https://img.shields.io/npm/l/@a9i5k4/dsh-anchored-monitor)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22.19-blue)](#环境要求)

![dashboard](docs/dashboard.png)

[English](README.md) | **简体中文**

---

## 为什么做这个

DeepSeek V4 Pro 强烈依赖**首轮请求**展示给它的内容来选择执行轨迹。社区实测:
官方 Minimal 预设(46 字符 persona + `bash`/`str_replace_editor` 双工具)锚定出
集体规划式 "we" 轨迹, Project2 得分 99/96; 而完整 Standard 预设锚定出行动者式
"let me" 轨迹, 得分只有 91。行为是**路径承诺的**: 一旦锚定, 之后即使扩展工具目录
最多扰动一个 reasoning 块, 思维模式不会自己翻转回来。

锚定类预设([dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard))
解决了"如何启动"。本插件解决**锚定之后**: 命令式提示、过长上下文注入等外部因素
会把轨迹拖出 spec 带, 此前没有任何机制能实时发现并修复这种漂移。

## 功能

- **实时指纹** — 每个 reasoning 块按 spec 轨迹词(we / let's / we'll / we need / our)
  与 react 指纹(let me)计分, 滑窗聚合。i will / i'll / i need 属规划标记, 归中性。
- **三波段模型** — 严格按 [dsh-router-standard](https://github.com/yjh051108/dsh-router-standard)
  实测量化: `persona_ratio < 0.2 → spec`, `0.2–0.5 → mixed`(不稳定过渡带),
  `≥ 0.5 → react`。
- **分级干预** — 自动触发、按级冷却、迟滞恢复:

| 级别 | 触发条件 | 动作 |
|------|----------|------|
| L1 引导 | 进入过渡带 | 注入**建议式**提示(严禁命令式——命令式会把 we 轨迹打回 let me) |
| L2 重置 | 进入 react 带 | 下一轮请求 persona 换回 46 字符 Minimal 句 + 仅 `bash`/`str_replace_editor`; 监控窗口与基线清零 |
| L3 重启 | L2 重试次数超限 | 建议终止并重启会话 |

- **液体毛玻璃 Web UI** — 左侧栏入口打开浮在对话上方的毛玻璃面板(可拖动/缩放/记忆位置);
  收起态变成**变阻器式悬浮条**: 思考强度即滑条位置, 附带日志滚动。DeepSeek 白/灰/蓝主色调,
  语义色只用于波段与告警, 支持深色主题。
- **全配置化实验** — 词典、权重、阈值、窗口、波段边界、冷却全部在 YAML
  (`config/*.yaml`, 经 `config/schema.json` 校验)。JSONL 实验日志、离线回放、
  网格搜索校准脚本齐备。
- **完全解耦** — 监控是独立 Node 进程, 不占用模型算力, 不修改模型上下文。

## 环境要求

- Node.js ≥ 22.19
- DeepSeek Harness 0.1.0-rc.5+(Web 插件与 preset 需要)

## 安装

```bash
# 1) 把 Web 插件装进 web profile(dsh CLI 是 pnpm 转发器)
dsh plugin --profile web add @a9i5k4/dsh-anchored-monitor

# 2) 启动监控进程
npx anchored-monitor --profile demo

# 3) 重启 DeepSeek Harness(host bundle), 刷新 Web GUI
```

左侧栏底部出现「锚定监控 / Anchored Monitor」入口。点击打开玻璃面板;
点击悬浮条可展开/收起。修改监控地址: 编辑 `~/.dsh/anchored-monitor.json`
或 `POST /api/anchored-monitor/config` `{ "monitorUrl": "http://127.0.0.1:9301" }`。

## 快速演示

```bash
git clone https://github.com/Aik358/dsh-anchored-monitor.git
cd dsh-anchored-monitor
npm install && npm run build

npm run demo:generate                # 生成 300 个合成 reasoning 块
npm run dev -- --profile demo        # 监控进程 + 仪表盘(:9301)
npm run demo:feed                    # 实时投喂(观察 L1→L2 干预级联)
```

## Agent 侧 preset(可选)

把 `preset/` 复制到 `~/.dsh/.agent-presets/anchored-monitor`, 即可让 *harness agent*
在推理循环内推送自己的 reasoning 块并执行 L1/L2/L3 干预(建议与锚定类预设如
dsh-anchored-standard 配合完成首轮锚定)。

## API

监控进程(默认 `http://127.0.0.1:9301`):

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/overview` | 会话 + 选中快照 + 尾部事件一次拿全 |
| GET | `/api/sessions` | 会话摘要 |
| GET | `/api/sessions/:id` | 完整快照(历史/干预/基线) |
| GET | `/api/events?sessionId=&limit=` | 实验 JSONL 尾读 |
| POST | `/api/push` | 推送 reasoning 块 `{sessionId, text, sequence?, timestamp?}` |
| POST | `/api/sessions/:id/ack` | 干预执行确认 |
| POST | `/api/sessions/:id/reset` | 手动 L2 重置 |
| GET | `/api/stream` | SSE 事件流 |

Web 插件经 `/api/anchored-monitor/*` 同源代理(loopback-only)。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run demo:generate` | 生成合成会话 JSONL(带 label, 供校准) |
| `npm run demo:feed` | 逐块投喂给运行中的监控进程 |
| `npm run replay -- --file x.jsonl` | 离线回放 + 统计摘要 |
| `npm run calibrate -- --file x.jsonl` | 网格搜索窗口/权重/阈值 |
| `npm run preview:build` | 把仪表盘快照成独立 HTML |

## 配置

完整参数手册见 [docs/experiment-params.md](docs/experiment-params.md)。
一切皆 YAML, 零硬编码策略。

## FAQ

**L2 会截断模型上下文吗?**
不会。L2 只替换下一轮请求的 *persona 段*(46 字符 Minimal 句)并把可见工具目录
收缩到双工具; 对话历史全部保留; 监控进程清空的只是自己的指纹统计(模型不可见)。
plan-mode 等其他段原样保留——删掉它们会导致"重复探索仓库"式失忆(dsh-router-standard 实测)。

**为什么把过渡带当告警?**
mixed 带(0.2–0.5)是训练分布缺口: 实测得分低于任一稳定带。进入即触发 L1 建议式引导;
进入 react 带升级 L2。

**运行安全吗?**
监控进程对模型只读: 消费 reasoning 文本、发送干预信号。所有 HTTP 路由 loopback-only。
reasoning 文本可能含敏感信息, 实验日志默认本地落盘, 可在 `experiment_log` 关闭/轮转。

## 致谢

实现依据以下社区项目实测成果(浅克隆于 `../references` 供审计):

- [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard) — 两阶段锚定预设(双工具、晋升门、晋升后常驻集)
- [ruler770525/dsh-anchored-flash](https://github.com/ruler770525/dsh-anchored-flash) — 指纹计数(`we`/`let's`/`let me`)与 E1/E1.5 措辞实验
- [yjh051108/dsh-router-standard](https://github.com/yjh051108/dsh-router-standard) — 双吸引子论文与三波段量化(`bandOf`)
- [KDB-Wind/dsh-minimal-anchored](https://github.com/KDB-Wind/dsh-minimal-anchored) — Minimal 工具锚定替代方案
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — 本插件扩展的宿主框架

## License

[MIT](LICENSE) © 2026 Aik358
