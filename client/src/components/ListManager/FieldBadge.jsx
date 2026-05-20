export default function FieldBadge({ field, index, moveField, dragOverIndex, setDragOverIndex, removeField }) {
  const handleDragStart = (event) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    setDragOverIndex(null);
    if (!Number.isNaN(fromIndex)) {
      moveField(fromIndex, index);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`badge p-2 d-flex align-items-center gap-2 ${dragOverIndex === index ? 'drag-over-field' : ''}`}
      style={{ backgroundColor: '#8b5cf6', cursor: 'grab' }}
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
