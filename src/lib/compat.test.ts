import { describe, expect, it } from "vitest";
import {
  buildEstimateParams,
  buildPhotoPrompt,
  canShareSeed,
  commonAspectRatios,
  filterModelsForMode,
  getImageModels,
  pickDefaultPair,
} from "./compat";
import type { ImageModel } from "./types";

const modelWithSeed: ImageModel = {
  id: "a",
  type: "image",
  params: { aspect_ratio: { enum: ["1:1", "16:9"] }, seed: { type: "number" } },
};

const modelWithoutSeed: ImageModel = {
  id: "b",
  type: "image",
  params: { aspect_ratio: { enum: ["1:1", "9:16"] } },
};

describe("commonAspectRatios", () => {
  it("returns the intersection of supported ratios", () => {
    expect(commonAspectRatios(modelWithSeed, modelWithoutSeed)).toEqual(["1:1"]);
  });

  it("returns an empty array when there is no overlap", () => {
    const noOverlap: ImageModel = { id: "c", type: "image", params: { aspect_ratio: { enum: ["3:2"] } } };
    expect(commonAspectRatios(modelWithSeed, noOverlap)).toEqual([]);
  });
});

describe("canShareSeed", () => {
  it("is true only when both models support seed", () => {
    expect(canShareSeed(modelWithSeed, modelWithoutSeed)).toBe(false);
    expect(canShareSeed(modelWithSeed, modelWithSeed)).toBe(true);
  });
});

describe("getImageModels", () => {
  it("filters out non-image models", () => {
    const textModel = { ...modelWithSeed, id: "t", type: "text" } as unknown as ImageModel;
    expect(getImageModels([modelWithSeed, textModel])).toEqual([modelWithSeed]);
  });
});

describe("pickDefaultPair", () => {
  it("returns null when there are fewer than two models", () => {
    expect(pickDefaultPair([modelWithSeed])).toBeNull();
  });

  it("picks the two cheapest models", () => {
    const cheap: ImageModel = { id: "cheap", type: "image", price_rub: 1 };
    const mid: ImageModel = { id: "mid", type: "image", price_rub: 5 };
    const pricey: ImageModel = { id: "pricey", type: "image", price_rub: 20 };
    expect(pickDefaultPair([pricey, cheap, mid])).toEqual(["cheap", "mid"]);
  });
});

describe("buildEstimateParams", () => {
  it("omits aspect_ratio and seed when not provided", () => {
    expect(buildEstimateParams("m", "prompt", undefined, undefined)).toEqual({
      type: "image",
      model: "m",
      prompt: "prompt",
      strict: true,
    });
  });

  it("includes aspect_ratio and seed when provided", () => {
    expect(buildEstimateParams("m", "prompt", "1:1", 42)).toEqual({
      type: "image",
      model: "m",
      prompt: "prompt",
      strict: true,
      aspect_ratio: "1:1",
      seed: 42,
    });
  });

  it("includes image_input only when a non-empty array is provided", () => {
    expect(buildEstimateParams("m", "prompt", undefined, undefined, [])).not.toHaveProperty("image_input");
    expect(buildEstimateParams("m", "prompt", undefined, undefined, ["https://x/y.png"])).toEqual({
      type: "image",
      model: "m",
      prompt: "prompt",
      strict: true,
      image_input: ["https://x/y.png"],
    });
  });
});

describe("filterModelsForMode", () => {
  const textOnly: ImageModel = { id: "text-only", type: "image" };
  const optionalPhoto: ImageModel = { id: "optional-photo", type: "image", supportsImageInput: true };
  const editOnly: ImageModel = {
    id: "edit-only",
    type: "image",
    supportsImageInput: true,
    requiresImageInput: true,
  };
  const models = [textOnly, optionalPhoto, editOnly];

  it("without a photo, hides models that require one", () => {
    expect(filterModelsForMode(models, false)).toEqual([textOnly, optionalPhoto]);
  });

  it("with a photo, shows only models that can take image_input", () => {
    expect(filterModelsForMode(models, true)).toEqual([optionalPhoto, editOnly]);
  });
});

describe("buildPhotoPrompt", () => {
  it("prefixes the user prompt with the product-preservation instruction", () => {
    const result = buildPhotoPrompt("place it on a beach at sunset");
    expect(result).toContain("pixel-identical");
    expect(result).toContain("place it on a beach at sunset");
  });
});
