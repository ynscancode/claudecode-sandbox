// Shared step-id constants for the import wizard, so ImportModal.jsx and its
// step sub-components agree on naming without importing each other in a
// circle.
export const STEPS = ['upload', 'columns', 'values', 'review', 'confirm'];

export const STEP_LABELS = {
  upload: 'Upload',
  columns: 'Columns',
  values: 'Values',
  review: 'Review',
  confirm: 'Confirm',
};
