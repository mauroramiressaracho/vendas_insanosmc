import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BackupPayload, Categoria, Configuracao, Pedido, Produto, SessaoCaixa } from "../types";
import { defaultSettings, initialCategories, initialProducts } from "./seed";

interface CaixaDB extends DBSchema {
  products: { key: string; value: Produto; indexes: { by_category: string } };
  categories: { key: string; value: Categoria };
  orders: { key: string; value: Pedido; indexes: { by_session: string; by_created: string } };
  cashSessions: { key: string; value: SessaoCaixa; indexes: { by_status: string } };
  settings: { key: string; value: Configuracao };
}

let dbPromise: Promise<IDBPDatabase<CaixaDB>> | null = null;

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<CaixaDB>("caixa-insanos-db", 4, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const products = db.createObjectStore("products", { keyPath: "id" });
          products.createIndex("by_category", "categoriaId");
          db.createObjectStore("categories", { keyPath: "id" });
          const orders = db.createObjectStore("orders", { keyPath: "id" });
          orders.createIndex("by_session", "sessionId");
          orders.createIndex("by_created", "criadoEm");
          const sessions = db.createObjectStore("cashSessions", { keyPath: "id" });
          sessions.createIndex("by_status", "status");
          db.createObjectStore("settings", { keyPath: "id" });
        }

        if (oldVersion < 2) {
          const products = transaction.objectStore("products");
          let cursor = await products.openCursor();
          while (cursor) {
            const product = cursor.value;
            const isCarne = product.id === "prod-carne";
            const isLinguica = product.id === "prod-linguica";
            const migratedProduct: Produto = {
              ...product,
              ativo: isCarne || isLinguica,
              ...(isCarne ? { nome: "Espetinho de Carne", preco: 10, ordem: 1, categoriaId: "cat-espetinhos" } : {}),
              ...(isLinguica ? { nome: "Espetinho de Linguiça", preco: 10, ordem: 2, categoriaId: "cat-espetinhos" } : {}),
            };
            await cursor.update(migratedProduct);
            cursor = await cursor.continue();
          }
        }

        if (oldVersion < 3) {
          const products = transaction.objectStore("products");
          const carne = await products.get("prod-carne");
          const linguica = await products.get("prod-linguica");
          if (carne) await products.put({ ...carne, icone: "🍢" });
          if (linguica) await products.put({ ...linguica, icone: "🍢" });
        }
        if (oldVersion < 4) {
          const settingsStore = transaction.objectStore("settings");
          const settings = await settingsStore.get("default");
          if (settings?.operadorPadrao.trim().toLowerCase() === "mauro") {
            await settingsStore.put({ ...settings, operadorPadrao: "" });
          }
        }
      },
    });
  }
  return dbPromise;
};

export const seedIfEmpty = async () => {
  const db = await getDb();
  if ((await db.count("categories")) === 0) {
    const tx = db.transaction(["categories", "products", "settings"], "readwrite");
    await Promise.all([
      ...initialCategories.map((category) => tx.objectStore("categories").put(category)),
      ...initialProducts.map((product) => tx.objectStore("products").put(product)),
      tx.objectStore("settings").put(defaultSettings),
      tx.done,
    ]);
  } else if (!(await db.get("settings", "default"))) {
    await db.put("settings", defaultSettings);
  }
};

export const dbApi = {
  async getProducts() {
    return (await getDb()).getAll("products");
  },
  async saveProduct(product: Produto) {
    return (await getDb()).put("products", product);
  },
  async deleteProduct(id: string) {
    return (await getDb()).delete("products", id);
  },
  async getCategories() {
    return (await getDb()).getAll("categories");
  },
  async saveCategory(category: Categoria) {
    return (await getDb()).put("categories", category);
  },
  async getOrders() {
    return (await getDb()).getAllFromIndex("orders", "by_created");
  },
  async getOrdersBySession(sessionId: string) {
    return (await getDb()).getAllFromIndex("orders", "by_session", sessionId);
  },
  async saveOrder(order: Pedido) {
    return (await getDb()).put("orders", order);
  },
  async getOpenSession() {
    const sessions = await (await getDb()).getAllFromIndex("cashSessions", "by_status", "aberto");
    return sessions[sessions.length - 1];
  },
  async saveSession(session: SessaoCaixa) {
    return (await getDb()).put("cashSessions", session);
  },
  async getSessions() {
    return (await getDb()).getAll("cashSessions");
  },
  async getSettings() {
    return (await getDb()).get("settings", "default");
  },
  async saveSettings(settings: Configuracao) {
    return (await getDb()).put("settings", settings);
  },
  async exportAll() {
    const db = await getDb();
    return {
      exportedAt: new Date().toISOString(),
      products: await db.getAll("products"),
      categories: await db.getAll("categories"),
      orders: await db.getAll("orders"),
      cashSessions: await db.getAll("cashSessions"),
      settings: (await db.get("settings", "default")) ?? defaultSettings,
    };
  },
  async importAll(payload: BackupPayload) {
    const db = await getDb();
    const tx = db.transaction(["products", "categories", "orders", "cashSessions", "settings"], "readwrite");
    await Promise.all([
      tx.objectStore("products").clear(),
      tx.objectStore("categories").clear(),
      tx.objectStore("orders").clear(),
      tx.objectStore("cashSessions").clear(),
      tx.objectStore("settings").clear(),
    ]);
    await Promise.all([
      ...payload.products.map((item) => tx.objectStore("products").put(item)),
      ...payload.categories.map((item) => tx.objectStore("categories").put(item)),
      ...payload.orders.map((item) => tx.objectStore("orders").put(item)),
      ...payload.cashSessions.map((item) => tx.objectStore("cashSessions").put(item)),
      tx.objectStore("settings").put(payload.settings),
      tx.done,
    ]);
  },
  async clearAll() {
    const db = await getDb();
    const tx = db.transaction(["products", "categories", "orders", "cashSessions", "settings"], "readwrite");
    await Promise.all([
      tx.objectStore("products").clear(),
      tx.objectStore("categories").clear(),
      tx.objectStore("orders").clear(),
      tx.objectStore("cashSessions").clear(),
      tx.objectStore("settings").clear(),
      tx.done,
    ]);
    dbPromise = null;
    await seedIfEmpty();
  },
};
