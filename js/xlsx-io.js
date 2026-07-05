// Export/import via the vendored SheetJS library.

function exportToWorkbook(entries, goals) {
  const workbook = XLSX.utils.book_new();
  const entriesSheet = XLSX.utils.json_to_sheet(entries);
  const goalsSheet = XLSX.utils.json_to_sheet(goals);
  XLSX.utils.book_append_sheet(workbook, entriesSheet, "Entries");
  XLSX.utils.book_append_sheet(workbook, goalsSheet, "Goals");
  XLSX.writeFile(workbook, `proteinpulse-export-${todayStr()}.xlsx`);
}

function importFromWorkbook(file) {
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
