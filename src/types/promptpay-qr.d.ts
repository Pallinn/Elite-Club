declare module "promptpay-qr" {
  interface PromptPayQrOptions {
    amount?: number;
  }
  function generatePayload(id: string, options?: PromptPayQrOptions): string;
  export default generatePayload;
}
