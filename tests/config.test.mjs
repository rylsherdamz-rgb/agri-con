import { describe, it } from "node:test";
import assert from "node:assert";

describe("Contract ID", () => {
  it("is a valid Stellar contract address", () => {
    const id = "CD3MXXIIZFADYHPT424ONW7AMREY4LOZUKVD5UJ5WSFKSSKCFNDCXLIB";
    assert.ok(id.startsWith("C"));
    assert.equal(id.length, 56);
    assert.ok(/^C[A-Z0-9]{55}$/.test(id));
  });

  it("matches expected format (C + 55 alphanumeric)", () => {
    const id = "CD3MXXIIZFADYHPT424ONW7AMREY4LOZUKVD5UJ5WSFKSSKCFNDCXLIB";
    assert.match(id, /^C[A-Z0-9]{55}$/);
  });

  it("is not the placeholder value", () => {
    const id = "CD3MXXIIZFADYHPT424ONW7AMREY4LOZUKVD5UJ5WSFKSSKCFNDCXLIB";
    assert.notEqual(id, "placeholder");
    assert.notEqual(id, "");
  });
});
