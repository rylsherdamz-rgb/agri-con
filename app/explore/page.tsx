
import ParcelVerificationWorkspace from "@/components/ParcelVerificationWorkspace";
import NavigationBar from "@/components/NavigationBar";

const verificationWindow = {
  start: "2026-04-19T00:00:00Z",
  end: "2026-05-19T23:59:59Z",
};

// Mock data array to feed into the map layout grid
const sampleParcels = [
  {
    id: 1,
    title: "Green Valley Sector Alpha",
    lat: 14.5995,
    lng: 120.9842,
    temporalExtent: verificationWindow,
  },
  {
    id: 2,
    title: "Delta Ridge Farmstead",
    lat: 14.6150,
    lng: 120.9950,
    temporalExtent: verificationWindow,
  },
];

export default function ParcelPage() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-stone-50">
      {/* Top Header Bar */}
      <NavigationBar />

      {/* Main interactive application viewport layout wrapper */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <ParcelVerificationWorkspace parcels={sampleParcels} />
      </main>
    </div>
  );
}
