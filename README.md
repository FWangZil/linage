# Linage Heritage Curation Platform

Sui 上的非物质文化遗产 NFT 展示与交易项目。
商家先铸造并上架 `ProductNFT`，用户可浏览、收藏、购买，并支持通过 Cetus 聚合器进行支付资产兑换。

## Demo

https://github.com/user-attachments/assets/linage-buy.mp4

<video src="public/linage-buy.mp4" controls width="100%"></video>

## Open Source Statement

- Public repository: https://github.com/FWangZil/linage
- This repository includes:
  - Smart contract code: `sources/*.move`
  - Frontend core logic: `app/`
  - Deployment and operations scripts: `scripts/`

## Repository Layout

- `sources/`: Sui Move 合约（`admin` / `market` / `merchant` / `collectible`）
- `tests/`: Move 单元测试
- `app/`: 前端（React + Sui dApp Kit + Cetus aggregator）
- `scripts/`: 发布、上架、改价等脚本
- `docs/`: 设计与运行文档

## Prerequisites

- Node.js 18+
- pnpm 8+
- Sui CLI（并已配置 testnet/mainnet 环境与地址）

## Smart Contract: Build & Test

```bash
sui move build
sui move test
```

## Testnet Deploy + Seed

> **合约已部署至 Sui Testnet**
>
> Package ID: [`0xd2964a77085288b30b21fd1e7e08de38825e336772fa47bdf5a78d20eab19052`](https://suiscan.xyz/testnet/object/0xd2964a77085288b30b21fd1e7e08de38825e336772fa47bdf5a78d20eab19052)

```bash
bash scripts/testnet_deploy_seed_and_config.sh
```

脚本会：
- 发布 Move 包
- 注册 USDC 结算类型
- 注册商家并铸造示例商品
- 上架示例 listing
- 写入前端配置到 `app/.env`

## Reprice Existing Active Listings (Testnet)

将当前活跃挂单统一改价（通过 `cancel_listing + list_product`）：

```bash
TARGET_ASK_AMOUNT=100000 bash scripts/testnet_reprice_active_listings.sh
```

说明：USDC 6 位精度，`100000 = 0.1 USDC`。

## Frontend Run

```bash
cd app
pnpm install
pnpm dev
```

默认访问地址由 Vite 输出（通常为 `http://localhost:5173`）。

## AI Usage Disclosure

项目 AI 使用披露文档（强制披露项）见：

- `AI_USAGE_DISCLOSURE.md`
