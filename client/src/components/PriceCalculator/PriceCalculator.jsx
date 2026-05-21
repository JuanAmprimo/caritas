import { useCallback, useState, useEffect, useRef } from "react";
import { Container, Card } from "react-bootstrap";
import { apiFetch } from "../../utils/auth.js";
import DonationForm from "./DonationForm";
import DonationTable from "./DonationTable";

const DRAFT_DONATIONS_KEY = "caritas_autosaved_donations";
const DEFAULT_FORM_DATA = {
  name: "",
  price: "",
  quantity: 1,
  description: "",
  image: "",
  size: "",
};

const getDonationKey = (donation) => donation?._id || donation?.id || "";

const hasFormDraft = (data) =>
  Boolean(
    data?.name ||
      data?.price ||
      data?.description ||
      data?.image ||
      data?.size ||
      (data?.quantity && Number(data.quantity) !== 1),
  );

const getScopedStorageKey = () => {
  const userId = localStorage.getItem("userId") || "anonymous";
  return `${DRAFT_DONATIONS_KEY}:${userId}`;
};

const normalizeFormData = (data) => {
  const rawPrice = data.price;
  const rawQuantity = data.quantity;
  const price = Number(rawPrice);
  const quantity = Number.parseInt(rawQuantity, 10);

  return {
    name: String(data.name || "").trim(),
    price: Number.isFinite(price) ? price : 0,
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    description: String(data.description || "").trim(),
    image: String(data.image || "").trim(),
    size: String(data.size || "").trim(),
  };
};

const mergeDonations = (serverDonations, localDonations, deletedDonationIds, dirtyDonationIds) => {
  const deletedIds = new Set(deletedDonationIds);
  const dirtyIds = new Set(dirtyDonationIds);
  const merged = new Map();

  serverDonations
    .filter((donation) => !deletedIds.has(donation._id))
    .forEach((donation) => merged.set(getDonationKey(donation), donation));

  localDonations.forEach((donation) => {
    const key = getDonationKey(donation);
    if (!key) return;

    if (!donation._id || dirtyIds.has(donation._id)) {
      merged.set(key, donation);
    }
  });

  return Array.from(merged.values());
};

const readDonationDraft = (storageKey) => {
  const scopedDraft = localStorage.getItem(storageKey);
  const legacyDraft = localStorage.getItem(DRAFT_DONATIONS_KEY);
  const raw = scopedDraft || legacyDraft;

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (!scopedDraft && legacyDraft) {
      localStorage.removeItem(DRAFT_DONATIONS_KEY);
    }

    if (Array.isArray(parsed)) {
      return {
        donations: parsed,
        formData: DEFAULT_FORM_DATA,
        editingId: null,
        dirtyDonationIds: [],
        deletedDonationIds: [],
      };
    }

    return {
      donations: Array.isArray(parsed.donations) ? parsed.donations : [],
      formData: { ...DEFAULT_FORM_DATA, ...(parsed.formData || {}) },
      editingId: parsed.editingId || null,
      dirtyDonationIds: Array.isArray(parsed.dirtyDonationIds) ? parsed.dirtyDonationIds : [],
      deletedDonationIds: Array.isArray(parsed.deletedDonationIds)
        ? parsed.deletedDonationIds
        : [],
    };
  } catch (err) {
    console.error("Error parseando borrador de donaciones:", err);
    return null;
  }
};

const hasDonationDraft = (draft) =>
  Boolean(
    draft &&
      (draft.donations.length > 0 ||
        hasFormDraft(draft.formData) ||
        draft.editingId ||
        draft.dirtyDonationIds.length > 0 ||
        draft.deletedDonationIds.length > 0),
  );

