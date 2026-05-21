"use client";

import NavigationBar from "@/components/NavigationBar";
import ClaimAid from "@/components/ClaimAid";
import { ShieldAlert } from "lucide-react";

export default function AidPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <NavigationBar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                Disaster Aid
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                File a claim for crop loss due to natural disasters
              </p>
            </div>
          </div>
        </div>
        <ClaimAid />
      </main>
    </div>
  );
}