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

import { getLiveListings, getLiveFarmerProfiles } from "@/lib/stellar/live-data";

export const runtime = "nodejs";

type BodyParams = Record<string, unknown>;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: string } & BodyParams;

    switch (body.action) {
      case "prepare_mint_crop_nft":
        return Response.json(await prepareMintCropNft(body as never));
      case "prepare_buy_crop_nft":
        return Response.json(await prepareBuyCropNft(body as never));
      case "prepare_upsert_farmer_profile":
        return Response.json(await prepareUpsertFarmerProfile(body as never));
      case "prepare_set_farmer_profile_verified":
        return Response.json(await prepareSetFarmerProfileVerified(body as never));
      case "prepare_submit_proof":
        return Response.json(await prepareSubmitProof(body as never));
      case "prepare_verify_delivery":
        return Response.json(await prepareVerifyDelivery(body as never));
      case "prepare_set_listing_buyable":
        return Response.json(await prepareSetListingBuyable(body as never));
      case "prepare_record_satellite_attestation":
        return Response.json(await prepareRecordSatelliteAttestation(body as never));
      case "prepare_record_satellite_attestation_by_oracle":
        return Response.json(await prepareRecordSatelliteAttestationByOracle(body as never));
      case "submit_signed_xdr": {
        const signedXdr = typeof body.signedXdr === "string" ? body.signedXdr : "";
        if (!signedXdr) {
          return Response.json({ error: "signedXdr is required" }, { status: 400 });
        }
        return Response.json(await submitSignedTransaction(signedXdr));
      }

      case "get_farmer_profile": {
        const address = typeof body.farmerAddress === "string" ? body.farmerAddress : "";
        if (!address) {
          return Response.json({ ok: true, profile: null });
        }
        try {
          const profiles = await getLiveFarmerProfiles();
          const profile = profiles.find((p) => p.farmer === address) ?? null;
          return Response.json({ ok: true, profile });
        } catch {
          return Response.json({ ok: true, profile: null });
        }
      }

      case "get_all_listings": {
        try {
          const listings = await getLiveListings();
          return Response.json({ ok: true, listings });
        } catch {
          return Response.json({ ok: true, listings: [] });
        }
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