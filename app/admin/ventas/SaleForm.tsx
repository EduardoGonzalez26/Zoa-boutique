"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { registerSaleAction, type SaleActionState } from "./actions";

const SIZES = ["XS", "S", "M", "L", "LOV", "XL"] as const;

const INITIAL_STATE: SaleActionState = { status: "idle" };

const INPUT_CLS =
  "min-h-11 w-full rounded-xs border border-zoa-line-strong bg-transparent px-3 py-2.5 font-sans text-sm text-zoa-slate placeholder:text-zoa-slate-60 transition-colors focus:outline-none focus:border-zoa-slate focus:ring-2 focus:ring-zoa-slate/15";

const LABEL_CLS =
  "mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-zoa-slate-60";

const fmt = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value);

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 bg-zoa-forest px-6 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-zoa-sand"
    >
      {pending && <Loader2 size={14} aria-hidden className="animate-spin" />}
      {pending ? "Registrando…" : "Registrar venta"}
    </button>
  );
}

export default function SaleForm() {
  const [state, formAction] = useActionState(registerSaleAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5 border border-zoa-line p-5 md:p-6">
      <div>
        <label htmlFor="admin-product-id" className={LABEL_CLS}>
          ID de producto (NUM)
        </label>
        <input
          id="admin-product-id"
          name="productId"
          type="text"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej. 42"
          aria-describedby="admin-product-id-hint"
          className={INPUT_CLS}
        />
        <p id="admin-product-id-hint" className="mt-1.5 font-sans text-[11px] text-zoa-slate-60">
          El número de fila del producto en el catálogo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="admin-size" className={LABEL_CLS}>
            Talla
          </label>
          <select
            id="admin-size"
            name="size"
            required
            defaultValue=""
            className={INPUT_CLS}
          >
            <option value="" disabled>
              Selecciona una talla
            </option>
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-quantity" className={LABEL_CLS}>
            Cantidad
          </label>
          <input
            id="admin-quantity"
            name="quantity"
            type="number"
            required
            min={1}
            max={100}
            step={1}
            defaultValue={1}
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="admin-seller-note" className={LABEL_CLS}>
          Nota (opcional)
        </label>
        <textarea
          id="admin-seller-note"
          name="sellerNote"
          rows={3}
          maxLength={500}
          placeholder="Referencia de la venta, nombre de la clienta o comentario interno"
          aria-describedby="admin-seller-note-hint"
          className={`${INPUT_CLS} resize-y`}
        />
        <p id="admin-seller-note-hint" className="mt-1.5 font-sans text-[11px] text-zoa-slate-60">
          Se guarda en la columna de dirección del log. Máximo 500 caracteres.
        </p>
      </div>

      <SubmitButton />

      {state.status !== "idle" && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`border px-4 py-3 font-sans text-xs leading-relaxed ${
            state.status === "error"
              ? "border-zoa-wine text-zoa-wine"
              : "border-zoa-success text-zoa-success"
          }`}
        >
          {state.status === "success" ? (
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 font-medium">
                <CheckCircle2 size={14} aria-hidden />
                {state.message}
              </p>
              <p className="tabular">
                Orden <strong className="font-medium">{state.orderId}</strong> · Total{" "}
                <strong className="font-medium">{state.total !== undefined ? fmt(state.total) : "—"}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 font-medium">
                <AlertTriangle size={14} aria-hidden />
                {state.code}
              </p>
              <p>{state.message}</p>
              {state.orderId && (
                <p className="tabular">
                  Orden <strong className="font-medium">{state.orderId}</strong>
                  {state.total !== undefined ? ` · Total ${fmt(state.total)}` : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
