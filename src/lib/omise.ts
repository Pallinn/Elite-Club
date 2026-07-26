import Omise from "omise";

// omise-node picks between the two keys per resource — sources uses publicKey,
// charges/customers/tokens use secretKey — so BOTH must be passed here or
// `sources.create` will send `undefined:` as its basic-auth and be rejected.
export const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY ?? "",
  secretKey: process.env.OMISE_SECRET_KEY ?? "",
  omiseVersion: "2019-05-29",
});
