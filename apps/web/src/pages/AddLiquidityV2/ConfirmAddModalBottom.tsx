import {
  Currency,
  CurrencyAmount,
  Fraction,
  Percent,
} from "@novaswap/sdk-core";
import { Trans } from "i18n";
import { Text } from "rebass";
import { ThemedText } from "theme/components";

import { ButtonPrimary } from "../../components/Button";
import CurrencyLogo from "../../components/Logo/CurrencyLogo";
import { RowBetween, RowFixed } from "../../components/Row";
import { Field } from "../../state/mint/actions";

export function ConfirmAddModalBottom({
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
}: {
  noLiquidity?: boolean;
  price?: Fraction;
  currencies: { [field in Field]?: Currency };
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  poolTokenPercentage?: Percent;
  onAdd: () => void;
}) {
  const depositedAmtA = currencies[Field.CURRENCY_A]?.symbol;
  const depositedAmtB = currencies[Field.CURRENCY_B]?.symbol;
  return (
    <>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans>{{ depositedAmtA }} Deposited</Trans>
        </ThemedText.DeprecatedBody>
        <RowFixed>
          <CurrencyLogo
            currency={currencies[Field.CURRENCY_A]}
            style={{ marginRight: "8px" }}
          />
          <ThemedText.DeprecatedBody>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </ThemedText.DeprecatedBody>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans>{{ depositedAmtB }} Deposited</Trans>
        </ThemedText.DeprecatedBody>
        <RowFixed>
          <CurrencyLogo
            currency={currencies[Field.CURRENCY_B]}
            style={{ marginRight: "8px" }}
          />
          <ThemedText.DeprecatedBody>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </ThemedText.DeprecatedBody>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans>Rates</Trans>
        </ThemedText.DeprecatedBody>
        <ThemedText.DeprecatedBody>
          {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
            currencies[Field.CURRENCY_B]?.symbol
          }`}
        </ThemedText.DeprecatedBody>
      </RowBetween>
      <RowBetween style={{ justifyContent: "flex-end" }}>
        <ThemedText.DeprecatedBody>
          {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
            currencies[Field.CURRENCY_A]?.symbol
          }`}
        </ThemedText.DeprecatedBody>
      </RowBetween>
      <RowBetween>
        <ThemedText.DeprecatedBody>
          <Trans>Share of Pool:</Trans>
        </ThemedText.DeprecatedBody>
        <ThemedText.DeprecatedBody>
          <Trans>
            {{
              pct: noLiquidity ? "100" : poolTokenPercentage?.toSignificant(4),
            }}
            %
          </Trans>
        </ThemedText.DeprecatedBody>
      </RowBetween>
      <ButtonPrimary style={{ margin: "20px 0 0 0" }} onClick={onAdd}>
        <Text fontWeight={535} fontSize={20}>
          {noLiquidity ? (
            <Trans>Create pool & supply</Trans>
          ) : (
            <Trans>Confirm supply</Trans>
          )}
        </Text>
      </ButtonPrimary>
    </>
  );
}
