import { ValidationError } from "../../src/errors/DomainErrors";
import { Province } from "../../src/models/province";

describe("Province", () => {
  it("Debería crear una provincia con nombre y costo de envío", () => {
    const province = new Province("  Buenos Aires ", 2500);
    expect(province.getName()).toBe("Buenos Aires");
    expect(province.getShippingCost()).toBe(2500);
  });

  it("Debería permitir un costo de envío igual a 0", () => {
    expect(new Province("Córdoba", 0).getShippingCost()).toBe(0);
  });

  it("Debería permitir asignar el id", () => {
    const province = new Province("Santa Fe", 3500);
    province.assignId("p1");
    expect(province.getId()).toBe("p1");
  });

  it("Debería rechazar un nombre vacío", () => {
    expect(() => new Province("   ", 100)).toThrow(ValidationError);
  });

  it("Debería rechazar un costo de envío negativo o que no sea número", () => {
    expect(() => new Province("Salta", -1)).toThrow(ValidationError);
    expect(() => new Province("Salta", undefined)).toThrow(ValidationError);
  });
});
