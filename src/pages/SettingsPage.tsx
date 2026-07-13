import { ChangeEvent, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Edit, Plus, Printer, Save, Trash2, Upload, X } from "lucide-react";
import { dbApi } from "../database/db";
import { printOrder } from "../services/printService";
import type { BackupPayload, Categoria, Configuracao, Pedido, Produto } from "../types";
import { money, uid } from "../utils/format";

interface Props {
  products: Produto[];
  categories: Categoria[];
  orders: Pedido[];
  settings: Configuracao;
  onChanged: () => void;
}

interface ProductForm {
  id?: string;
  nome: string;
  preco: string;
  categoriaId: string;
  icone: string;
  imagem: string;
  descricao: string;
  ativo: boolean;
  ordem?: number;
  criadoEm?: string;
}

const blankProductForm = (categories: Categoria[]): ProductForm => ({
  nome: "",
  preco: "",
  categoriaId: categories.find((category) => category.ativo)?.id ?? categories[0]?.id ?? "",
  icone: "🍢",
  imagem: "",
  descricao: "",
  ativo: true,
});

const productToForm = (product: Produto): ProductForm => ({
  id: product.id,
  nome: product.nome,
  preco: product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  categoriaId: product.categoriaId,
  icone: product.icone,
  imagem: product.imagem ?? "",
  descricao: product.descricao ?? "",
  ativo: product.ativo,
  ordem: product.ordem,
  criadoEm: product.criadoEm,
});

const parseBrazilianPrice = (value: string) => Number(value.trim().replace(/\./g, "").replace(",", "."));

