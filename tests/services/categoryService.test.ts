import { ResourceNotFoundError, ValidationError } from "../../src/errors/DomainErrors";
import { ICategoryRepository } from "../../src/interfaces/categoryRepository";
import { Category } from "../../src/models/category";
import { CategoryService } from "../../src/services/categoryService";

const buildRepositoryMock = (): jest.Mocked<ICategoryRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn(),
});

describe("CategoryService", () => {
  let repository: jest.Mocked<ICategoryRepository>;
  let service: CategoryService;

  beforeEach(() => {
    repository = buildRepositoryMock();
    service = new CategoryService(repository);
  });

  describe("create", () => {
    it("Debería guardar y devolver la categoría", async () => {
      const category = await service.create({
        name: "Textos",
        description: "Escolares",
      });
      expect(repository.save).toHaveBeenCalledWith(category);
      expect(category.getName()).toBe("Textos");
    });

    it("Debería lanzar ValidationError sin guardar si el nombre falta", async () => {
      await expect(service.create({})).rejects.toBeInstanceOf(ValidationError);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("Debería devolver lo que entrega el repositorio", async () => {
      const list = [new Category({ name: "A" })];
      repository.findAll.mockResolvedValue(list);
      await expect(service.getAll()).resolves.toBe(list);
    });
  });

  describe("delete", () => {
    it("Debería lanzar ResourceNotFoundError si no existe", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.delete("1")).rejects.toBeInstanceOf(ResourceNotFoundError);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });
});
