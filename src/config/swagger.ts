export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'MercadoNexus API',
    version: '1.0.0',
    description:
      'Documentación técnica de la API RESTful para la plataforma de E-Commerce MercadoNexus. Esta interfaz es exclusivamente de consulta y documentación de endpoints.',
  },
  tags: [
    { name: 'Health', description: 'Verificación del estado del servicio' },
    { name: 'Usuarios', description: 'Registro, inicio de sesión y gestión de usuarios' },
    { name: 'Categorías', description: 'Administración y consulta de categorías de productos' },
    { name: 'Provincias', description: 'Consulta y actualización de tarifas logísticas por provincia' },
    { name: 'Productos', description: 'Catálogo público y gestión de productos por vendedores' },
    { name: 'Órdenes y Carrito', description: 'Gestión del carrito de compras, checkout y seguimiento de pedidos' },
  ],
  components: {
    schemas: {
      RespuestaExitosa: {
        title: 'Estructura Base de Respuesta Exitosa',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operación realizada correctamente' },
        },
      },
      RespuestaError: {
        title: 'Estructura Base de Respuesta de Error',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Descripción del error' },
          error: {
            type: 'object',
            nullable: true,
            description: 'Detalle de campos inválidos (presente en errores 400 de validación)',
            example: { campo: 'Mensaje de validación específico' },
          },
        },
      },
      RespuestaUsuario: {
        title: 'Modelo de Respuesta de Usuario',
        type: 'object',
        properties: {
          id: { type: 'string', example: '66f7d0b3a4e5f67890123456' },
          firstName: { type: 'string', example: 'Juan' },
          lastName: { type: 'string', example: 'Pérez' },
          dni: { type: 'string', example: '35123456' },
          email: { type: 'string', example: 'juan@example.com' },
          phone: { type: 'string', nullable: true, example: '+54 11 4444-5555' },
          role: { type: 'string', enum: ['ADMIN', 'SELLER', 'CLIENT'], example: 'CLIENT' },
        },
      },
      RespuestaCategoria: {
        title: 'Modelo de Respuesta de Categoría',
        type: 'object',
        properties: {
          id: { type: 'string', example: '66f7d0b3a4e5f67890123457' },
          name: { type: 'string', example: 'Novelas' },
          description: { type: 'string', nullable: true, example: 'Libros y novelas de diversos géneros' },
        },
      },
      RespuestaProvincia: {
        title: 'Modelo de Respuesta de Provincia',
        type: 'object',
        properties: {
          id: { type: 'string', example: '66f7d0b3a4e5f67890123458' },
          name: { type: 'string', example: 'Buenos Aires' },
          shippingCost: { type: 'number', example: 3500 },
        },
      },
      RespuestaProducto: {
        title: 'Modelo de Respuesta de Producto',
        type: 'object',
        properties: {
          id: { type: 'string', example: '66f7d0b3a4e5f67890123459' },
          sku: { type: 'string', example: 'PROD-001' },
          name: { type: 'string', example: 'Auriculares Bluetooth' },
          description: { type: 'string', example: 'Cancelación activa de ruido y 30hs de batería' },
          salePrice: { type: 'number', example: 45000 },
          stock: { type: 'integer', example: 25 },
          isActive: { type: 'boolean', example: true },
          sellerId: { type: 'string', example: '66f7d0b3a4e5f67890123456' },
          categoryId: { type: 'string', example: '66f7d0b3a4e5f67890123457' },
          category: { $ref: '#/components/schemas/RespuestaCategoria', nullable: true },
        },
      },
      RespuestaItemOrden: {
        title: 'Modelo de Respuesta de Ítem de Orden',
        type: 'object',
        properties: {
          productId: { type: 'string', example: '66f7d0b3a4e5f67890123459' },
          quantity: { type: 'integer', example: 2 },
          recordedSalePrice: { type: 'number', example: 45000 },
          sellerId: { type: 'string', example: '66f7d0b3a4e5f67890123456' },
        },
      },
      RespuestaFactura: {
        title: 'Modelo de Respuesta de Factura',
        type: 'object',
        properties: {
          invoiceType: { type: 'string', example: 'Factura B' },
          subtotal: { type: 'number', example: 90000 },
          tax: { type: 'number', description: 'IVA (21% sobre subtotal)', example: 18900 },
          shippingCost: { type: 'number', example: 3500 },
          total: { type: 'number', example: 112400 },
          date: { type: 'string', format: 'date-time' },
        },
      },
      RespuestaEnvio: {
        title: 'Modelo de Respuesta de Envío',
        type: 'object',
        properties: {
          address: { type: 'string', example: 'Av. Corrientes 1234, CABA' },
          provinceId: { type: 'string', example: '66f7d0b3a4e5f67890123458' },
          provinceName: { type: 'string', example: 'Buenos Aires' },
          cost: { type: 'number', example: 3500 },
          trackingCode: {
            type: 'string',
            format: 'uuid',
            description: 'Identificador único UUIDv7 generado automáticamente al pasar a IN_TRANSIT',
            example: '0193132e-4b68-7b98-9022-771122334455',
            nullable: true,
          },
        },
      },
      RespuestaOrden: {
        title: 'Modelo de Respuesta de Orden Confirmada',
        type: 'object',
        properties: {
          id: { type: 'string', example: '66f7d0b3a4e5f67890123461' },
          userId: { type: 'string', example: '66f7d0b3a4e5f67890123456' },
          orderStatus: {
            type: 'string',
            enum: ['CART', 'PENDING_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
            example: 'PENDING_DISPATCH',
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/RespuestaItemOrden' },
          },
          invoice: { $ref: '#/components/schemas/RespuestaFactura' },
          shipping: { $ref: '#/components/schemas/RespuestaEnvio' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RespuestaCarrito: {
        title: 'Modelo de Respuesta de Carrito Activo',
        type: 'object',
        properties: {
          id: {
            type: 'string',
            nullable: true,
            description: 'ID del carrito en BD (o null si aún no tiene ítems guardados)',
            example: '66f7d0b3a4e5f67890123461',
          },
          userId: { type: 'string', example: '66f7d0b3a4e5f67890123456' },
          orderStatus: {
            type: 'string',
            enum: ['CART'],
            example: 'CART',
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/RespuestaItemOrden' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RespuestaVentaVendedor: {
        title: 'Modelo de Respuesta de Venta del Vendedor',
        type: 'object',
        description:
          'Contiene únicamente los ítems pertenecientes al vendedor autenticado dentro de una orden confirmada.',
        properties: {
          orderId: { type: 'string', example: '66f7d0b3a4e5f67890123461' },
          orderStatus: {
            type: 'string',
            enum: ['PENDING_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
            example: 'PENDING_DISPATCH',
          },
          saleDate: { type: 'string', format: 'date-time' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string', example: '66f7d0b3a4e5f67890123459' },
                sku: { type: 'string', example: 'PROD-001' },
                name: { type: 'string', example: 'Auriculares Bluetooth' },
                category: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '66f7d0b3a4e5f67890123457' },
                    name: { type: 'string', example: 'Tecnología' },
                  },
                },
                quantity: { type: 'integer', example: 2 },
                recordedSalePrice: { type: 'number', example: 45000 },
              },
            },
          },
          subtotal: {
            type: 'number',
            description: 'Suma de (quantity * recordedSalePrice) de los productos de este vendedor en la orden',
            example: 90000,
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Estado de salud de la API',
        responses: {
          200: {
            description: 'Servicio en línea',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                      },
                    },
                    message: { type: 'string', example: 'API E-commerce UTN funcionando' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users/register': {
      post: {
        tags: ['Usuarios'],
        summary: 'Registro de nuevo usuario (CLIENT o SELLER)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'dni', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', example: 'Juan' },
                  lastName: { type: 'string', example: 'Pérez' },
                  dni: { type: 'string', example: '35123456' },
                  email: { type: 'string', format: 'email', example: 'juan@example.com' },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 6,
                    description: 'Mínimo 6 caracteres',
                    example: 'Segura123!',
                  },
                  phone: { type: 'string', description: 'Opcional', example: '+54 11 4444-5555' },
                  role: {
                    type: 'string',
                    enum: ['CLIENT', 'SELLER'],
                    default: 'CLIENT',
                    description: 'Opcional (por defecto CLIENT). No se permite registrar ADMIN.',
                    example: 'CLIENT',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario registrado correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaUsuario' },
                    message: { type: 'string', example: 'Usuario registrado correctamente' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Datos de entrada inválidos o email/DNI ya registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'No está permitido registrarse con el rol ADMIN',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['Usuarios'],
        summary: 'Inicio de sesión (retorna token JWT)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'juan@example.com' },
                  password: { type: 'string', format: 'password', example: 'Segura123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        token: {
                          type: 'string',
                          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        user: { $ref: '#/components/schemas/RespuestaUsuario' },
                      },
                    },
                    message: { type: 'string', example: 'Login exitoso' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Email y contraseña son obligatorios',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Credenciales inválidas',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Usuarios'],
        summary: 'Consultar perfil del usuario autenticado (Requiere Header Authorization: Bearer <token>)',
        responses: {
          200: {
            description: 'Datos del perfil actual',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaUsuario' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Usuario no encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listado global de usuarios (Solo ADMIN)',
        responses: {
          200: {
            description: 'Listado de usuarios registrados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaUsuario' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Acceso no permitido (Requiere rol ADMIN)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categorías'],
        summary: 'Listado público de categorías ordenadas alfabéticamente',
        responses: {
          200: {
            description: 'Categorías disponibles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaCategoria' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categorías'],
        summary: 'Crear nueva categoría (Solo ADMIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Tecnología' },
                  description: {
                    type: 'string',
                    description: 'Opcional',
                    example: 'Dispositivos y gadgets electrónicos',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Categoría creada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaCategoria' },
                    message: { type: 'string', example: 'Categoría creada correctamente' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Nombre inválido o categoría duplicada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol ADMIN',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/categories/{id}': {
      delete: {
        tags: ['Categorías'],
        summary: 'Eliminar categoría (Solo ADMIN)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Categoría eliminada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'Categoría eliminada correctamente' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol ADMIN',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Categoría no encontrada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          409: {
            description: 'Conflicto: No se puede eliminar la categoría porque tiene productos asociados',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/provinces': {
      get: {
        tags: ['Provincias'],
        summary: 'Listado público de provincias y tarifas de envío',
        responses: {
          200: {
            description: 'Provincias registradas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaProvincia' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/provinces/{id}': {
      put: {
        tags: ['Provincias'],
        summary: 'Actualizar tarifa de envío de una provincia (Solo ADMIN)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['shippingCost'],
                properties: {
                  shippingCost: { type: 'number', minimum: 0, example: 4200 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Tarifa actualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaProvincia' },
                    message: { type: 'string', example: 'Costo de envío actualizado correctamente' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Costo de envío inválido (debe ser un número mayor o igual a 0)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol ADMIN',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Provincia no encontrada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Productos'],
        summary: 'Catálogo público de productos activos con paginación y filtros',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Número de página (por defecto 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Cantidad de resultados por página (por defecto 10, máximo 100)',
            schema: { type: 'integer', default: 10 },
          },
          { name: 'category', in: 'query', description: 'Filtrar por ID de categoría', schema: { type: 'string' } },
          {
            name: 'q',
            in: 'query',
            description: 'Búsqueda por texto en nombre o descripción',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Página de productos activos junto con metadatos de paginación',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaProducto' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 35 },
                        totalPages: { type: 'integer', example: 4 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Productos'],
        summary: 'Publicar nuevo producto (Solo SELLER)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'name', 'description', 'salePrice', 'stock', 'categoryId'],
                properties: {
                  sku: { type: 'string', example: 'PROD-001' },
                  name: { type: 'string', example: 'Auriculares Bluetooth' },
                  description: { type: 'string', example: 'Cancelación activa de ruido y 30hs de batería' },
                  salePrice: { type: 'number', minimum: 1, example: 45000 },
                  stock: { type: 'integer', minimum: 0, example: 25 },
                  categoryId: { type: 'string', example: '66f7d0b3a4e5f67890123457' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Producto creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaProducto' },
                    message: { type: 'string', example: 'Producto creado correctamente' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Datos inválidos, SKU duplicado o categoría inexistente',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol SELLER',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/products/mine': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos propios del vendedor (activos e inactivos) (Solo SELLER)',
        responses: {
          200: {
            description: 'Productos del vendedor autenticado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaProducto' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol SELLER',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Obtener detalle de un producto activo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Detalle del producto',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaProducto' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Producto no encontrado o inactivo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
      put: {
        tags: ['Productos'],
        summary: 'Actualizar producto propio activo (Solo SELLER)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Todos los campos son opcionales; solo se actualizan los enviados.',
                properties: {
                  sku: { type: 'string', example: 'PROD-001-PRO' },
                  name: { type: 'string', example: 'Auriculares Bluetooth Pro' },
                  description: { type: 'string', example: 'Edición especial con sonido Hi-Res' },
                  salePrice: { type: 'number', minimum: 1, example: 48000 },
                  stock: { type: 'integer', minimum: 0, example: 30 },
                  categoryId: { type: 'string', example: '66f7d0b3a4e5f67890123457' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Producto modificado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaProducto' },
                    message: { type: 'string', example: 'Producto actualizado correctamente' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Datos inválidos, SKU duplicado o categoría inexistente',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol SELLER',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Producto no encontrado, inactivo o pertenece a otro vendedor (404 por seguridad)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
      delete: {
        tags: ['Productos'],
        summary: 'Baja lógica del producto (isActive=false) (Solo SELLER)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Producto desactivado lógicamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', nullable: true, example: null },
                    message: { type: 'string', example: 'Producto eliminado correctamente' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol SELLER',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Producto no encontrado, inactivo o pertenece a otro vendedor',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders/cart': {
      get: {
        tags: ['Órdenes y Carrito'],
        summary: 'Obtener carrito actual del cliente con precios sincronizados (Solo CLIENT)',
        responses: {
          200: {
            description: 'Carrito de compras actual',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaCarrito' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol CLIENT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
      post: {
        tags: ['Órdenes y Carrito'],
        summary: 'Agregar producto al carrito (Solo CLIENT)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string', example: '66f7d0b3a4e5f67890123459' },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    default: 1,
                    description:
                      'Opcional (por defecto 1). Si el producto ya está en el carrito, se suma a la cantidad actual.',
                    example: 2,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Producto agregado al carrito',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaCarrito' },
                    message: { type: 'string', example: 'Producto agregado al carrito' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Datos inválidos o el producto se encuentra inactivo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol CLIENT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Producto no encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders/cart/items/{productId}': {
      put: {
        tags: ['Órdenes y Carrito'],
        summary: 'Actualizar cantidad de un producto en el carrito (Solo CLIENT)',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'integer', minimum: 1, example: 3 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Cantidad actualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaCarrito' },
                    message: { type: 'string', example: 'Cantidad actualizada correctamente' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Cantidad inválida, producto inactivo o ítem no presente en el carrito',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol CLIENT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Producto no encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
      delete: {
        tags: ['Órdenes y Carrito'],
        summary: 'Eliminar producto del carrito (Solo CLIENT)',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Producto eliminado del carrito',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaCarrito' },
                    message: { type: 'string', example: 'Producto eliminado del carrito' },
                  },
                },
              },
            },
          },
          400: {
            description: 'El producto no se encuentra en el carrito',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol CLIENT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders/{id}/checkout': {
      post: {
        tags: ['Órdenes y Carrito'],
        summary: 'Finalizar compra del carrito (descuento atómico de stock y emisión de Factura B) (Solo CLIENT)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la orden en estado CART',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['provinceId', 'address'],
                description: 'ID de la provincia de destino y dirección de calle/altura/localidad en formato texto.',
                properties: {
                  provinceId: {
                    type: 'string',
                    description: 'ID de la provincia (obtenido de GET /api/provinces)',
                    example: '66f7d0b3a4e5f67890123458',
                  },
                  address: {
                    type: 'string',
                    description: 'Dirección de entrega completa',
                    example: 'Av. Corrientes 1234, CABA',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Compra finalizada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaOrden' },
                    message: { type: 'string', example: 'Checkout realizado con éxito' },
                  },
                },
              },
            },
          },
          400: {
            description:
              'Faltan datos de envío (provinceId o address), carrito vacío, orden ya procesada o stock insuficiente',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol CLIENT y ser titular de la orden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Orden o provincia no encontrada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders/my-orders': {
      get: {
        tags: ['Órdenes y Carrito'],
        summary: 'Historial de órdenes confirmadas y seguimiento de envío del cliente (Solo CLIENT)',
        responses: {
          200: {
            description: 'Listado de órdenes confirmadas del cliente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaOrden' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol CLIENT',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders/seller-sales': {
      get: {
        tags: ['Órdenes y Carrito'],
        summary: 'Historial de ventas de productos propios ordenadas por fecha descendente (Solo SELLER)',
        responses: {
          200: {
            description: 'Ventas asociadas al vendedor autenticado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaVentaVendedor' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol SELLER',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Órdenes y Carrito'],
        summary: 'Listado global de órdenes confirmadas del sistema (Solo ADMIN)',
        responses: {
          200: {
            description: 'Todas las órdenes confirmadas del sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RespuestaOrden' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol ADMIN',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
    '/api/orders/{id}/shipping': {
      patch: {
        tags: ['Órdenes y Carrito'],
        summary: 'Actualizar estado de la orden y envío (Solo ADMIN)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderStatus'],
                description:
                  'Nuevo estado de la orden. Al pasar a IN_TRANSIT el sistema genera automáticamente el trackingCode (UUIDv7). Al pasar a CANCELLED se restituye el stock de los productos.',
                properties: {
                  orderStatus: {
                    type: 'string',
                    enum: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
                    description:
                      'Transiciones permitidas: PENDING_DISPATCH -> IN_TRANSIT | CANCELLED; IN_TRANSIT -> DELIVERED | CANCELLED',
                    example: 'IN_TRANSIT',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Estado de envío actualizado (si pasa a IN_TRANSIT incluye trackingCode UUIDv7 generado)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RespuestaOrden' },
                    message: { type: 'string', example: 'Estado de envío actualizado con éxito' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Falta orderStatus, la orden sigue en CART o la transición de estado no es válida',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          401: {
            description: 'Token no proporcionado o inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          403: {
            description: 'Requiere rol ADMIN',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
          404: {
            description: 'Orden no encontrada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RespuestaError' } } },
          },
        },
      },
    },
  },
};