export const SettingsPage = ({ products, categories, orders, settings, onChanged }: Props) => {
  const [tab, setTab] = useState("evento");
  const [localSettings, setLocalSettings] = useState(settings);
  const [productForm, setProductForm] = useState<ProductForm>(blankProductForm(categories));
  const [productModalMode, setProductModalMode] = useState<"new" | "edit" | null>(null);
  const [productMessage, setProductMessage] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("todos");
  const [productStatusFilter, setProductStatusFilter] = useState("todos");
  const [categoryDraft, setCategoryDraft] = useState<Categoria>({ id: uid("cat"), nome: "", ordem: 99, ativo: true, icone: "more" });
  const usedProductIds = useMemo(() => new Set(orders.flatMap((order) => order.itens.map((item) => item.productId))), [orders]);

  const categoryName = (categoryId: string) => categories.find((category) => category.id === categoryId)?.nome ?? "Sem categoria";

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.nome.toLowerCase().includes(productSearch.trim().toLowerCase());
        const matchesCategory = productCategoryFilter === "todos" || product.categoriaId === productCategoryFilter;
        const matchesStatus =
          productStatusFilter === "todos" ||
          (productStatusFilter === "ativos" && product.ativo) ||
          (productStatusFilter === "inativos" && !product.ativo);
        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [products, productSearch, productCategoryFilter, productStatusFilter],
  );

  const saveSettings = async () => {
    await dbApi.saveSettings(localSettings);
    onChanged();
    alert("Configurações salvas.");
  };

  const openNewProduct = () => {
    setProductForm(blankProductForm(categories));
    setProductModalMode("new");
    setProductMessage("");
  };

  const openEditProduct = (product: Produto) => {
    setProductForm(productToForm(product));
    setProductModalMode("edit");
    setProductMessage("");
  };

  const closeProductModal = () => {
    setProductModalMode(null);
    setProductForm(blankProductForm(categories));
  };

  const nextOrderForCategory = (categoryId: string) => {
    const sameCategory = products.filter((product) => product.categoriaId === categoryId);
    return sameCategory.length ? Math.max(...sameCategory.map((product) => product.ordem)) + 1 : 1;
  };

  const saveProduct = async () => {
    const name = productForm.nome.trim();
    const price = parseBrazilianPrice(productForm.preco);
    if (!name) return alert("Informe o nome do produto.");
    if (!Number.isFinite(price) || price < 0) return alert("Informe um preço válido. Exemplo: 10,00.");
    if (!categories.some((category) => category.id === productForm.categoriaId)) return alert("Selecione uma categoria válida.");

    const duplicate = products.find(
      (product) =>
        product.ativo &&
        productForm.ativo &&
        product.id !== productForm.id &&
        product.nome.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate && !confirm("Já existe um produto ativo com esse nome. Deseja salvar mesmo assim?")) return;

    const product: Produto = {
      id: productForm.id ?? uid("prod"),
      nome: name,
      preco: price,
      categoriaId: productForm.categoriaId,
      descricao: productForm.descricao.trim() || undefined,
      icone: productForm.icone.trim() || "🍢",
      imagem: productForm.imagem.trim() || undefined,
      ativo: productForm.ativo,
      ordem: productForm.id ? productForm.ordem ?? nextOrderForCategory(productForm.categoriaId) : nextOrderForCategory(productForm.categoriaId),
      criadoEm: productForm.criadoEm ?? new Date().toISOString(),
    };

    await dbApi.saveProduct(product);
    closeProductModal();
    setProductMessage(productModalMode === "edit" ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
    onChanged();
  };

  const toggleProduct = async (product: Produto) => {
    await dbApi.saveProduct({ ...product, ativo: !product.ativo });
    onChanged();
  };

  const removeProduct = async (product: Produto) => {
    if (usedProductIds.has(product.id)) {
      alert("Este produto já foi utilizado em vendas e não pode ser excluído. Ele será desativado para preservar o histórico.");
      await dbApi.saveProduct({ ...product, ativo: false });
      onChanged();
      return;
    }
    if (!confirm(`Excluir definitivamente o produto "${product.nome}"?`)) return;
    await dbApi.deleteProduct(product.id);
    onChanged();
  };

  const moveProduct = async (product: Produto, direction: -1 | 1) => {
    const sameCategory = products
      .filter((item) => item.categoriaId === product.categoriaId)
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
    const index = sameCategory.findIndex((item) => item.id === product.id);
    const target = sameCategory[index + direction];
    if (!target) return;
    await Promise.all([
      dbApi.saveProduct({ ...product, ordem: target.ordem }),
      dbApi.saveProduct({ ...target, ordem: product.ordem }),
    ]);
    onChanged();
  };

  const saveCategory = async () => {
    if (!categoryDraft.nome.trim()) return alert("Informe o nome da categoria.");
    await dbApi.saveCategory({ ...categoryDraft, nome: categoryDraft.nome.trim() });
    setCategoryDraft({ id: uid("cat"), nome: "", ordem: 99, ativo: true, icone: "more" });
    onChanged();
  };

  const exportBackup = async () => downloadJson(await dbApi.exportAll(), "backup-caixa-insanos.json");

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm("Importar backup e substituir os dados atuais?")) return;
    const payload = JSON.parse(await file.text()) as BackupPayload;
    await dbApi.importAll(payload);
    onChanged();
  };

  const exportSalesCsv = () => {
    const rows = [["pedido", "data", "status", "pagamento", "total", "itens"]];
    orders.forEach((order) =>
      rows.push([
        String(order.numero),
        order.criadoEm,
        order.status,
        order.formaPagamento,
        String(order.total),
        order.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(" | "),
      ]),
    );
    downloadBlob(rows.map((row) => row.join(";")).join("\n"), "vendas.csv", "text/csv;charset=utf-8");
  };

  const clearAll = async () => {
    const typed = prompt("Digite APAGAR para confirmar a exclusão total dos dados.");
    if (typed !== "APAGAR") return;
    await dbApi.clearAll();
    onChanged();
  };

  const testPrint = () => {
    printOrder(
      {
        id: "test",
        sessionId: "test",
        numero: 42,
        itens: [{ productId: "test", nome: "Espetinho de Carne", quantidade: 2, valorUnitario: 10, subtotal: 20 }],
        total: 20,
        formaPagamento: "pix",
        status: "pago",
        operador: settings.operadorPadrao,
        criadoEm: new Date().toISOString(),
      },
      { ...localSettings, impressaoAtivada: true },
    );
  };

  return (
    <section className="settings-page">
      <nav className="tabs">
        {["evento", "produtos", "categorias", "impressao", "backup"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {tab === "evento" && (
        <div className="panel form-panel">
          <h2>Evento</h2>
          <label>Nome principal<input value={localSettings.nomeEvento} onChange={(e) => setLocalSettings({ ...localSettings, nomeEvento: e.target.value })} /></label>
          <label>Subtítulo<input value={localSettings.subtitulo} onChange={(e) => setLocalSettings({ ...localSettings, subtitulo: e.target.value })} /></label>
          <label>Mensagem da comanda<input value={localSettings.mensagemComanda} onChange={(e) => setLocalSettings({ ...localSettings, mensagemComanda: e.target.value })} /></label>
          <label>Operador padrão<input value={localSettings.operadorPadrao} onChange={(e) => setLocalSettings({ ...localSettings, operadorPadrao: e.target.value })} /></label>
          <button className="primary-action small" onClick={saveSettings}><Save /> Salvar evento</button>
        </div>
      )}

      {tab === "produtos" && (
        <div className="panel form-panel">
          <div className="products-admin-head">
            <h2>Produtos</h2>
            <button className="primary-action small" onClick={openNewProduct}><Plus /> Novo produto</button>
          </div>
          {productMessage && <p className="message ok">{productMessage}</p>}

          <div className="product-filters form-grid">
            <label>Buscar produto<input placeholder="Buscar produto" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} /></label>
            <label>Categoria<select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)}><option value="todos">Todas</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</select></label>
            <label>Status<select value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value)}><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select></label>
          </div>

          <div className="product-admin-list">
            {filteredProducts.map((product) => (
              <article className="product-admin-row" key={product.id}>
                <div className="product-admin-media">{product.imagem ? <img src={product.imagem} alt="" /> : product.icone}</div>
                <div className="product-admin-info">
                  <strong>{product.nome}</strong>
                  <span>{money(product.preco)}</span>
                  <small>Categoria: {categoryName(product.categoriaId)} · Status: {product.ativo ? "Ativo" : "Inativo"}</small>
                </div>
                <div className="product-admin-actions">
                  <button onClick={() => openEditProduct(product)}><Edit size={17} /> Editar</button>
                  <button onClick={() => toggleProduct(product)}>{product.ativo ? "Desativar" : "Ativar"}</button>
                  <button className="danger-button" onClick={() => removeProduct(product)}><Trash2 size={17} /> Excluir</button>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && <p className="empty">Nenhum produto encontrado.</p>}
          </div>

          <section className="organize-products">
            <h3>Organizar produtos</h3>
            <div className="organize-list">
              {products.map((product) => (
                <div key={product.id}>
                  <span>{product.nome}<small>{categoryName(product.categoriaId)}</small></span>
                  <button onClick={() => moveProduct(product, -1)}><ArrowUp size={16} /> Subir</button>
                  <button onClick={() => moveProduct(product, 1)}><ArrowDown size={16} /> Descer</button>
                </div>
              ))}
            </div>
          </section>

          {productModalMode && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="product-modal">
                <div className="modal-head">
                  <h2>{productModalMode === "new" ? "Cadastrar novo produto" : "Editar produto"}</h2>
                  <button className="icon-button" onClick={closeProductModal} aria-label="Cancelar"><X /></button>
                </div>
                <div className="form-grid">
                  <label>Nome do produto<input value={productForm.nome} onChange={(e) => setProductForm({ ...productForm, nome: e.target.value })} /></label>
                  <label>Preço<input inputMode="decimal" placeholder="10,00" value={productForm.preco} onChange={(e) => setProductForm({ ...productForm, preco: e.target.value })} /></label>
                  <label>Categoria<select value={productForm.categoriaId} onChange={(e) => setProductForm({ ...productForm, categoriaId: e.target.value })}>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</select></label>
                  <label>Ícone ou emoji<input value={productForm.icone} onChange={(e) => setProductForm({ ...productForm, icone: e.target.value })} /></label>
                  <label>Imagem opcional<input value={productForm.imagem} onChange={(e) => setProductForm({ ...productForm, imagem: e.target.value })} /></label>
                  <label>Descrição opcional<input value={productForm.descricao} onChange={(e) => setProductForm({ ...productForm, descricao: e.target.value })} /></label>
                  <label className="check"><input type="checkbox" checked={productForm.ativo} onChange={(e) => setProductForm({ ...productForm, ativo: e.target.checked })} /> Produto ativo</label>
                </div>
                <div className="toolbar">
                  <button className="primary-action small" onClick={saveProduct}><Save /> {productModalMode === "new" ? "Salvar produto" : "Salvar alterações"}</button>
                  <button onClick={closeProductModal}><X /> Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "categorias" && (
        <div className="panel form-panel">
          <h2>Categorias</h2>
          <div className="admin-grid">
            {categories.map((category) => (
              <div className="admin-item" key={category.id}>
                <button onClick={() => setCategoryDraft(category)}>{category.nome}<small>{category.ativo ? "ativa" : "inativa"} · ordem {category.ordem}</small></button>
                <button onClick={() => dbApi.saveCategory({ ...category, ativo: !category.ativo }).then(onChanged)}>{category.ativo ? "Desativar" : "Ativar"}</button>
              </div>
            ))}
          </div>
          <div className="form-grid">
            <label>Nome<input value={categoryDraft.nome} onChange={(e) => setCategoryDraft({ ...categoryDraft, nome: e.target.value })} /></label>
            <label>Ordem<input type="number" value={categoryDraft.ordem} onChange={(e) => setCategoryDraft({ ...categoryDraft, ordem: Number(e.target.value) })} /></label>
            <label>Ícone<select value={categoryDraft.icone} onChange={(e) => setCategoryDraft({ ...categoryDraft, icone: e.target.value })}><option value="skewer">Espetinhos</option><option value="cup">Bebidas</option><option value="users">Combos</option><option value="more">Outros</option></select></label>
            <label className="check"><input type="checkbox" checked={categoryDraft.ativo} onChange={(e) => setCategoryDraft({ ...categoryDraft, ativo: e.target.checked })} /> Ativa</label>
          </div>
          <button className="primary-action small" onClick={saveCategory}><Save /> Salvar categoria</button>
        </div>
      )}

      {tab === "impressao" && (
        <div className="panel form-panel">
          <h2>Impressão</h2>
          <div className="form-grid">
            <label className="check"><input type="checkbox" checked={localSettings.impressaoAtivada} onChange={(e) => setLocalSettings({ ...localSettings, impressaoAtivada: e.target.checked })} /> Impressão ativada</label>
            <label>Largura<input type="number" value={localSettings.larguraMm} onChange={(e) => setLocalSettings({ ...localSettings, larguraMm: Number(e.target.value) })} /></label>
            <label>Vias<select value={localSettings.vias} onChange={(e) => setLocalSettings({ ...localSettings, vias: Number(e.target.value) as 1 | 2 })}><option value={1}>Uma via</option><option value={2}>Duas vias</option></select></label>
            <label className="check"><input type="checkbox" checked={localSettings.mostrarValores} onChange={(e) => setLocalSettings({ ...localSettings, mostrarValores: e.target.checked })} /> Mostrar valores</label>
            <label className="check"><input type="checkbox" checked={localSettings.mostrarTotal} onChange={(e) => setLocalSettings({ ...localSettings, mostrarTotal: e.target.checked })} /> Mostrar total</label>
            <label className="check"><input type="checkbox" checked={localSettings.mostrarPagamento} onChange={(e) => setLocalSettings({ ...localSettings, mostrarPagamento: e.target.checked })} /> Mostrar pagamento</label>
            <label>Rodapé<input value={localSettings.rodape} onChange={(e) => setLocalSettings({ ...localSettings, rodape: e.target.value })} /></label>
          </div>
          <div className="toolbar">
            <button className="primary-action small" onClick={saveSettings}><Save /> Salvar impressão</button>
            <button onClick={testPrint}><Printer /> Testar impressão</button>
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="panel form-panel">
          <h2>Backup</h2>
          <div className="toolbar wrap">
            <button onClick={exportBackup}><Download /> Exportar backup</button>
            <label className="file-button"><Upload /> Importar backup<input type="file" accept="application/json" onChange={importBackup} /></label>
            <button onClick={exportSalesCsv}><Download /> Exportar vendas CSV</button>
            <button className="danger-button" onClick={clearAll}><Trash2 /> Apagar todos os dados</button>
          </div>
        </div>
      )}
    </section>
  );
};

const downloadJson = (payload: unknown, filename: string) => downloadBlob(JSON.stringify(payload, null, 2), filename, "application/json");

const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
