import { ValidationError } from "../../src/errors/DomainErrors";
import { Category } from "../../src/models/category";

describe("Category - Entidad de dominio", () => {
  it("Debería crear una categoría válida y recortar los espacios", () => {
    const category = new Category({
      name: "  Novelas  ",
      description: "  Ficción  ",
    });
    expect(category.getName()).toBe("Novelas");
    expect(category.getDescription()).toBe("Ficción");
    expect(category.getId()).toBeUndefined();
  });

  it("Debería permitir una categoría sin descripción", () => {
    const category = new Category({ name: "Textos" });
    expect(category.getDescription()).toBeUndefined();
  });

  it("Debería asignar el id", () => {
    const category = new Category({ name: "Textos" });
    category.assignId("abc");
    expect(category.getId()).toBe("abc");
  });

  it("Debería fallar si el nombre falta", () => {
    expect(() => new Category({})).toThrow(ValidationError);
  });

  it("Debería fallar si el nombre está vacío", () => {
    expect(() => new Category({ name: "   " })).toThrow(ValidationError);
  });

  it("Debería fallar si la descripción no es un texto", () => {
    expect(() => new Category({ name: "Textos", description: 5 as unknown as string })).toThrow(ValidationError);
  });
});
