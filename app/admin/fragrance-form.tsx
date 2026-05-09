"use client";

import Image from "next/image";
import {
  Fragment,
  useActionState,
  useDeferredValue,
  useState,
  type ReactNode,
} from "react";

import {
  getDefaultAccordStrength,
  supportedAccordNames,
} from "@/data/men-catalog-details";
import type { CatalogItem } from "@/lib/catalog";

import {
  emptyFragranceFormState,
  type FragranceFormFieldName,
  type FragranceFormState,
} from "./fragrance-form-state";

const textareaClassName =
  "min-h-[9rem] w-full rounded-[1.6rem] border border-[rgba(82,33,117,0.16)] bg-[rgba(255,252,248,0.96)] px-5 py-4 text-sm leading-7 text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_22px_rgba(61,20,95,0.05)]";
const selectClassName =
  "min-h-[3.8rem] w-full rounded-[999px] border border-[rgba(82,33,117,0.16)] bg-[rgba(255,252,248,0.96)] px-5 text-sm text-[var(--color-ink)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_22px_rgba(61,20,95,0.05)]";
const supportedBottleImageAccept = ".png,.jpg,.jpeg,.webp,.avif";
const momentOptions = [
  { label: "Day", value: "day" },
  { label: "Night", value: "night" },
] as const;
const seasonOptions = [
  { label: "Spring", value: "spring" },
  { label: "Summer", value: "summer" },
  { label: "Fall", value: "fall" },
  { label: "Winter", value: "winter" },
] as const;
const MAX_ACCORDS = 10;
const ACCORD_STRENGTH_MIN = 0;
const ACCORD_STRENGTH_MAX = 100;

type AdminCatalogItem = CatalogItem & {
  bottleAsset: {
    kind: "custom" | "pdf";
    src: string;
  };
};

type AdminListState = {
  page: number;
  query: string;
};

type FragranceFormAction = (
  state: FragranceFormState,
  formData: FormData,
) => Promise<FragranceFormState>;

type SelectedAccord = {
  name: string;
  strength: number;
};

