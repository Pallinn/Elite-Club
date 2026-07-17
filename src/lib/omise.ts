import Omise from "omise";

export const omise = Omise({
  secretKey: process.env.OMISE_SECRET_KEY ?? "",
  omiseVersion: "2019-05-29",
});
