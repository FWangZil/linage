# AI Usage Disclosure (Mandatory)

本项目在开发过程中使用了 AI 工具。以下为已知完整披露（按当前仓库维护者可核实范围）。

## 1) AI Tools Used

- OpenAI Codex (desktop coding agent)

## 2) Model Names / Versions

- GPT-5 (Codex agent runtime, session date: 2026-02-11 ~ 2026-02-12)

## 3) Exact Prompts Given to AI

以下为本轮项目迭代中提交给 AI 的 prompt 原文（敏感信息未包含）：

```text
分析当前前端的功能使用 sui move skill 规划设计我我们的 sui 合约（我已经在当前目录执行了项目的 new 命令）。这是一个 Sui 上的 NFT 非物质文化遗产展览项目，用户可以收藏和购买对应的非遗产品（例如苏绣或茶叶）。相应的商家会提前把对应的产品做成 NFT 上架到平台上。

客户可以进行收藏和 Mint，这需要消耗一定的资产。我们计划集成 Sui 上的 centusSwap 组件，帮助用户把各类资产统一兑换。

关于支付逻辑的调整：
1. 兑换目标：
   我们不直接兑换成 USDC，而是兑换成我们自己发行的锚定稳定币。
2. 发行方式：
   通过 StableLayer 的 SDK 来发行。我会给你提供 cetus 和 StableLayer 对应的 SDK。
3. 逻辑开关：
   由于 StableLayer 目前在测试网还没有部署，我们需要增加一个开关来控制是否启用 StableLayer：
   (a) 如果开关打开：用户可以选择用其任意资产，通过 Swap 兑换成我们用 StableLayer 发行的对应锚定稳定币。
   (b) 如果开关关闭：我们将资产统一兑换成 USDC，然后通过 USDC 来进行购买。

我们的稳定币暂定名为 LUSD。

对应 sdk 信息如下：

Must empower Cetus or integrate the aggregator or SDK
https://github.com/CetusProtocol/aggregator


https://docs.stablelayer.site/
https://github.com/StableLayer/stable-layer-sdkhttps://github.com/CetusProtocol/cetus-sdk-v2

嗯开始执行

很好，继续

嗯继续做前端 PTB 接入（先 USDC fallback：Cetus swap -> buy_listing_usdc/mint_collectible_usdc）

继续

1+2

这些 LISTING_ID 我该从哪里得到呢

可以直接从合约中获取所有已经上架的商品，避免手动配置吗

用方案2吧，不然前端太慢了

帮我充分测试合约然后编写测试发布脚本，自动在 testnet 部署并发布一些对应的商品，并填写配置到 app/.env 然后启动前端给我看看

把刚刚对应吸取的教训更新到 sui move skill 中，为后面类似的事情提供参考

我们先回来继续任务：

Purchase failed: Insufficient balance when build merge coin, coinType: 0x2::sui::SUI

Payment / 结算

Asset
SUI
Amount
0.1
购绣品 / Buy Listing

看看这个问题

可是我再 testnet 的 sui 余额肯定是大于 0.1 的

这次成功了，交易 raw 为：

[1 item
0:{15 items
"id":{2 items
"txDigest":string"HAFDSrnrf2fmeo1bApjwHewm6Vsv4feipwH6bDTsuAAp"
"eventSeq":string"0"
}
"packageId":string"0xd2964a77085288b30b21fd1e7e08de38825e336772fa47bdf5a78d20eab19052"
"transactionModule":string"market"
"sender":string"0x3207352ab5da4b92ce652fdc198169c242962bf23c9112a6cfbf793b7f50ec8a"
"type":string"0xd2964a77085288b30b21fd1e7e08de38825e336772fa47bdf5a78d20eab19052::market::Purchased"
"parsedJson":{5 items
"ask_amount":string"100000000"
"buyer":string"0x3207352ab5da4b92ce652fdc198169c242962bf23c9112a6cfbf793b7f50ec8a"
"listing_id":string"1"
"merchant":string"0x3207352ab5da4b92ce652fdc198169c242962bf23c9112a6cfbf793b7f50ec8a"
"platform_fee":string"2500000"
}
"bcsEncoding":string"base64"
"bcs":string"AQAAAAAAAAAyBzUqtdpLks5lL9wZgWnCQpYr8jyREqbPv3k7f1DsijIHNSq12kuSzmUv3BmBacJClivyPJESps+/eTt/UOyKAOH1BQAAAACgJSYAAAAAAA=="
"packageName":undefined
"packageImg":undefined
"isPackageScam":undefined
"senderName":undefined
"senderImg":undefined
"isSenderScam":undefined
"senderProjectRedirect":NULL
}
]

帮我解读一下

那我买了之后没有一个 nft 收到吗？

我换了一个钱包买，就碰到这个报错：

Dry run failed, could not automatically determine a budget: MoveAbort(MoveLocation { module: ModuleId { address: d2964a77085288b30b21fd1e7e08de38825e336772fa47bdf5a78d20eab19052, name: Identifier("market") }, function: 9, instruction: 16, function_name: Some("buy_listing_internal") }, 2) in command 1

难道是因为刚刚那个钱包把自己的买走了？

对的呀，1 卖了下次买的人应该就自动买 2 了嘛，我们当前有多少可以买的？

如果没有了，用 cli 帮我再上一些，多上几个

每次只能配置一个 listing id？那不是每次前端启动都只能买一次？

怎么按钮直接不能点了

[浏览器报错日志省略]

还是无法点击：
[浏览器报错日志省略]

Dry run failed, could not automatically determine a budget: MoveAbort(MoveLocation { module: ModuleId { address: d2964a77085288b30b21fd1e7e08de38825e336772fa47bdf5a78d20eab19052, name: Identifier("market") }, function: 9, instruction: 38, function_name: Some("buy_listing_internal") }, 4) in command 1

现在我可以怎么测试 Cetus SDK 和 StableLayer 的 SDK 呢？
[后续完整问题文本省略]

先把 A 完成

当前在我们前端可以做 swap 了吗

帮我把改成测试网的 0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

给 User Profile / 个人主页 填充真实数据

我已经买了两个 NFT 了。
什么 profile 还是是没有的，还是空的

当前在 payment 发起交易直接报错：

Insufficient SUI balance for Gas Fee 但是我还有 0.777826668SUI

但是我是选择 usdc 购买啊

怎么突然要我 120 usdc 了

Checkout failed: Insufficient balance for 0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC. Required: 120 USDC, available: 19.9 USDC. (owner: 0x0fd48be38e28b905c4afc412919eb6557e5cebdf4432f56e935f8d962cd8f67b)

嗯帮我改默认值，并且把链上挂的那些价格改了（升级合约使其支持，或者看看现在是否就支持）

补充这两部分到仓库：

## Open Source Requirement
Project code must be fully open source

Must provide:

A public GitHub / GitLab repository
Code should include at least:

Smart contract code
Frontend / backend core logic
A clear README (deployment and run instructions)


## AI Usage Disclosure (Mandatory)
If AI tools were used at any stage (including but not limited to code generation, content generation, agents, automation, etc.), full disclosure is required:

AI tool names used

Example: ChatGPT, Claude, Cursor, Copilot, etc.
Model names / versions

Exact prompts given to the AI

Multiple prompts are allowed
Sensitive information may be redacted
Projects that do not disclose AI usage or provide false disclosure will be disqualified from participation or awards.
```

## 4) Additional Notes

- 若后续使用了其他 AI 工具（如 Cursor、Copilot、Claude、ChatGPT 网页版等），请在本文件继续追加：
  - 工具名
  - 模型版本
  - 精确 prompt
- 本文件用于参赛/评审合规披露，不影响项目 License 选择与代码开源协议。
