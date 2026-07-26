import { BadRequestException } from "@nestjs/common";

describe("product pricing rules", () => {
  const validateSale = (price: number, salePrice?: number) => {
    if (salePrice !== undefined && salePrice > price) {
      throw new BadRequestException("Sale price cannot exceed price");
    }
  };

  it("accepts a sale price equal to or below the regular price", () => {
    expect(() => validateSale(100, 80)).not.toThrow();
    expect(() => validateSale(100, 100)).not.toThrow();
  });

  it("rejects a sale price above the regular price", () => {
    expect(() => validateSale(100, 101)).toThrow(BadRequestException);
  });

  it("detects duplicate normalized variant combinations", () => {
    const combinations = [
      ["red", "large"].sort().join("|"),
      ["large", "red"].sort().join("|")
    ];
    expect(new Set(combinations).size).toBeLessThan(combinations.length);
  });
});
