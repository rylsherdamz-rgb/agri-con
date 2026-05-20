import ParcelVerificationWorkspace from "@/components/ParcelVerificationWorkspace";

const verificationWindow = {
  start: "2026-04-19T00:00:00Z",
  end: "2026-05-19T23:59:59Z",
};

export default function ParcelPage() {
  return (
    <div className="w-full h-full"    >
        <ParcelVerificationWorkspace
          nftId={1}
          title="Central Valley Parcel A"
          initialCenter={{ lat: 15.7342, lng: 120.9307 }}
          temporalExtent={verificationWindow}
        />
    </div>
  );
}
