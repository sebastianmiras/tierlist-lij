import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

const TIERS = [
   { id: "s", label: "S", color: "#f47c7c", stage: "0-2 años", stageName: "Sensoriomotor" },
  { id: "a", label: "A", color: "#f1b978", stage: "3-6 años", stageName: "Preoperacional" },
  { id: "b", label: "B", color: "#e6ec70", stage: "7-8 años", stageName: "Operaciones concretas I" },
  { id: "c", label: "C", color: "#74e56f", stage: "9-11 años", stageName: "Operaciones concretas II" },
];
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwUxacarqL-TZldxc8ZPUAHESbGQAqkvcA8_jLWGjgJ0MHnFiem3lZus-R-isCsZoE/exec";
const BASE = import.meta.env.BASE_URL;
const INITIAL_BOOKS = [
  { id: "cosas-que-vienen-y-van", title: "Cosas que vienen y van", cover: "${BASE}albums/Cosas que vienen y van.png", placedIn: null, justification: "" },
  { id: "el-arbol-generoso", title: "El árbol generoso", cover: "${BASE}albums/El árbol generoso.png", placedIn: null, justification: "" },
  { id: "el-caballero-impetuoso", title: "El caballero impetuoso", cover: "${BASE}albums/El caballero impetuoso.png", placedIn: null, justification: "" },
  { id: "el-cartero-simpatico", title: "El cartero simpático", cover: "${BASE}albums/El cartero simpático.png", placedIn: null, justification: "" },
  { id: "el-libro-de-los-cerdos", title: "El libro de los cerdos", cover: "${BASE}albums/El libro de los cerdos.png", placedIn: null, justification: "" },
  { id: "el-libro-negro-de-los-colores", title: "El libro negro de los colores", cover: "${BASE}albums/El libro negro de los colores.png", placedIn: null, justification: "" },
  { id: "el-poder-de-las-historias", title: "El poder de las historias", cover: "${BASE}albums/El poder de las historias.png", placedIn: null, justification: "" },
  { id: "henri-viaja-a-paris", title: "Henri viaja a París", cover: "${BASE}albums/Henri viaja a París.png", placedIn: null, justification: "" },
  { id: "la-bella-griselda", title: "La bella Griselda", cover: "${BASE}albums/La bella Griselda.png", placedIn: null, justification: "" },
  { id: "la-excursion-del-senor-gumpy", title: "La excursión del señor Gumpy", cover: "${BASE}albums/La excursión del señor Gumpy.png", placedIn: null, justification: "" },
  { id: "la-pelota-amarilla", title: "La pelota amarilla", cover: "${BASE}albums/La pelota amarilla.png", placedIn: null, justification: "" },
  { id: "ser-un-fantasma-es-lo-mejor", title: "Ser un fantasma es lo mejor", cover: "${BASE}albums/Ser un fantasma es lo mejor.png", placedIn: null, justification: "" },
  { id: "toc-toc", title: "Toc, toc", cover: "${BASE}albums/Toc, toc.png", placedIn: null, justification: "" },
  { id: "una-gran-historia-de-vaqueros", title: "Una gran historia de vaqueros", cover: "${BASE}albums/Una gran historia de vaqueros.png", placedIn: null, justification: "" },
  { id: "y-si-nono", title: "Y si NoNo", cover: "${BASE}albums/Y si NoNo.png", placedIn: null, justification: "" },
];

