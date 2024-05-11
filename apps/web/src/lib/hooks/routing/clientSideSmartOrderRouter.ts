import {
  BigintIsh,
  ChainId,
  CurrencyAmount,
  Token,
  TradeType,
} from "@novaswap/sdk-core";
// This file is lazy-loaded, so the import of smart-order-router is intentional.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  AlphaRouter,
  AlphaRouterConfig,
  // CachingTokenProviderWithFallback,
  // LegacyRouter,
  // OnChainQuoteProvider,
  // TokenProvider,
  // UniswapMulticallProvider,
  // V3PoolProvider,
} from "@novaswap/smart-order-router";
import { asSupportedChain } from "constants/chains";
import { RPC_PROVIDERS } from "constants/providers";
import { nativeOnChain } from "constants/tokens";
import JSBI from "jsbi";
import { UniswapMulticallProvider } from "providers/multicall-uniswap-provider";
import { OnChainQuoteProvider } from "providers/on-chain-quote-provider";
import { V3PoolProvider } from "providers/pool-provider";
import { TokenProvider } from "providers/token-provider";
import { LegacyRouter } from "routers/legacy-router";
import {
  GetQuoteArgs,
  QuoteResult,
  QuoteState,
  SwapRouterNativeAssets,
} from "state/routing/types";
import { transformSwapRouteToGetQuoteResult } from "utils/transformSwapRouteToGetQuoteResult";

const CLIENT_SIDE_ROUTING_ALLOW_LIST = [
  ChainId.MAINNET,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.NOVA_SEPOLIA,
  ChainId.CELO_ALFAJORES,
  ChainId.CELO,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
];
const routers = new Map<ChainId, AlphaRouter>();
export async function getRouter(chainId: ChainId): Promise<AlphaRouter> {
  const router = routers.get(chainId);
  // console.log(router, "router_____res");
  if (router) return router;
  const supportedChainId = asSupportedChain(chainId);
  if (supportedChainId && CLIENT_SIDE_ROUTING_ALLOW_LIST.includes(chainId)) {
    const provider = RPC_PROVIDERS[supportedChainId];
    const multicallProvider = new UniswapMulticallProvider(chainId, provider);
    console.log(multicallProvider, "multicallProvider");
    const tokenProvider = new TokenProvider(chainId, multicallProvider);
    const router = new LegacyRouter({
      chainId,
      multicall2Provider: multicallProvider,
      poolProvider: new V3PoolProvider(chainId, multicallProvider),
      quoteProvider: new OnChainQuoteProvider(
        chainId,
        provider,
        multicallProvider,
      ),
      tokenProvider,
    });
    console.log(router, "router-legacy-router");
    // // const router = new AlphaRouter({ chainId, provider })
    routers.set(chainId, router);
    return router;
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`);
}

async function getQuote(
  {
    tradeType,
    tokenIn,
    tokenOut,
    amount: amountRaw,
  }: {
    tradeType: TradeType;
    tokenIn: {
      address: string;
      chainId: number;
      decimals: number;
      symbol?: string;
    };
    tokenOut: {
      address: string;
      chainId: number;
      decimals: number;
      symbol?: string;
    };
    amount: BigintIsh;
  },
  router: AlphaRouter,
  routerConfig: Partial<AlphaRouterConfig>,
): Promise<QuoteResult> {
  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(
    tokenIn.address as SwapRouterNativeAssets,
  );
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(
    tokenOut.address as SwapRouterNativeAssets,
  );

  const currencyIn = tokenInIsNative
    ? nativeOnChain(tokenIn.chainId)
    : new Token(
        tokenIn.chainId,
        tokenIn.address,
        tokenIn.decimals,
        tokenIn.symbol,
      );
  const currencyOut = tokenOutIsNative
    ? nativeOnChain(tokenOut.chainId)
    : new Token(
        tokenOut.chainId,
        tokenOut.address,
        tokenOut.decimals,
        tokenOut.symbol,
      );

  const baseCurrency =
    tradeType === TradeType.EXACT_INPUT ? currencyIn : currencyOut;
  const quoteCurrency =
    tradeType === TradeType.EXACT_INPUT ? currencyOut : currencyIn;

  const amount = CurrencyAmount.fromRawAmount(
    baseCurrency,
    JSBI.BigInt(amountRaw),
  );
  // TODO (WEB-2055): explore initializing client side routing on first load (when amountRaw is null) if there are enough users using client-side router preference.
  const swapRoute = await router.route(
    amount,
    quoteCurrency,
    tradeType,
    /*swapConfig=*/ undefined,
    routerConfig,
  );

  if (!swapRoute) {
    return { state: QuoteState.NOT_FOUND };
  }

  console.log(swapRoute, "swapRoute", tradeType, "tradeType", amount, "amount");
  return transformSwapRouteToGetQuoteResult(tradeType, amount, swapRoute);
}

export async function getClientSideQuote(
  {
    tokenInAddress,
    tokenInChainId,
    tokenInDecimals,
    tokenInSymbol,
    tokenOutAddress,
    tokenOutChainId,
    tokenOutDecimals,
    tokenOutSymbol,
    amount,
    tradeType,
  }: GetQuoteArgs,
  router: AlphaRouter,
  config: Partial<AlphaRouterConfig>,
) {
  console.log("getClientSideQuote");
  return getQuote(
    {
      tradeType,
      tokenIn: {
        address: tokenInAddress,
        chainId: tokenInChainId,
        decimals: tokenInDecimals,
        symbol: tokenInSymbol,
      },
      tokenOut: {
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
      },
      amount,
    },
    router,
    config,
  );
}
