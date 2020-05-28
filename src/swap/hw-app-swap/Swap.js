// @flow
import type Transport from "@ledgerhq/hw-transport";
import { BigNumber } from "bignumber.js";
import { TransportStatusError } from "@ledgerhq/errors";
import invariant from "invariant";

const START_NEW_TRANSACTION_COMMAND: number = 0x01;
const SET_PARTNER_KEY_COMMAND: number = 0x02;
const CHECK_PARTNER_COMMAND: number = 0x03;
const PROCESS_TRANSACTION_RESPONSE: number = 0x04;
const CHECK_TRANSACTION_SIGNATURE: number = 0x05;
const CHECK_PAYOUT_ADDRESS: number = 0x06;
const CHECK_REFUND_ADDRESS: number = 0x07;
const SIGN_COIN_TRANSACTION: number = 0x08;

const maybeThrowProtocolError = (result: Buffer): void => {
  invariant(result.length >= 2, "SwapTransport: Unexpected result length");
  if (result.readUInt16BE(result.length - 2) !== 0x9000) {
    throw new TransportStatusError(result.readUInt16BE(result.length - 2));
  }
};

export default class Swap {
  transport: Transport<*>;
  allowedStatuses: Array<number> = [
    0x9000,
    0x6a80,
    0x6a81,
    0x6a82,
    0x6a83,
    0x6a84,
    0x6a85,
    0x6e00,
    0x6d00,
    0x9d1a
  ];

  constructor(transport: Transport<*>) {
    this.transport = transport;
  }

  async startNewTransaction(): Promise<string> {
    let result: Buffer = await this.transport.send(
      0xe0,
      START_NEW_TRANSACTION_COMMAND,
      0x00,
      0x00,
      Buffer.alloc(0),
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
    // invariant(result.length === 12, "APDU response length should be 12");

    return result.toString("ascii", 0, 10);
  }

  async setPartnerKey(partnerNameAndPublicKey: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      SET_PARTNER_KEY_COMMAND,
      0x00,
      0x00,
      partnerNameAndPublicKey,
      this.allowedStatuses
    );

    maybeThrowProtocolError(result);
  }

  async checkPartner(signatureOfPartnerData: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_PARTNER_COMMAND,
      0x00,
      0x00,
      signatureOfPartnerData,
      this.allowedStatuses
    );

    maybeThrowProtocolError(result);
  }

  // async processTransaction(transaction: Buffer, fee: BigNumber): Promise<void> {
  //   var hex: string = fee.toString(16);
  //   hex = hex.padStart(hex.length + (hex.length % 2), "0");
  //   var feeHex: Buffer = Buffer.from(hex, "hex");

  //   const bufferToSend: Buffer = Buffer.concat([
  //     Buffer.from([transaction.length]),
  //     transaction,
  //     Buffer.from([feeHex.length]),
  //     feeHex
  //   ]);

  //   let result: Buffer = await this.transport.send(
  //     0xe0,
  //     PROCESS_TRANSACTION_RESPONSE,
  //     0x00,
  //     0x00,
  //     bufferToSend,
  //     this.allowedStatuses
  //   );

  //   maybeThrowProtocolError(result);
  // }
  async processTransaction(transaction: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      PROCESS_TRANSACTION_RESPONSE,
      0x00,
      0x00,
      transaction,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async checkTransactionSignature(transactionSignature: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_TRANSACTION_SIGNATURE,
      0x00,
      0x00,
      transactionSignature,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }
  async checkPayoutAddress(
    payoutCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer
  ): Promise<void> {
    invariant(payoutCurrencyConfig.length <= 255, "Currency config is too big");
    invariant(addressParameters.length <= 255, "Address parameter is too big.");
    invariant(
      currencyConfigSignature.length >= 70 &&
        currencyConfigSignature.length <= 73,
      "Signature should be DER serialized and have length in [70, 73] bytes."
    );

    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([payoutCurrencyConfig.length]),
      payoutCurrencyConfig,
      currencyConfigSignature,
      Buffer.from([addressParameters.length]),
      addressParameters
    ]);

    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_PAYOUT_ADDRESS,
      0x00,
      0x00,
      bufferToSend,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async checkRefundAddress(
    refundCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer
  ): Promise<void> {
    invariant(refundCurrencyConfig.length <= 255, "Currency config is too big");
    invariant(addressParameters.length <= 255, "Address parameter is too big.");
    invariant(
      currencyConfigSignature.length >= 70 &&
        currencyConfigSignature.length <= 73,
      "Signature should be DER serialized and have length in [70, 73] bytes."
    );

    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([refundCurrencyConfig.length]),
      refundCurrencyConfig,
      currencyConfigSignature,
      Buffer.from([addressParameters.length]),
      addressParameters
    ]);

    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_REFUND_ADDRESS,
      0x00,
      0x00,
      bufferToSend,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async signCoinTransaction(): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      SIGN_COIN_TRANSACTION,
      0x00,
      0x00,
      Buffer.alloc(0),
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }
}
