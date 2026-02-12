# Frontend (app)

Linage 前端应用，负责：
- 钱包连接与链上交互
- Cetus 路由换币 + USDC/LUSD 结算流程
- 商品浏览、购买、收藏视图

## Prerequisites

- Node.js 18+
- pnpm 8+

## Install

```bash
pnpm install
```

## Configure

使用根目录脚本自动生成 `app/.env`：

```bash
bash ../scripts/testnet_deploy_seed_and_config.sh
```

或手动填写以下关键变量：
- `VITE_SUI_NETWORK`
- `VITE_LINAGE_PACKAGE_ID`
- `VITE_LINAGE_PLATFORM_CONFIG_ID`
- `VITE_LINAGE_MARKETPLACE_ID`
- `VITE_LINAGE_COLLECTIBLE_REGISTRY_ID`
- `VITE_LINAGE_USDC_COIN_TYPE`

## Run

```bash
pnpm dev
```

## Tests

```bash
pnpm test
```

## Build

```bash
pnpm build
```
