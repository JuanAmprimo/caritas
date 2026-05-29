export const createListSnapshot = (title, fields, items, reason = "manual") => ({
  title,
  fields: Array.isArray(fields) ? fields : [],
  items: Array.isArray(items) ? items : [],
  savedAt: new Date(),
  reason,
});

const serialize = (value) => JSON.stringify(value || []);

export const hasSameSnapshotContent = (snapshot, title, fields, items) => {
  if (!snapshot) return false;

  return (
    snapshot.title === title &&
    serialize(snapshot.fields) === serialize(fields) &&
    serialize(snapshot.items) === serialize(items)
  );
};
