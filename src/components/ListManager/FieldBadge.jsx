import { Plus } from 'lucide-react';

export default function FieldBadge({ field, removeField }) {
  return (
    <div
      className="badge p-2 d-flex align-items-center gap-2"
      style={{ backgroundColor: '#8b5cf6' }}
    >
      <span>{field.name} ({field.type})</span>
      <button
        className="btn-close btn-close-white"
        style={{ fontSize: '0.7rem' }}
        onClick={() => removeField(field.id)}
        aria-label="Eliminar campo"
      ></button>
    </div>
  );
}
