"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BarcodeScanner from "./BarcodeScanner";

type Product = {
  sku: string;
  brand: string;
  model: string;
  colorway: string;
  thumbnail: string | null;
};

export default function AddPurchaseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [searching, setSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [form, setForm] = useState({
    size: "",
    orderNumber: "",
    platform: "StockX",
    buyPrice: "",
    fees: "",
  });

  useEffect(() => {
    if (!query || query.length < 3 || selected) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setSearching(false);
    }, 400);
  }, [query, selected]);

  function handleSelect(product: Product) {
    setSelected(product);
    setQuery(`${product.brand} ${product.model} ${product.colorway}`);
    setResults([]);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!selected || !form.buyPrice || !form.size) {
      alert(
        "Veuillez remplir les champs obligatoires : sneaker, pointure et prix d'achat",
      );
      return;
    }
    setLoading(true);
    await fetch("/api/purchases", {
      method: "POST",
      body: JSON.stringify({
        brand: selected.brand,
        model: selected.model,
        colorway: selected.colorway,
        sku: selected.sku,
        thumbnail: selected.thumbnail,
        size: form.size,
        orderNumber: form.orderNumber,
        platform: form.platform,
        buyPrice: parseFloat(form.buyPrice),
        fees: parseFloat(form.fees) || 0,
      }),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    setOpen(false);
    setSelected(null);
    setQuery("");
    setForm({
      size: "",
      orderNumber: "",
      platform: "StockX",
      buyPrice: "",
      fees: "",
    });
    router.refresh();
  }

  return (
    <div className="mb-8">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-lg transition-colors"
        >
          + Ajouter un achat
        </button>
      ) : (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Nouvel achat</h2>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowScanner(!showScanner)}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              📷 Scanner le code barre
            </button>
            {showScanner && (
              <div className="mt-3">
                <BarcodeScanner
                  onResult={(result) => {
                    setScanResult(result);
                    setShowScanner(false);
                  }}
                />
              </div>
            )}
            {scanResult && (
              <div className="mt-2 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-green-400">
                Résultat : {scanResult}
              </div>
            )}
          </div>
          <div className="mb-4 relative">
            <label className="text-xs text-zinc-400 uppercase tracking-wider block mb-1">
              Rechercher la sneaker <span className="text-red-500">*</span>
            </label>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Ex: Air Max 1 Lemonade..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            />
            {searching && (
              <div className="absolute right-3 top-9 text-zinc-500 text-xs">
                Recherche...
              </div>
            )}
            {results.length > 0 && (
              <div className="absolute z-10 w-full bg-zinc-800 border border-zinc-700 rounded-lg mt-1 overflow-hidden shadow-xl">
                {results.map((product) => (
                  <button
                    key={product.sku}
                    onClick={() => handleSelect(product)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                  >
                    {product.thumbnail && (
                      <Image
                        src={product.thumbnail}
                        alt={product.model}
                        width={48}
                        height={48}
                        className="object-contain rounded"
                      />
                    )}
                    <div>
                      <div className="text-sm text-white font-medium">
                        {product.brand} {product.model}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {product.colorway} · {product.sku}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {[
                { name: "size", label: "Pointure *", placeholder: "EU 41" },
                {
                  name: "orderNumber",
                  label: "N° Commande",
                  placeholder: "03-XXXXXXXX",
                },
                {
                  name: "buyPrice",
                  label: "Prix achat (€) *",
                  placeholder: "0.00",
                  type: "number",
                },
                {
                  name: "fees",
                  label: "Frais annexes (€)",
                  placeholder: "0.00",
                  type: "number",
                },
              ].map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">
                  Fournisseur
                </label>
                <select
                  name="platform"
                  value={form.platform}
                  onChange={handleChange}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                >
                  <option>StockX</option>
                  <option>GOAT</option>
                  <option>Nike</option>
                  <option>Adidas</option>
                  <option>Foot Locker</option>
                  <option>Vinted</option>
                  <option>eBay</option>
                  <option>Autre</option>
                </select>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setOpen(false);
                setSelected(null);
                setQuery("");
              }}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selected}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
