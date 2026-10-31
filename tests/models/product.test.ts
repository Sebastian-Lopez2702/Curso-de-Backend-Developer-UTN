import { ValidationError } from "../../src/errors/DomainErrors";
import { Product, ProductProps } from "../../src/models/product";

const validProps = (overrides: ProductProps = {}): ProductProps => ({
  sku: "SKU-1",
  name: "Cuaderno",
  description: "Cuaderno rayado",
  salePrice: 1500,
  stock: 5,
  categoryId: "cat-1",
  sellerId: "seller-1",
  ...overrides,
});

const expectInvalid = (props: ProductProps, field: string) => {
  try {
    new Product(props);
    fail("Debería haber lanzado ValidationError");
  } catch (err) {
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).details).toHaveProperty(field);
  }
};

describe("Product", () => {
  it("Debería crear un producto válido, activo por defecto", () => {
    const product = new Product(validProps({ name: "  Cuaderno  " }));
    expect(product.getName()).toBe("Cuaderno");
    expect(product.getSalePrice()).toBe(1500);
    expect(product.getStock()).toBe(5);
    expect(product.getIsActive()).toBe(true);
    expect(product.getId()).toBeUndefined();
  });

  it.each(["sku", "name", "description", "categoryId", "sellerId"] as const)(
    "Debería rechazar %s vacío o ausente",
    (field) => {
      expectInvalid(validProps({ [field]: "   " }), field);
      expectInvalid(validProps({ [field]: undefined }), field);
    },
  );

  it("Debería rechazar salePrice menor a 1 o no numérico", () => {
    expectInvalid(validProps({ salePrice: 0 }), "salePrice");
    expectInvalid(validProps({ salePrice: -5 }), "salePrice");
    expectInvalid(validProps({ salePrice: undefined }), "salePrice");
    expectInvalid(validProps({ salePrice: "10" as unknown as number }), "salePrice");
  });

  it("Debería aceptar salePrice igual a 1", () => {
    expect(new Product(validProps({ salePrice: 1 })).getSalePrice()).toBe(1);
  });

  it("Debería rechazar stock negativo o no entero, y aceptar 0", () => {
    expectInvalid(validProps({ stock: -1 }), "stock");
    expectInvalid(validProps({ stock: 1.5 }), "stock");
    expectInvalid(validProps({ stock: undefined }), "stock");
    expect(new Product(validProps({ stock: 0 })).getStock()).toBe(0);
  });

  it("Debería acumular todos los errores", () => {
    try {
      new Product({});
      fail("Debería haber lanzado ValidationError");
    } catch (err) {
      expect(Object.keys((err as ValidationError).details)).toHaveLength(7);
    }
  });

  it("Debería indicar si pertenece a un vendedor", () => {
    const product = new Product(validProps());
    expect(product.isOwnedBy("seller-1")).toBe(true);
    expect(product.isOwnedBy("otro")).toBe(false);
  });

  it("Debería desactivarse", () => {
    const product = new Product(validProps());
    product.deactivate();
    expect(product.getIsActive()).toBe(false);
  });

  describe("update", () => {
    it("Debería aplicar cambios parciales ignorando undefined", () => {
      const product = new Product(validProps());
      product.update({ name: "Nuevo", stock: 20, description: undefined });
      expect(product.getName()).toBe("Nuevo");
      expect(product.getStock()).toBe(20);
      expect(product.getDescription()).toBe("Cuaderno rayado");
    });

    it("Debería validar y no modificar nada si hay errores", () => {
      const product = new Product(validProps());
      expect(() => product.update({ name: "Nuevo", salePrice: 0 })).toThrow(ValidationError);
      expect(product.getName()).toBe("Cuaderno");
      expect(product.getSalePrice()).toBe(1500);
    });

    it("Debería poder cambiar la categoría pero no el vendedor", () => {
      const product = new Product(validProps());
      product.update({ categoryId: "cat-2", sellerId: "hacker" } as never);
      expect(product.getCategoryId()).toBe("cat-2");
      expect(product.getSellerId()).toBe("seller-1");
    });
  });
});