function Modal({ open, children }) {
  if (!open) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [draggedId, setDraggedId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const tierRef = useRef(null);

  const booksByTier = useMemo(() => {
    return TIERS.reduce((acc, tier) => {
      acc[tier.id] = books.filter((book) => book.placedIn === tier.id);
      return acc;
    }, {});
  }, [books]);

  const unplacedBooks = useMemo(() => {
    return books.filter(
      (book) =>
        !book.placedIn &&
        book.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [books, search]);

  const handleDrop = (tierId) => {
    if (!draggedId) return;
    const book = books.find((item) => item.id === draggedId);
    if (!book) return;

    const updated = { ...book, placedIn: tierId };
    setBooks((prev) => prev.map((item) => (item.id === draggedId ? updated : item)));
    setSelectedBook(updated);
    setDraggedId(null);
  };

  const saveBook = () => {
    if (!selectedBook) return;
    setBooks((prev) =>
      prev.map((book) => (book.id === selectedBook.id ? selectedBook : book))
    );
    setSelectedBook(null);
  };

  const resetBoard = () => {
    setBooks(INITIAL_BOOKS);
    setSaveMessage("");
  };

  const finalizeResults = async () => {
    const invalidBooks = books.filter(
      (book) => book.placedIn && !book.justification.trim()
    );

    if (!groupName.trim()) {
      setSaveMessage("Debes indicar el nombre del grupo.");
      return;
    }

    if (invalidBooks.length > 0) {
      setSaveMessage("Todos los álbumes colocados deben tener justificación.");
      return;
    }

    try {
      setSaveMessage("Generando imagen y enviando resultados...");

      const canvas = await html2canvas(tierRef.current, {
        backgroundColor: "#111111",
        useCORS: true,
        scale: 2,
      });

      const imageBase64 = canvas.toDataURL("image/png");

      const payload = {
        group: groupName,
        createdAt: new Date().toISOString(),
        imageBase64,
        placements: books.map((book) => ({
          title: book.title,
          cover: book.cover,
          tier: book.placedIn,
          tierLabel:
            TIERS.find((tier) => tier.id === book.placedIn)?.stage || null,
          justification: book.justification,
        })),
      };

      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.ok) {
        setSaveMessage("Resultados enviados correctamente.");
      } else {
        console.error(result);
        setSaveMessage("Hubo un problema al guardar los resultados.");
      }
    } catch (error) {
      console.error(error);
      setSaveMessage("Error al enviar los resultados.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>1DLCLEI - Tier list de álbumes</h1>
            <p style={styles.subtitle}>
              Arrastra cada cubierta a la etapa correspondiente. Al soltarla, añade una justificación libre.
            </p>
          </div>

          <div style={styles.controls}>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nombre del grupo"
              style={styles.input}
            />
            <button onClick={finalizeResults} style={styles.primaryButton}>
              Finalizar
            </button>
            <button onClick={resetBoard} style={styles.secondaryButton}>
              Reiniciar
            </button>
          </div>
        </div>

        {saveMessage && <div style={styles.message}>{saveMessage}</div>}

        <div style={styles.layout}>
          <div ref={tierRef} style={styles.tierPanel}>
            {TIERS.map((tier) => (
              <div key={tier.id} style={styles.tierRow}>
                <div
                  style={{
                    ...styles.tierLabel,
                    backgroundColor: tier.color,
                  }}
                >
                  {tier.label}
                </div>

                <div
                  style={styles.tierDropzone}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(tier.id)}
                >
                  <div style={styles.tierMeta}>
                    <span style={styles.badge}>{tier.stage} · {tier.stageName}</span>
                    <span style={styles.count}>
                      {booksByTier[tier.id]?.length || 0} álbumes
                    </span>
                  </div>

                  <div style={styles.tierBooks}>
                    {booksByTier[tier.id]?.map((book) => (
                      <div
                        key={book.id}
                        style={styles.smallBookWrap}
                        draggable
                        onDragStart={() => setDraggedId(book.id)}
                      >
                        <button
                          onClick={() => setSelectedBook(book)}
                          style={styles.coverButton}
                        >
                          <img
                            src={book.cover}
                            alt={book.title}
                            style={styles.smallCover}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.rightPanel}>
            <div style={styles.rightTop}>
              <div>
                <h2 style={styles.rightTitle}>Cubiertas</h2>
                <p style={styles.rightSubtitle}>
                  Banco de álbumes para arrastrar a la tier list.
                </p>
              </div>
              <span style={styles.badge}>{unplacedBooks.length}</span>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar álbum"
              style={{ ...styles.input, width: "100%", marginBottom: 16 }}
            />

            <div style={styles.grid}>
              {unplacedBooks.map((book) => (
                <button
                  key={book.id}
                  style={styles.albumCard}
                  draggable
                  onDragStart={() => setDraggedId(book.id)}
                >
                  <img src={book.cover} alt={book.title} style={styles.albumImage} />
                  <div style={styles.albumInfo}>
                    <div style={styles.albumTitle}>{book.title}</div>
                    <div style={styles.albumStatus}>
                      {book.justification ? "Justificación añadida" : "Sin justificar"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!selectedBook}>
        {selectedBook && (
          <>
            <h3 style={{ marginTop: 0 }}>Justificar la ubicación</h3>
            <div style={styles.modalLayout}>
              <div>
                <img
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                  style={styles.modalImage}
                />
                <p style={{ marginBottom: 4, fontWeight: 700 }}>{selectedBook.title}</p>
                <p style={{ marginTop: 0, color: "#aaa", fontSize: 14 }}>
                  Etapa: {TIERS.find((tier) => tier.id === selectedBook.placedIn)?.stage || "Sin asignar"}
                </p>
              </div>

              <div>
                <label style={styles.label}>Justificación libre</label>
                <textarea
                  rows={10}
                  value={selectedBook.justification}
                  onChange={(e) =>
                    setSelectedBook({
                      ...selectedBook,
                      justification: e.target.value,
                    })
                  }
                  placeholder="Escribe aquí por qué sitúas este álbum en esta etapa."
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button onClick={() => setSelectedBook(null)} style={styles.secondaryButton}>
                Cancelar
              </button>
              <button onClick={saveBook} style={styles.primaryButton}>
                Guardar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "white",
  },
  container: {
    maxWidth: "1850px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
  },
  subtitle: {
    marginTop: 8,
    color: "#aaa",
  },
  controls: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  input: {
    background: "#181818",
    border: "1px solid #333",
    color: "white",
    borderRadius: "10px",
    padding: "10px 12px",
    minWidth: "180px",
  },
  primaryButton: {
    background: "white",
    color: "black",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    background: "#181818",
    color: "white",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  message: {
    marginBottom: 16,
    background: "#181818",
    border: "1px solid #333",
    padding: "12px 14px",
    borderRadius: "10px",
    color: "#eee",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "16px",
  },
  tierPanel: {
    background: "#111111",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  tierRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  tierLabel: {
    minHeight: "130px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.4rem",
    fontWeight: 800,
    color: "black",
    border: "6px solid black",
  },
  tierDropzone: {
    minHeight: "130px",
    background: "#151515",
    border: "6px solid black",
    padding: "12px",
  },
  tierMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    gap: "8px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    background: "#222",
    color: "#eee",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
  },
  count: {
    color: "#777",
    fontSize: "12px",
  },
  tierBooks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    minHeight: "74px",
  },
  smallBookWrap: {
    width: "72px",
  },
  coverButton: {
    display: "block",
    width: "100%",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },
  smallCover: {
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #444",
  },
  rightPanel: {
    background: "#111111",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  rightTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },
  rightTitle: {
    margin: 0,
    fontSize: "1.2rem",
  },
  rightSubtitle: {
    marginTop: 6,
    marginBottom: 0,
    color: "#aaa",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
  },
  albumCard: {
    background: "#181818",
    border: "1px solid #333",
    borderRadius: "10px",
    overflow: "hidden",
    textAlign: "left",
    color: "white",
    cursor: "grab",
    padding: 0,
  },
  albumImage: {
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    display: "block",
  },
  albumInfo: {
    padding: "6px",
  },
  albumTitle: {
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: 1.2,
  },
  albumStatus: {
    marginTop: "3px",
    fontSize: "10px",
    color: "#888",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modal: {
    background: "#111111",
    color: "white",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "20px",
    width: "min(900px, 100%)",
  },
  modalLayout: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "20px",
    marginTop: "12px",
  },
  modalImage: {
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    borderRadius: "12px",
    border: "1px solid #444",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#ddd",
    fontSize: "14px",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    background: "#181818",
    border: "1px solid #333",
    color: "white",
    borderRadius: "10px",
    padding: "12px",
    resize: "vertical",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "18px",
  },
};
