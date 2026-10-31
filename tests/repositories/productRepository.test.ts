import mongoose from "mongoose";
import { ValidationError } from "../../src/errors/DomainErrors";
import { Category } from "../../src/models/category";
import { Product } from "../../src/models/product";
import { ProductRepository } from "../../src/repositories/productRepository";
import { clearCategories, clearProducts, clearUsers, connectTestDb, disconnectTestDb } from "../helpers/db";
import { createCategory, createProduct, createUser } from "../helpers/factories";

describe("ProductRepository", () => {
  const repository = new ProductRepository();

  const clearAll = async () => {
    await clearProducts();
    await clearCategories();
    await clearUsers();
  };

  beforeAll(connectTestDb);
  beforeEach(clearAll);
  afterAll(async () => {
    await clearAll();
    await disconnectTestDb();
  });

  const newProduct = async (overrides: Partial<ConstructorParameters<typeof Product>[0]> = {}) => {
    const categoryId = overrides.categoryId ?? ((await createCategory()).getId() as string);
    const sellerId = overrides.sellerId ?? ((await createUser({ role: "SELLER" })).getId() as string);
    return new Product({
      sku: "SKU-X",
      name: "Cuaderno",
      description: "Rayado",
      salePrice: 1500,
      stock: 5,
      ...overrides,
      categoryId,
      sellerId,
    });
  };

  describe("save", () => {
    it("Debería crear y asignar el id", async () => {
      const product = await newProduct();
      await repository.save(product);
      expect(product.getId()).toBeDefined();
    });

    it("Debería actualizar un producto existente", async () => {
      const product = await newProduct();
      await repository.save(product);
      product.update({ name: "Renombrado", stock: 99 });
      product.deactivate();
      await repository.save(product);

      const found = await repository.findById(product.getId() as string);
      expect(found?.getName()).toBe("Renombrado");
      expect(found?.getStock()).toBe(99);
      expect(found?.getIsActive()).toBe(false);
    });

    it("Debería traducir SKU duplicado a ValidationError", async () => {
      await repository.save(await newProduct({ sku: "DUP" }));
      const error = await repository.save(await newProduct({ sku: "DUP" })).catch((e) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details).toHaveProperty("sku");
    });
  });

  describe("findById", () => {
    it("Debería devolver el producto con la categoría poblada", async () => {
      const created = await createProduct();
      const found = await repository.findById(created.getId() as string);
      expect(found).toBeInstanceOf(Product);
      expect(found?.getCategoryId()).toBe(created.getCategoryId());
      expect(found?.getCategory()).toBeInstanceOf(Category);
      expect(found?.getCategory()?.getId()).toBe(created.getCategoryId());
    });

    it("Debería devolver también productos inactivos", async () => {
      const created = await createProduct();
      created.deactivate();
      await repository.save(created);
      expect((await repository.findById(created.getId() as string))?.getIsActive()).toBe(false);
    });

    it("Debería devolver null con id inválido o inexistente", async () => {
      expect(await repository.findById("no-es-un-id")).toBeNull();
      expect(await repository.findById(new mongoose.Types.ObjectId().toString())).toBeNull();
    });
  });

  describe("findByIdAndSellerId", () => {
    it("Debería devolver el producto activo si pertenece al vendedor indicado", async () => {
      const seller = await createUser({ role: "SELLER" });
      const sellerId = seller.getId() as string;
      const created = await createProduct({ sellerId });

      const found = await repository.findByIdAndSellerId(created.getId() as string, sellerId);
      expect(found).toBeInstanceOf(Product);
      expect(found?.getId()).toBe(created.getId());
      expect(found?.getSellerId()).toBe(sellerId);
      expect(found?.getCategory()).toBeDefined();
    });

    it("Debería devolver null si el producto pertenece a otro vendedor", async () => {
      const seller1 = await createUser({ role: "SELLER" });
      const seller2 = await createUser({ role: "SELLER" });
      const created = await createProduct({ sellerId: seller1.getId() as string });

      const found = await repository.findByIdAndSellerId(created.getId() as string, seller2.getId() as string);
      expect(found).toBeNull();
    });

    it("Debería devolver null si el producto está inactivo", async () => {
      const seller = await createUser({ role: "SELLER" });
      const sellerId = seller.getId() as string;
      const created = await createProduct({ sellerId });
      created.deactivate();
      await repository.save(created);

      const found = await repository.findByIdAndSellerId(created.getId() as string, sellerId);
      expect(found).toBeNull();
    });

    it("Debería devolver null con id o sellerId inválidos", async () => {
      expect(await repository.findByIdAndSellerId("invalido", "invalido")).toBeNull();
      expect(await repository.findByIdAndSellerId(new mongoose.Types.ObjectId().toString(), "invalido")).toBeNull();
    });
  });

  describe("findPaginated", () => {
    it("Debería listar solo activos con total y paginar", async () => {
      for (let i = 0; i < 5; i++) await createProduct();
      const inactive = await createProduct();
      inactive.deactivate();
      await repository.save(inactive);

      const page1 = await repository.findPaginated({ page: 1, limit: 2 });
      const page3 = await repository.findPaginated({ page: 3, limit: 2 });
      expect(page1.total).toBe(5);
      expect(page1.items).toHaveLength(2);
      expect(page3.items).toHaveLength(1);
      expect(page1.items.every((p) => p.getIsActive())).toBe(true);
      expect(page1.items[0].getCategory()).toBeDefined();
    });

    it("Debería filtrar por categoría", async () => {
      const category = await createCategory();
      await createProduct({ categoryId: category.getId() });
      await createProduct();
      const result = await repository.findPaginated({ page: 1, limit: 10, categoryId: category.getId() });
      expect(result.total).toBe(1);
      expect(result.items[0].getCategoryId()).toBe(category.getId());
    });

    it("Debería devolver vacío con categoría inválida", async () => {
      await createProduct();
      expect(await repository.findPaginated({ page: 1, limit: 10, categoryId: "xxx" })).toEqual({
        items: [],
        total: 0,
      });
    });

    it("Debería buscar por texto en nombre y SKU sin interpretar regex", async () => {
      await createProduct({ name: "Lapicera azul", sku: "LAP-1" });
      await createProduct({ name: "Cuaderno", sku: "CUA-1" });
      await createProduct({ name: "Regla (30cm)", sku: "REG-1" });

      expect((await repository.findPaginated({ page: 1, limit: 10, searchText: "lapicera" })).total).toBe(1);
      expect((await repository.findPaginated({ page: 1, limit: 10, searchText: "cua-1" })).total).toBe(1);
      expect((await repository.findPaginated({ page: 1, limit: 10, searchText: "(30cm)" })).total).toBe(1);
      expect((await repository.findPaginated({ page: 1, limit: 10, searchText: ".*" })).total).toBe(0);
    });

    it("Debería normalizar page y limit inválidos", async () => {
      await createProduct();
      const result = await repository.findPaginated({ page: 0, limit: 0 });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("findBySellerId", () => {
    it("Debería devolver activos e inactivos solo del vendedor", async () => {
      const seller = await createUser({ role: "SELLER" });
      const sellerId = seller.getId() as string;
      await createProduct({ sellerId });
      const inactive = await createProduct({ sellerId });
      inactive.deactivate();
      await repository.save(inactive);
      await createProduct();

      const mine = await repository.findBySellerId(sellerId);
      expect(mine).toHaveLength(2);
      expect(mine.every((p) => p.getSellerId() === sellerId)).toBe(true);
      expect(mine.some((p) => !p.getIsActive())).toBe(true);
    });

    it("Debería devolver lista vacía con id inválido", async () => {
      expect(await repository.findBySellerId("xxx")).toEqual([]);
    });
  });

  describe("decrementStock", () => {
    it("Debería descontar el stock", async () => {
      const product = await createProduct({ stock: 5 });
      expect(await repository.decrementStock(product.getId() as string, 2)).toBe(true);
      expect((await repository.findById(product.getId() as string))?.getStock()).toBe(3);
    });

    it("Debería devolver false y no tocar el stock si no alcanza", async () => {
      const product = await createProduct({ stock: 1 });
      expect(await repository.decrementStock(product.getId() as string, 2)).toBe(false);
      expect((await repository.findById(product.getId() as string))?.getStock()).toBe(1);
    });

    it("Debería permitir llegar exactamente a 0", async () => {
      const product = await createProduct({ stock: 3 });
      expect(await repository.decrementStock(product.getId() as string, 3)).toBe(true);
      expect((await repository.findById(product.getId() as string))?.getStock()).toBe(0);
    });

    it("No debería sobrevender con descuentos concurrentes", async () => {
      const product = await createProduct({ stock: 5 });
      const id = product.getId() as string;
      const results = await Promise.all(Array.from({ length: 10 }, () => repository.decrementStock(id, 1)));
      expect(results.filter(Boolean)).toHaveLength(5);
      expect((await repository.findById(id))?.getStock()).toBe(0);
    });

    it("Debería devolver false con producto inactivo, inexistente o id inválido", async () => {
      const product = await createProduct({ stock: 5 });
      product.deactivate();
      await repository.save(product);
      expect(await repository.decrementStock(product.getId() as string, 1)).toBe(false);
      expect(await repository.decrementStock(new mongoose.Types.ObjectId().toString(), 1)).toBe(false);
      expect(await repository.decrementStock("xxx", 1)).toBe(false);
    });

    it("Debería rechazar cantidades inválidas", async () => {
      const product = await createProduct();
      const id = product.getId() as string;
      await expect(repository.decrementStock(id, 0)).rejects.toBeInstanceOf(ValidationError);
      await expect(repository.decrementStock(id, -1)).rejects.toBeInstanceOf(ValidationError);
      await expect(repository.decrementStock(id, 1.5)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("existsByCategoryId", () => {
    it("Debería indicar si la categoría está en uso, incluso por productos inactivos", async () => {
      const used = await createCategory();
      const unused = await createCategory();
      const product = await createProduct({ categoryId: used.getId() });
      product.deactivate();
      await repository.save(product);

      expect(await repository.existsByCategoryId(used.getId() as string)).toBe(true);
      expect(await repository.existsByCategoryId(unused.getId() as string)).toBe(false);
      expect(await repository.existsByCategoryId("xxx")).toBe(false);
    });
  });
});
