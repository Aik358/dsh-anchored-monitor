# 实验参数手册

全部参数在 `config/*.yaml` 中定义, 启动时经 `config/schema.json` 校验。改配置不需要改代码。

## 参数清单

| 类别 | 配置路径 | 默认 | 说明 |
|---|---|---|---|
| 事件源类型 | event_source.type | log_tail | log_tail(监听会话日志) / ipc_push(插件推送) |
| 轮询间隔 | event_source.poll_interval_ms | 50 | 日志 tail 轮询间隔(毫秒) |
| 起读位置 | event_source.start_from | beginning | beginning(全量回放) / end(只读新事件) |
| reasoning 字段 | event_source.log_event_reasoning_fields | [reasoning, reasoning_content, reasoningText] | JSONL 事件行中候选字段 |
| 窗口类型 | window.type | sliding | sliding(固定滑窗) / decay(指数衰减) |
| 窗口大小 | window.size | 20 | 滑窗长度: 越大越稳、越小越敏感 |
| 衰减系数 | window.decay_lambda | 0.05 | 指数衰减速率 |
| 正向词典 | features.lexicon.positive | we/let's/we'll/we need/our | spec 轨迹指纹, 可增删词与权重 |
| 负向词典 | features.lexicon.negative | let me | **仅 react 指纹**; i will/i'll/i need 属规划标记, 在中性词典 |
| 中性词典 | features.lexicon.neutral | i will/i'll/i need/check/verify | 规划标记与验证类, 轻微正向 |
| 正则特征 | features.regex_features | question_marks/bullet_list | 任意文本特征 |
| 评分类型 | scoring.type | weighted_ratio | weighted_ratio / percentile / composite |
| 评分权重 | scoring.weights.alpha/beta/gamma/epsilon | 2.0/0.5/1.5/1.0 | score=(α·P+β·N)/(γ·neg+ε) |
| 归一化 | scoring.normalize | true | 分位数归一化到 0-100 |
| 分位窗口 | scoring.percentile_window | 200 | 分位数历史长度 |
| 波段模式 | bands.mode | persona_ratio | persona_ratio = let me 数/(正向词数+let me 数) |
| spec 上界 | bands.spec_max | 0.2 | ratio<0.2 → spec(router-core bandOf) |
| react 下界 | bands.react_min | 0.5 | ratio≥0.5 → react; 中间为过渡带 mixed |
| 基线最小样本 | threshold.baseline_min_samples | 10 | 基线就绪前不判定(band=unknown) |
| 基线窗口 | threshold.baseline_window | 50 | 均值/标准差计算窗口 |
| 趋势窗口 | threshold.trend_window | 5 | 近期均值 vs 前一窗口均值 |
| 趋势斜率阈值 | threshold.trend_slope_sigma | 0.25 | 漂移>0.25σ 判 rising/falling |
| 触发规则 | threshold.trigger | mixed_band/react_band | 波段跨越直接触发; sigma/percentile/safety_floor 为可选统计规则(需趋势佐证) |
| 恢复阈值 | threshold.recovery | spec_band | 迟滞: ratio 回到 spec 带(<0.2)且趋势不降才解除告警; 可选 sigma/safety_floor |
| 安全线 | threshold.safety_floor | 10.0 | 归一化分绝对低线 |
| L1 冷却 | intervention.cooldowns.L1_ms | 30000 | 冷却期内不重复触发 |
| L2 冷却 | intervention.cooldowns.L2_ms | 120000 | |
| L3 冷却 | intervention.cooldowns.L3_ms | 0 | |
| L2 重试上限 | intervention.max_L2_attempts | 2 | 超限升级 L3 |
| 决策规则 | intervention.rules | 见 default.yaml | when/trend/L2_attempts_lt/gte → action, 按序匹配 |
| 提示模板 | intervention.hint_templates | 3 条建议式 | **措辞纪律: 禁止命令式(must/first/follow)** |
| 重置工具 | intervention.bootstrap_tools | [bash, str_replace_editor] | Minimal 精确双工具 |
| 重置 persona | intervention.bootstrap_system_prompt | 46 字符 Minimal 句 | 逐字节对齐官方 Minimal |
| 日志路径 | experiment_log.path | ./logs/experiment.jsonl | JSONL 事件流 |
| 日志轮转 | experiment_log.max_file_size_mb / rotate | 50 / true | 超限重命名 .<ts> |
| 服务地址 | dashboard.host/port | 127.0.0.1/9301 | 仪表盘 + API + SSE |

## 事件类型(JSONL)

block_received / window_updated / score_computed / threshold_check / intervention_triggered / intervention_executed / ack_received / session_start / session_end / config_loaded

## 离线校准流程

1. 收集多组真实会话日志(高分/低分), 标注波段翻转点
2. `npm run replay -- --file <log.jsonl>` 生成每个窗口的评分序列
3. `npm run calibrate -- --file <log.jsonl>` 网格搜索 window.size × scoring.gamma × sigma k
4. 以"翻转点召回率 − 误报"为目标函数, 把最优参数写入 profile

## 扩展接口

- 自定义特征提取器: 实现 FeatureExtractor 接口(src/monitor/feature/extractor.ts)
- 自定义评分策略: 实现 ScoringStrategy 接口(src/monitor/scoring/index.ts)
- 自定义异常检测: 修改 threshold.trigger 规则或在 trend/anomaly.ts 增加规则类型
- 自定义干预动作: 插件侧扩展 L4/L5(decision.ts 状态机 + preset mjs 执行分支)
