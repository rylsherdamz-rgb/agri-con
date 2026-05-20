"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/components/stellar/wallet-context";
import NavigationBar from "@/components/NavigationBar";
import { CheckCircle, XCircle, User, Upload, Loader2, QrCode, BadgeCheck, Plus, ShieldAlert } from "lucide-react";
import { truncate } from "@/lib/utils/truncate";
import { getLiveFarmerProfiles, type LiveFarmerProfile } from "@/lib/stellar/live-data";
import Link from "next/link";

export default function ProfilePage() {
  const { address } = useWallet();
  const [profile, setProfile] = useState<LiveFarmerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ fullName: "", farmName: "", region: "", totalYieldKg: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (!address) return;
    const ctrl = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      try {
        const profiles = await getLiveFarmerProfiles();
        const match = profiles.find((p) => p.farmer === address);
        if (match) {
          setProfile(match);
          setForm({
            fullName: match.fullName || "",
            farmName: match.farmName || "",
            region: match.region || "",
            totalYieldKg: String(match.totalYieldKg || ""),
          });
        }
      } catch {} finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    fetchProfile();
    return () => ctrl.abort();
  }, [address]);

  async function handleSave() {
    if (!address) return;
    setSaving(true);
    try {
      const res = await fetch("/api/stellar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare_upsert_farmer_profile",
          farmerAddress: address,
          fullName: form.fullName,
          farmName: form.farmName,
          region: form.region,
          totalYieldKg: parseInt(form.totalYieldKg, 10) || 0,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfile({
          farmer: address,
          fullName: form.fullName,
          farmName: form.farmName,
          region: form.region,
          governmentIdObject: profile?.governmentIdObject || "",
          verified: profile?.verified ?? false,
          totalYieldKg: parseInt(form.totalYieldKg, 10) || 0,
          updatedAt: Math.floor(Date.now() / 1000),
        });
        setEditMode(false);
      }
    } catch {} finally {
      setSaving(false);
    }
  }

  async function handleIdUpload(file: File) {
    if (!address) return;
    setUploading(true);
    setUploadMessage("");
    try {
      const res = await fetch("/api/farmer-id/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerAddress: address, fileName: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (data.ok && data.uploadUrl) {
        await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        setUploadMessage("ID uploaded. Awaiting verification.");
      }
    } catch {
      setUploadMessage("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  const isVerified = profile?.verified ?? false;

  if (!address) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50">
        <NavigationBar />
        <main className="flex flex-1 items-center justify-center">
          <div className="card-farm p-10 text-center">
            <User size={40} className="mx-auto mb-3 text-stone-300" />
            <p className="text-sm font-medium text-stone-500">Connect your wallet to view your profile</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
            Farmer Profile
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your on-chain identity and farming credentials
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-stone-400" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              {/* Profile card */}
              <div className="card-farm p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isVerified ? (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-farm-100 text-farm-700 ring-2 ring-farm-300">
                        <BadgeCheck size={28} />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                        <User size={28} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-stone-900">
                          {profile?.fullName || "Unregistered Farmer"}
                        </p>
                        {isVerified ? (
                          <span className="badge-buyable"><CheckCircle size={12} /> Verified</span>
                        ) : (
                          <span className="badge-pending"><XCircle size={12} /> Pending</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400">
                        {profile?.farmName || "No farm"} &middot; {profile?.region || "No region"}
                      </p>
                    </div>
                  </div>
                  {!editMode && (
                    <button onClick={() => setEditMode(true)} className="btn-outline text-xs">
                      Edit Profile
                    </button>
                  )}
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-500">Full Name</label>
                      <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm outline-none focus:border-farm-400"
                        placeholder="Juan Dela Cruz" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500">Farm Name</label>
                      <input type="text" value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm outline-none focus:border-farm-400"
                        placeholder="Green Valley Farm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500">Region</label>
                      <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm outline-none focus:border-farm-400"
                        placeholder="Bicol" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(false)} className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
                        Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Profile"}
                      </button>
                    </div>
                  </div>
                ) : profile ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">Total Yield</p>
                      <p className="text-lg font-bold tabular-nums text-stone-900">{profile.totalYieldKg.toLocaleString()} kg</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">Region</p>
                      <p className="text-lg font-bold text-stone-900">{profile.region || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <User size={28} className="mb-2 text-stone-300" />
                    <p className="text-sm text-stone-400">No profile yet</p>
                    <button onClick={() => setEditMode(true)} className="btn-primary mt-3">Create Profile</button>
                  </div>
                )}
              </div>

              {/* ID Upload */}
              <div className="card-farm p-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-600">Government ID</h3>
                {uploadMessage && (
                  <p className="mb-3 text-xs font-medium text-farm-700 bg-farm-50 rounded-lg px-3 py-2">{uploadMessage}</p>
                )}
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 transition hover:border-farm-400 hover:bg-farm-50/30">
                  <Upload size={22} className="text-stone-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-600">
                      {uploading ? "Uploading..." : "Upload ID Document"}
                    </p>
                    <p className="text-xs text-stone-400">PNG, JPG, PDF — max 10MB</p>
                  </div>
                  <input type="file" accept="image/png,image/jpeg,application/pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdUpload(f); }} />
                </label>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Wallet card */}
              <div className="card-farm p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Wallet</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-100 text-farm-700">
                    <QrCode size={18} />
                  </div>
                  <p className="font-mono text-xs text-stone-600 break-all">{truncate(address, 16)}</p>
                </div>
              </div>

              {/* Verification status */}
              <div className="card-farm p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Status</p>
                {isVerified ? (
                  <div className="mt-3 rounded-xl bg-farm-50 px-4 py-3 text-center">
                    <BadgeCheck size={24} className="mx-auto mb-1 text-farm-600" />
                    <p className="text-sm font-semibold text-farm-800">Verified Farmer</p>
                    <p className="text-xs text-farm-600">You can list crops on the marketplace</p>
                    <Link href="/explore" className="btn-primary mt-3 text-xs w-full justify-center">
                      <Plus size={14} /> List a Crop
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-harvest-50 px-4 py-3 text-center">
                    <ShieldAlert size={24} className="mx-auto mb-1 text-harvest-600" />
                    <p className="text-sm font-semibold text-harvest-800">Awaiting Verification</p>
                    <p className="text-xs text-harvest-600">Upload your ID above. Only verified farmers can list crops.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}