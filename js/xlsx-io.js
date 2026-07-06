// Export/import via the vendored SheetJS library, loaded lazily on first use
// rather than on every page load, since the vendored file is ~900KB minified.

let xlsxLoadPromise = null;

function ensureXlsxLoaded() {
  if (window.XLSX) return Promise.resolve();
  if (xlsxLoadPromise) return xlsxLoadPromise;

  xlsxLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "vendor/xlsx.full.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the xlsx library."));
    document.body.appendChild(script);
  });
  return xlsxLoadPromise;
}

async function exportToWorkbook(entries, goals) {
  await ensureXlsxLoaded();
  const workbook = XLSX.utils.book_new();
  const entriesSheet = XLSX.utils.json_to_sheet(entries);
  const goalsSheet = XLSX.utils.json_to_sheet(goals);
  XLSX.utils.book_append_sheet(workbook, entriesSheet, "Entries");
  XLSX.utils.book_append_sheet(workbook, goalsSheet, "Goals");
  XLSX.writeFile(workbook, `proteinpulse-export-${todayStr()}.xlsx`);
}

async function importFromWorkbook(file) {
  await ensureXlsxLoaded();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const entriesSheet = workbook.Sheets["Entries"];
        const goalsSheet = workbook.Sheets["Goals"];
        if (!entriesSheet || !goalsSheet) {
          reject(new Error('File is missing an "Entries" or "Goals" sheet.'));
          return;
        }
        resolve({
          entries: XLSX.utils.sheet_to_json(entriesSheet),
          goals: XLSX.utils.sheet_to_json(goalsSheet),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read the selected file."));
    reader.readAsArrayBuffer(file);
  });
}