export function FragranceForm({
  action,
  deleteAction,
  formId,
  item,
  listState,
  submitLabel,
}: {
  action: FragranceFormAction;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  formId: string;
  item?: AdminCatalogItem;
  listState: AdminListState;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyFragranceFormState,
  );
  const [selectedAccords, setSelectedAccords] = useState(() =>
    getInitialAccords(item),
  );
  const [accordSearch, setAccordSearch] = useState("");
  const deferredAccordSearch = useDeferredValue(accordSearch);
  const filteredAccords = getFilteredAccords(
    selectedAccords,
    deferredAccordSearch,
  );

  return (
    <div className="mt-6 space-y-4">
      <form action={formAction} className="space-y-6" id={formId}>
        <AdminListStateFields listState={listState} />
        {selectedAccords.map((accord) => (
          <Fragment key={accord.name}>
            <input type="hidden" name="accordNames" readOnly value={accord.name} />
            <input
              type="hidden"
              name="accordStrengths"
              readOnly
              value={String(accord.strength)}
            />
          </Fragment>
        ))}

        {state.formError ? (
          <div
            aria-live="polite"
            className="rounded-[1.6rem] border border-[rgba(220,176,103,0.32)] bg-[rgba(220,176,103,0.1)] px-5 py-4 text-sm leading-7 text-[var(--color-plum-900)]"
          >
            {state.formError}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            error={state.fieldErrors.fullName}
            errorId={buildErrorId(formId, "fullName")}
            label="Nombre"
          >
            <div className={getInputShellClassName(Boolean(state.fieldErrors.fullName))}>
              <input
                required
                aria-describedby={buildAriaDescribedBy(
                  formId,
                  "fullName",
                  state.fieldErrors.fullName,
                )}
                aria-invalid={Boolean(state.fieldErrors.fullName)}
                name="fullName"
                type="text"
                defaultValue={item?.fullName ?? ""}
                className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                placeholder="Bleu de Chanel"
              />
            </div>
          </Field>

          <Field
            error={state.fieldErrors.slug}
            errorId={buildErrorId(formId, "slug")}
            label="Slug"
          >
            <div className={getInputShellClassName(Boolean(state.fieldErrors.slug))}>
              <input
                required
                aria-describedby={buildAriaDescribedBy(
                  formId,
                  "slug",
                  state.fieldErrors.slug,
                )}
                aria-invalid={Boolean(state.fieldErrors.slug)}
                name="slug"
                type="text"
                defaultValue={item?.slug ?? ""}
                className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                placeholder="bleu-de-chanel"
              />
            </div>
          </Field>

          <Field
            error={state.fieldErrors.sourcePage}
            errorId={buildErrorId(formId, "sourcePage")}
            label="Orden / Source Page"
          >
            <div
              className={getInputShellClassName(
                Boolean(state.fieldErrors.sourcePage),
              )}
            >
              <input
                required
                min={1}
                aria-describedby={buildAriaDescribedBy(
                  formId,
                  "sourcePage",
                  state.fieldErrors.sourcePage,
                )}
                aria-invalid={Boolean(state.fieldErrors.sourcePage)}
                name="sourcePage"
                type="number"
                defaultValue={item?.sourcePage ?? ""}
                className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                placeholder="1"
              />
            </div>
          </Field>

          <Field
            error={state.fieldErrors.status}
            errorId={buildErrorId(formId, "status")}
            label="Estado"
          >
            <select
              aria-describedby={buildAriaDescribedBy(
                formId,
                "status",
                state.fieldErrors.status,
              )}
              aria-invalid={Boolean(state.fieldErrors.status)}
              name="status"
              defaultValue={item?.status ?? "ACTIVE"}
              className={getSelectClassName(Boolean(state.fieldErrors.status))}
            >
              <option value="ACTIVE">Activo</option>
              <option value="COMING_SOON">Coming soon</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            hint="Texto corto para la descripcion principal del producto."
            label="Resumen"
          >
            <textarea
              name="summary"
              defaultValue={item?.summary ?? ""}
              className={textareaClassName}
              placeholder="Perfil citrico y amaderado con salida limpia..."
            />
          </Field>

          <Field
            hint="Opcional. Util si quieres conservar texto original del catalogo."
            label="Raw Text"
          >
            <textarea
              name="rawText"
              defaultValue={item?.rawText ?? ""}
              className={textareaClassName}
              placeholder="Texto libre del catalogo o referencia interna..."
            />
          </Field>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Field
            error={state.fieldErrors.sizes}
            errorId={buildErrorId(formId, "sizes")}
            hint="Una linea por tamano. Formato: 100|85 o 50|55.5"
            label="Tamanos y precios"
          >
            <textarea
              required
              aria-describedby={buildAriaDescribedBy(
                formId,
                "sizes",
                state.fieldErrors.sizes,
              )}
              aria-invalid={Boolean(state.fieldErrors.sizes)}
              name="sizes"
              defaultValue={formatSizesField(item)}
              className={getTextareaClassName(Boolean(state.fieldErrors.sizes))}
              placeholder={"100|85\n50|55"}
            />
          </Field>

          <Field
            error={state.fieldErrors.bottleImage}
            errorId={buildErrorId(formId, "bottleImage")}
            hint="Sube PNG, JPG, WEBP o AVIF. Maximo 8MB."
            label="Imagen de la botella"
          >
            <div
              className={getGroupClassName(Boolean(state.fieldErrors.bottleImage))}
            >
              {item ? (
                <BottleAssetPreview asset={item.bottleAsset} name={item.fullName} />
              ) : (
                <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
                  Si no subes una imagen, la fragancia usara el recorte del PDF
                  cuando exista.
                </p>
              )}

              <input
                aria-describedby={buildAriaDescribedBy(
                  formId,
                  "bottleImage",
                  state.fieldErrors.bottleImage,
                )}
                aria-invalid={Boolean(state.fieldErrors.bottleImage)}
                name="bottleImage"
                type="file"
                accept={supportedBottleImageAccept}
                className="mt-4 block w-full text-sm text-[var(--color-ink-soft)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-gold)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--color-plum-950)]"
              />

              {item?.bottleAsset.kind === "custom" ? (
                <label className="mt-4 flex items-center gap-3 text-sm text-[var(--color-ink-soft)]">
                  <input
                    name="removeBottleImage"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[rgba(82,33,117,0.24)]"
                  />
                  Quitar la imagen personalizada y volver al fallback.
                </label>
              ) : null}
            </div>
          </Field>
        </div>

        <Field
          error={state.fieldErrors.accordNames}
          errorId={buildErrorId(formId, "accordNames")}
          hint="Busca y selecciona hasta 10 accords. El orden seleccionado define la intensidad visual."
          label="Main Accords"
        >
          <div
            className={getGroupClassName(Boolean(state.fieldErrors.accordNames))}
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-[var(--color-plum-900)]">
                Buscar y tocar para seleccionar
              </p>
              <span className="text-xs leading-6 text-[var(--color-ink-soft)]">
                {selectedAccords.length}/{MAX_ACCORDS} seleccionados
              </span>
            </div>

            <div className="mt-4">
              <div className="input-shell">
                <input
                  type="search"
                  value={accordSearch}
                  onChange={(event) => setAccordSearch(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
                  placeholder="Buscar accord, por ejemplo woody o citrus"
                />
              </div>

              <div className="mt-4 max-h-[24rem] overflow-y-auto rounded-[1.3rem] border border-[rgba(82,33,117,0.08)] bg-[rgba(255,255,255,0.56)] p-3">
                {filteredAccords.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAccords.map((accord) => {
                      const selectedAccord = selectedAccords.find(
                        (currentAccord) => currentAccord.name === accord,
                      );
                      const isSelected = Boolean(selectedAccord);
                      const hasReachedLimit =
                        !isSelected && selectedAccords.length >= MAX_ACCORDS;

                      return (
                        <button
                          key={accord}
                          type="button"
                          disabled={hasReachedLimit}
                          onClick={() => {
                            setSelectedAccords((currentAccords) => {
                              if (
                                currentAccords.some(
                                  (currentAccord) => currentAccord.name === accord,
                                )
                              ) {
                                return currentAccords.filter(
                                  (currentAccord) => currentAccord.name !== accord,
                                );
                              }

                              if (currentAccords.length >= MAX_ACCORDS) {
                                return currentAccords;
                              }

                              return [
                                ...currentAccords,
                                {
                                  name: accord,
                                  strength: getDefaultAccordStrength(
                                    currentAccords.length,
                                  ),
                                },
                              ];
                            });
                          }}
                          className={`rounded-[1.3rem] border px-4 py-3 text-left text-sm transition ${
                            isSelected
                              ? "border-[var(--color-gold)] bg-[rgba(220,176,103,0.16)] text-[var(--color-plum-900)]"
                              : "border-[rgba(82,33,117,0.12)] bg-white text-[var(--color-ink)] hover:-translate-y-0.5 hover:border-[rgba(220,176,103,0.58)]"
                          } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0`}
                        >
                          <span className="block font-semibold capitalize">
                            {accord}
                          </span>
                          <span className="mt-1 block text-xs leading-6 text-[var(--color-ink-soft)]">
                            {isSelected
                              ? `Seleccionado #${
                                  selectedAccords.findIndex(
                                    (currentAccord) => currentAccord.name === accord,
                                  ) + 1
                                }`
                              : hasReachedLimit
                                ? "Limite de 10 accords alcanzado"
                                : "Toca para seleccionar"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-[var(--color-ink-soft)]">
                    No encontramos accords con esa busqueda.
                  </p>
                )}
              </div>
            </div>

            {selectedAccords.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedAccords.map((accord, index) => (
                  <div
                    key={accord.name}
                    className="flex flex-col gap-3 rounded-[1.3rem] border border-[rgba(82,33,117,0.12)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-plum-900)]">
                        {index + 1}. {accord.name}
                      </p>
                      <p className="text-xs leading-6 text-[var(--color-ink-soft)]">
                        Este porcentaje controla la barra en la vista detalle.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
                        <span>%</span>
                        <input
                          type="number"
                          min={ACCORD_STRENGTH_MIN}
                          max={ACCORD_STRENGTH_MAX}
                          value={accord.strength}
                          onChange={(event) => {
                            setSelectedAccords((currentAccords) =>
                              currentAccords.map((currentAccord) =>
                                currentAccord.name === accord.name
                                  ? {
                                      ...currentAccord,
                                      strength: clampAccordStrength(
                                        event.target.value,
                                      ),
                                    }
                                  : currentAccord,
                              ),
                            );
                          }}
                          className="h-11 w-24 rounded-full border border-[rgba(82,33,117,0.16)] bg-[rgba(255,252,248,0.96)] px-4 text-sm text-[var(--color-ink)] outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccords((currentAccords) =>
                            currentAccords.filter(
                              (currentAccord) => currentAccord.name !== accord.name,
                            ),
                          );
                        }}
                        className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-[rgba(82,33,117,0.14)] bg-white px-3 py-2 text-sm text-[var(--color-plum-900)] transition hover:border-red-200 hover:text-red-700"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[var(--color-ink-soft)]">
                No hay accords seleccionados todavia.
              </p>
            )}
          </div>
        </Field>

        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            error={state.fieldErrors.moments}
            errorId={buildErrorId(formId, "moments")}
            hint="Selecciona cuando funciona mejor la fragancia."
            label="Momentos"
          >
            <div
              className={`${getGroupClassName(
                Boolean(state.fieldErrors.moments),
              )} flex flex-wrap gap-3`}
            >
              {momentOptions.map((option) => (
                <label
                  key={option.value}
                  className="detail-chip cursor-pointer gap-2.5 bg-white"
                >
                  <input
                    aria-describedby={buildAriaDescribedBy(
                      formId,
                      "moments",
                      state.fieldErrors.moments,
                    )}
                    aria-invalid={Boolean(state.fieldErrors.moments)}
                    name="moments"
                    type="checkbox"
                    value={option.value}
                    defaultChecked={item?.moments.includes(option.value) ?? false}
                    className="h-4 w-4 rounded border-[rgba(82,33,117,0.24)]"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field
            error={state.fieldErrors.seasons}
            errorId={buildErrorId(formId, "seasons")}
            hint="Selecciona las estaciones recomendadas."
            label="Temporadas"
          >
            <div
              className={`${getGroupClassName(
                Boolean(state.fieldErrors.seasons),
              )} flex flex-wrap gap-3`}
            >
              {seasonOptions.map((option) => (
                <label
                  key={option.value}
                  className="detail-chip cursor-pointer gap-2.5 bg-white"
                >
                  <input
                    aria-describedby={buildAriaDescribedBy(
                      formId,
                      "seasons",
                      state.fieldErrors.seasons,
                    )}
                    aria-invalid={Boolean(state.fieldErrors.seasons)}
                    name="seasons"
                    type="checkbox"
                    value={option.value}
                    defaultChecked={item?.seasons.includes(option.value) ?? false}
                    className="h-4 w-4 rounded border-[rgba(82,33,117,0.24)]"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Field hint="Una linea por nota." label="Top Notes">
            <textarea
              name="topNotes"
              defaultValue={formatNotesField(item?.notes.top)}
              className={textareaClassName}
              placeholder={"Lemon\nMint\nPink Pepper"}
            />
          </Field>

          <Field hint="Una linea por nota." label="Middle Notes">
            <textarea
              name="middleNotes"
              defaultValue={formatNotesField(item?.notes.middle)}
              className={textareaClassName}
              placeholder={"Ginger\nJasmine\nNutmeg"}
            />
          </Field>

          <Field hint="Una linea por nota." label="Base Notes">
            <textarea
              name="baseNotes"
              defaultValue={formatNotesField(item?.notes.base)}
              className={textareaClassName}
              placeholder={"Incense\nCedar\nSandalwood"}
            />
          </Field>
        </div>

        <div className="border-t border-[rgba(82,33,117,0.08)] pt-5">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-[3.35rem] items-center justify-center rounded-full bg-[var(--color-gold)] px-6 py-3 text-sm font-semibold text-[var(--color-plum-950)] shadow-[0_12px_30px_rgba(20,6,33,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--color-gold-soft)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {pending ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>

      {deleteAction ? (
        <div className="flex justify-start">
          <form
            action={deleteAction}
            onSubmit={(event) => {
              const confirmed = window.confirm(
                "Are you sure you want to delete this fragrance?",
              );

              if (!confirmed) {
                event.preventDefault();
              }
            }}
          >
            <AdminListStateFields listState={listState} />
            <button
              type="submit"
              className="inline-flex min-h-[3.2rem] items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100"
            >
              Eliminar fragancia
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function AdminListStateFields({ listState }: { listState: AdminListState }) {
  return (
    <>
      {listState.query ? (
        <input type="hidden" name="redirectQuery" value={listState.query} />
      ) : null}
      {listState.page > 1 ? (
        <input
          type="hidden"
          name="redirectPage"
          value={String(listState.page)}
        />
      ) : null}
    </>
  );
}

function BottleAssetPreview({
  asset,
  name,
}: {
  asset: AdminCatalogItem["bottleAsset"];
  name: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.35rem] border border-[rgba(82,33,117,0.08)] bg-white/70 p-3">
      <div className="relative h-24 w-20 overflow-hidden rounded-[1.1rem] border border-[rgba(82,33,117,0.08)] bg-[rgba(247,240,231,0.72)]">
        <Image
          src={asset.src}
          alt={`Imagen actual de ${name}`}
          fill
          unoptimized
          className="object-contain p-2"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-plum-900)]">
          {asset.kind === "custom"
            ? "Imagen personalizada activa"
            : "Fallback del PDF"}
        </p>
        <p className="text-xs leading-6 text-[var(--color-ink-soft)]">
          {asset.src}
        </p>
      </div>
    </div>
  );
}

function Field({
  children,
  error,
  errorId,
  hint,
  label,
}: {
  children: ReactNode;
  error?: string;
  errorId?: string;
  hint?: string;
  label: string;
}) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--color-plum-900)]">
        {label}
      </span>
      {children}
      {error && errorId ? (
        <span
          id={errorId}
          aria-live="polite"
          className="mt-2 block text-xs leading-6 text-red-700"
        >
          {error}
        </span>
      ) : null}
      {hint ? (
        <span className="mt-2 block text-xs leading-6 text-[var(--color-ink-soft)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function buildAriaDescribedBy(
  formId: string,
  fieldName: FragranceFormFieldName,
  error?: string,
) {
  return error ? buildErrorId(formId, fieldName) : undefined;
}

function buildErrorId(formId: string, fieldName: FragranceFormFieldName) {
  return `${formId}-${fieldName}-error`;
}

function getGroupClassName(hasError: boolean) {
  return `rounded-[1.6rem] border bg-[rgba(255,252,248,0.7)] p-4 ${
    hasError
      ? "border-red-300 bg-red-50/70"
      : "border-[rgba(82,33,117,0.1)]"
  }`;
}

function getInputShellClassName(hasError: boolean) {
  return hasError ? "input-shell ring-1 ring-red-300" : "input-shell";
}

function getSelectClassName(hasError: boolean) {
  return `${selectClassName} ${
    hasError ? "border-red-300 bg-red-50/60" : ""
  }`;
}

function getTextareaClassName(hasError: boolean) {
  return `${textareaClassName} ${
    hasError ? "border-red-300 bg-red-50/60" : ""
  }`;
}

function formatNotesField(notes: string[] | undefined) {
  return notes?.join("\n") ?? "";
}

function formatSizesField(item: CatalogItem | undefined) {
  return (
    item?.sizes
      .map((size) => `${size.sizeMl}|${size.price.toFixed(2)}`)
      .join("\n") ?? ""
  );
}

function getInitialAccords(item: CatalogItem | undefined): SelectedAccord[] {
  if (!item) {
    return [];
  }

  return item.accords.map((accord, index) => ({
    name: accord.name,
    strength: normalizeAccordStrengthValue(
      accord.strength,
      getDefaultAccordStrength(index),
    ),
  }));
}

function getFilteredAccords(selectedAccords: SelectedAccord[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  const orderedAccords = [
    ...selectedAccords.map((accord) => accord.name),
    ...supportedAccordNames.filter(
      (accord) =>
        !selectedAccords.some(
          (selectedAccord) => selectedAccord.name === accord,
        ),
    ),
  ];

  return orderedAccords.filter((accord) =>
    normalizedSearch ? accord.includes(normalizedSearch) : true,
  );
}

function clampAccordStrength(value: string) {
  const parsedValue = Number.parseInt(value, 10);

  return normalizeAccordStrengthValue(parsedValue, ACCORD_STRENGTH_MIN);
}

function normalizeAccordStrengthValue(value: number, fallback: number) {
  if (!Number.isInteger(value)) {
    return fallback;
  }

  return Math.max(
    ACCORD_STRENGTH_MIN,
    Math.min(ACCORD_STRENGTH_MAX, value),
  );
}
