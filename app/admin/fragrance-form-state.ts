export type FragranceFormFieldName =
  | "accordNames"
  | "baseNotes"
  | "bottleImage"
  | "fullName"
  | "middleNotes"
  | "moments"
  | "rawText"
  | "seasons"
  | "sizes"
  | "slug"
  | "sourcePage"
  | "status"
  | "summary"
  | "topNotes";

export type FragranceFormState = {
  fieldErrors: Partial<Record<FragranceFormFieldName, string>>;
  formError: string | null;
};

export const emptyFragranceFormState: FragranceFormState = {
  fieldErrors: {},
  formError: null,
};
