import {
  prepareBuyCropNft,
  prepareSetFarmerProfileVerified,
  prepareMintCropNft,
  prepareRecordSatelliteAttestation,
  prepareRecordSatelliteAttestationByOracle,
  prepareSetListingBuyable,
  prepareSubmitProof,
  prepareUpsertFarmerProfile,
  prepareVerifyDelivery,
  submitSignedTransaction,
} from "@/lib/stellar/backend";

export const runtime = "nodejs";

type RequestBody = {
  action:
    | "prepare_mint_crop_nft"
    | "prepare_buy_crop_nft"
    | "prepare_upsert_farmer_profile"
    | "prepare_set_farmer_profile_verified"
    | "prepare_submit_proof"
    | "prepare_verify_delivery"
    | "prepare_set_listing_buyable"
    | "prepare_record_satellite_attestation"
    | "prepare_record_satellite_attestation_by_oracle"
    | "submit_signed_xdr";
  payload: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    switch (body.action) {
      case "prepare_mint_crop_nft":
        return Response.json(await prepareMintCropNft(body.payload as never));
      case "prepare_buy_crop_nft":
        return Response.json(await prepareBuyCropNft(body.payload as never));
      case "prepare_upsert_farmer_profile":
        return Response.json(await prepareUpsertFarmerProfile(body.payload as never));
      case "prepare_set_farmer_profile_verified":
        return Response.json(await prepareSetFarmerProfileVerified(body.payload as never));
      case "prepare_submit_proof":
        return Response.json(await prepareSubmitProof(body.payload as never));
      case "prepare_verify_delivery":
        return Response.json(await prepareVerifyDelivery(body.payload as never));
      case "prepare_set_listing_buyable":
        return Response.json(await prepareSetListingBuyable(body.payload as never));
      case "prepare_record_satellite_attestation":
        return Response.json(await prepareRecordSatelliteAttestation(body.payload as never));
      case "prepare_record_satellite_attestation_by_oracle":
        return Response.json(await prepareRecordSatelliteAttestationByOracle(body.payload as never));
      case "submit_signed_xdr": {
        const signedXdr = body.payload?.signedXdr;
        if (typeof signedXdr !== "string" || !signedXdr) {
          return Response.json({ error: "signedXdr is required" }, { status: 400 });
        }
        return Response.json(await submitSignedTransaction(signedXdr));
      }
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return Response.json({ error: message || "Unexpected server error" }, { status: 500 });
  }
}