export default function PriceCalculator({ searchTerm }) {
  const [draftStorageKey] = useState(() => getScopedStorageKey());
  const [initialDraft] = useState(() => readDonationDraft(draftStorageKey));
  const initialHasDraft = hasDonationDraft(initialDraft);
  const syncInProgress = useRef(false);

  const [donations, setDonations] = useState(() =>
    initialHasDraft ? initialDraft.donations : [],
  );
  const [formData, setFormData] = useState(() =>
    initialHasDraft ? initialDraft.formData : DEFAULT_FORM_DATA,
  );
  const [editingId, setEditingId] = useState(() =>
    initialHasDraft ? initialDraft.editingId : null,
  );
  const [dirtyDonationIds, setDirtyDonationIds] = useState(() =>
    initialHasDraft ? initialDraft.dirtyDonationIds : [],
  );
  const [deletedDonationIds, setDeletedDonationIds] = useState(() =>
    initialHasDraft ? initialDraft.deletedDonationIds : [],
  );

  const persistDraft = useCallback((draft) => {
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          ...draft,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (err) {
      console.error("Error guardando borrador de donaciones:", err);
    }
  }, [draftStorageKey]);

  const addDirtyDonation = useCallback((id) => {
    if (!id) return;
    setDirtyDonationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeDirtyDonation = useCallback((id) => {
    if (!id) return;
    setDirtyDonationIds((prev) => prev.filter((dirtyId) => dirtyId !== id));
  }, []);

  const addDeletedDonation = useCallback((id) => {
    if (!id) return;
    setDeletedDonationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setDirtyDonationIds((prev) => prev.filter((dirtyId) => dirtyId !== id));
  }, []);

  const removeDeletedDonation = useCallback((id) => {
    if (!id) return;
    setDeletedDonationIds((prev) => prev.filter((deletedId) => deletedId !== id));
  }, []);

  const syncDrafts = useCallback(async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    try {
      const access = localStorage.getItem("accessToken");
      if (!access) return;

      for (const id of deletedDonationIds) {
        try {
          const res = await apiFetch(`/.netlify/functions/deleteDonation/${id}`, {
            method: "DELETE",
          });
          if (res?.ok) removeDeletedDonation(id);
        } catch (err) {
          console.error("Error al sincronizar eliminacion de donacion:", err);
        }
      }

      for (const donation of donations) {
        if (!donation._id) continue;
        if (!dirtyDonationIds.includes(donation._id)) continue;
        if (deletedDonationIds.includes(donation._id)) continue;

        try {
          const res = await apiFetch(`/.netlify/functions/updateDonation/${donation._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizeFormData(donation)),
          });

          if (res?.ok) {
            const updated = await res.json();
            setDonations((prev) =>
              prev.map((item) => (item._id === donation._id ? updated : item)),
            );
            removeDirtyDonation(donation._id);
          }
        } catch (err) {
          console.error("Error al sincronizar donacion:", err);
        }
      }

      for (const donation of donations) {
        if (donation._id) continue;

        try {
          const res = await apiFetch(`/.netlify/functions/createDonation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizeFormData(donation)),
          });

          if (res?.ok) {
            const created = await res.json();
            const localKey = getDonationKey(donation);
            setDonations((prev) =>
              prev.map((item) => (getDonationKey(item) === localKey ? created : item)),
            );
          }
        } catch (err) {
          console.error("Error al sincronizar donacion local:", err);
        }
      }
    } catch (err) {
      console.error("Error en syncDrafts:", err);
    } finally {
      syncInProgress.current = false;
    }
  }, [deletedDonationIds, dirtyDonationIds, donations, removeDeletedDonation, removeDirtyDonation]);

  useEffect(() => {
    let cancelled = false;

    const fetchDonations = async () => {
      try {
        const res = await apiFetch(`/.netlify/functions/getDonations`, { method: "GET" });
        if (!res || !res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data) || cancelled) return;

        setDonations((prev) =>
          initialHasDraft
            ? mergeDonations(
                data,
                prev,
                initialDraft?.deletedDonationIds || [],
                initialDraft?.dirtyDonationIds || [],
              )
            : data,
        );
      } catch (err) {
        console.error("Error al traer donaciones:", err);
      }
    };

    fetchDonations();

    return () => {
      cancelled = true;
    };
  }, [initialDraft, initialHasDraft]);

  useEffect(() => {
    persistDraft({
      donations,
      formData,
      editingId,
      dirtyDonationIds,
      deletedDonationIds,
    });
  }, [donations, formData, editingId, dirtyDonationIds, deletedDonationIds, persistDraft]);

  useEffect(() => {
    const saveBeforeLeaving = () => {
      persistDraft({
        donations,
        formData,
        editingId,
        dirtyDonationIds,
        deletedDonationIds,
      });
    };

    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => {
      saveBeforeLeaving();
      window.removeEventListener("pagehide", saveBeforeLeaving);
    };
  }, [donations, formData, editingId, dirtyDonationIds, deletedDonationIds, persistDraft]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncDrafts();
    }, 0);

    return () => clearTimeout(timer);
  }, [syncDrafts]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") syncDrafts();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [syncDrafts]);

  const handleInputChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const addOrUpdateDonation = async () => {
    const payload = normalizeFormData(formData);
    const rawPrice = Number(formData.price);

    if (!payload.name || formData.price === "" || formData.price === null || !Number.isFinite(rawPrice)) {
      alert("Por favor completa el nombre y precio");
      return;
    }

    if (editingId) {
      const original = donations.find((donation) => getDonationKey(donation) === editingId);
      const localUpdated = {
        ...(original || {}),
        ...payload,
        id: original?.id || editingId,
      };

      setDonations((prev) =>
        prev.map((donation) =>
          getDonationKey(donation) === editingId ? localUpdated : donation,
        ),
      );

      if (original?._id) addDirtyDonation(original._id);
      resetForm();

      if (!original?._id) return;

      try {
        const res = await apiFetch(`/.netlify/functions/updateDonation/${original._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res?.ok) {
          const updated = await res.json();
          setDonations((prev) =>
            prev.map((donation) => (donation._id === original._id ? updated : donation)),
          );
          removeDirtyDonation(original._id);
        }
      } catch (err) {
        console.error("Error al guardar donacion:", err);
      }

      return;
    }

    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const localDonation = { ...payload, id: localId };
    setDonations((prev) => [...prev, localDonation]);
    resetForm();

    try {
      const res = await apiFetch(`/.netlify/functions/createDonation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res?.ok) {
        const created = await res.json();
        setDonations((prev) =>
          prev.map((donation) => (donation.id === localId ? created : donation)),
        );
      }
    } catch (err) {
      console.error("Error al guardar donacion:", err);
    }
  };

  const editDonation = (donation) => {
    setFormData({ ...DEFAULT_FORM_DATA, ...donation });
    setEditingId(getDonationKey(donation));
  };

  const deleteDonation = async (id) => {
    const donation = donations.find((item) => getDonationKey(item) === id);
    setDonations((prev) => prev.filter((item) => getDonationKey(item) !== id));

    if (!donation?._id) return;

    addDeletedDonation(donation._id);

    try {
      const res = await apiFetch(`/.netlify/functions/deleteDonation/${donation._id}`, {
        method: "DELETE",
      });

      if (res?.ok) removeDeletedDonation(donation._id);
    } catch (err) {
      console.error("Error al eliminar donacion:", err);
    }
  };

  const updateQuantity = (id, quantity) => {
    const numericQuantity = Number.parseInt(quantity, 10);
    const safeQuantity = Number.isInteger(numericQuantity) && numericQuantity > 0
      ? numericQuantity
      : 1;
    const donation = donations.find((item) => getDonationKey(item) === id);

    if (donation?._id) addDirtyDonation(donation._id);

    setDonations((prev) =>
      prev.map((item) =>
        getDonationKey(item) === id ? { ...item, quantity: safeQuantity } : item,
      ),
    );
  };

  const calculateTotal = () =>
    donations.reduce((sum, d) => sum + Number(d.price || 0) * Number(d.quantity || 0), 0);
  const calculateSubtotal = (d) => Number(d.price || 0) * Number(d.quantity || 0);

  const cancelEdit = () => {
    resetForm();
  };

  const filteredDonations = donations.filter((d) =>
    Object.values(d).some((val) =>
      String(val || "")
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase()),
    ),
  );

  return (
    <Container fluid className="py-4">
      {/* Formulario */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Header
          style={{ backgroundColor: "#10b981" }}
          className="text-white"
        >
          <h4 className="mb-0">💰 Calculadora de Precios de Donaciones</h4>
        </Card.Header>
        <Card.Body>
          <h5>{editingId ? "Modificar Donación" : "Nueva Donación"}</h5>
          <DonationForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleImageUpload={handleImageUpload}
            addOrUpdateDonation={addOrUpdateDonation}
            cancelEdit={cancelEdit}
            editingId={editingId}
          />
        </Card.Body>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm border-0">
        <Card.Header
          style={{ backgroundColor: "#6366f1" }}
          className="text-white"
        >
          <h4 className="mb-0">🛒 Lista de Donaciones y Cálculo Final</h4>
        </Card.Header>
        <Card.Body>
          {filteredDonations.length === 0 ? (
            <p className="text-muted">
              No hay donaciones que coincidan con la búsqueda.
            </p>
          ) : (
            <div
              style={{
                maxHeight: filteredDonations.length > 3 ? "300px" : "none",
                overflowY: filteredDonations.length > 3 ? "auto" : "visible",
                border:
                  filteredDonations.length > 3 ? "1px solid #ccc" : "none",
                padding: filteredDonations.length > 3 ? "10px" : "0",
              }}
            >
              <DonationTable
                donations={filteredDonations}
                updateQuantity={updateQuantity}
                calculateSubtotal={calculateSubtotal}
                calculateTotal={calculateTotal}
                editDonation={editDonation}
                deleteDonation={deleteDonation}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
