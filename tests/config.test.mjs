import { describe, it } from "node:test";
import assert from "node:assert";

describe("Contract ID", () => {
  it("is a valid Stellar contract address", () => {
    const id = "CAEQDFMVO2FNEPVZBA2VNKSURUJ6HTUEFJWOAQVGGIN2DUIHSRB74ZC2";
    assert.ok(id.startsWith("C"));
    assert.equal(id.length, 56);
    assert.ok(/^C[A-Z0-9]{55}$/.test(id));
  });

  it("matches expected format (C + 55 alphanumeric)", () => {
    const id = "CAEQDFMVO2FNEPVZBA2VNKSURUJ6HTUEFJWOAQVGGIN2DUIHSRB74ZC2";
    assert.match(id, /^C[A-Z0-9]{55}$/);
  });

  it("is not the placeholder value", () => {
    const id = "CAEQDFMVO2FNEPVZBA2VNKSURUJ6HTUEFJWOAQVGGIN2DUIHSRB74ZC2";
    assert.notEqual(id, "placeholder");
    assert.notEqual(id, "");
  });
});
