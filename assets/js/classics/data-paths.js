const CLASSICS_DATA_ROOT = "./data";

function dataPath(fileName) {
  return `${CLASSICS_DATA_ROOT}/${fileName}`;
}

const CLASSICS_DATA_FILES = {
  libraryCatalog: dataPath("library.json"),
  readingPlan: dataPath("bookclub.json"),
  readingGuide: dataPath("greatbooks.csv"),
  glossaryTerms: dataPath("syntopicon_terms.json"),
  glossaryEntries: dataPath("glossary_app.json")
};

export {
  CLASSICS_DATA_FILES,
  CLASSICS_DATA_ROOT,
  dataPath
};
