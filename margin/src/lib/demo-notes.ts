import { courseModules } from "./demo-data"

// ponytail: demo library data. Becomes `topics`, `notes`, `stars`, `note_views` tables (docs/BACKEND_PLAN.md).
// Every note is a real open lecture-notes PDF from MIT OpenCourseWare (CC BY-NC-SA 4.0: 6.867, 6.034, 6.824, 6.006)
// in public/notes/. Uploader names, stars, views and lecturer names are FICTIONAL.
export type DemoNote = {
  id: string
  module_code: string
  topic: string
  title: string
  author: string
  kind: "PDF" | "Notes"
  pages: number
  stars: number
  views: number
  updated: string // ISO date
  file?: string
  owner?: string // email of the student who uploaded it (uploaded notes only)
  version?: number
  lecturer: string // who taught the module when these notes were made
  year: string // academic year, e.g. "2025/26"
}

// `lecturers[0]` teaches it this year; the rest taught it in earlier years.
export type ModuleMeta = { trimester: string; lecturers: string[]; topics: string[]; source?: string }
export const YEARS = ["2026/27", "2025/26", "2024/25"] // academic years, newest first

export const moduleMeta: Record<string, ModuleMeta> = {
  COMP30760: {
    trimester: "Autumn trimester", lecturers: ["Dr. Aisling Byrne", "Dr. Mark Hennessy", "Dr. Fiona Gallagher"], source: "MIT OCW 6.867 Machine Learning (Fall 2006)",
    topics: ["Neural networks", "Linear models", "Overfitting & generalisation", "Kernels & SVMs", "Clustering", "Exam prep"],
  },
  COMP30220: {
    trimester: "Autumn trimester", lecturers: ["Prof. Ciarán Walsh", "Dr. Tom Brennan"], source: "MIT OCW 6.824 Distributed Systems (Spring 2006)",
    topics: ["Foundations", "Fault tolerance", "Consensus & replication", "Caching & consistency"],
  },
  COMP20230: {
    trimester: "Spring trimester", lecturers: ["Dr. Niamh O'Connor", "Dr. Kevin Daly"], source: "MIT OCW 6.006 Introduction to Algorithms (Spring 2020)",
    topics: ["Data structures", "Sorting", "Hashing", "Trees & heaps", "Graphs", "Dynamic programming"],
  },
  COMP10010: { trimester: "Autumn trimester", lecturers: ["Dr. Sinéad Kelly"], topics: ["Basics"] },
  FIN20030: { trimester: "Spring trimester", lecturers: ["Dr. Patrick Doyle"], topics: ["Valuation"] },
  ACC10010: { trimester: "Autumn trimester", lecturers: ["Dr. Orla Murphy"], topics: ["Statements"] },
  LAW10010: { trimester: "Autumn trimester", lecturers: ["Prof. Declan Ryan"], topics: ["Rights"] },
  ECON10010: { trimester: "Autumn trimester", lecturers: ["Dr. Gráinne Nolan"], topics: ["Markets"] },
}

let seq = 0
// ponytail: lecturer and year spread independently across notes so both filters have something to show.
const n = (module_code: string, topic: string, title: string, author: string, kind: DemoNote["kind"], pages: number,
  stars: number, views: number, updated: string, file?: string): DemoNote => {
  const i = ++seq, lecturers = moduleMeta[module_code]?.lecturers ?? ["Unknown"]
  return { id: `n${i}`, module_code, topic, title, author, kind, pages, stars, views, updated,
    file: file && `/notes/${module_code}/${file}`, lecturer: lecturers[i % lecturers.length], year: YEARS[Math.floor(i / 2) % YEARS.length] }
}

const ML = "COMP30760", DS = "COMP30220", ALG = "COMP20230"
const PEOPLE = ["aoife.m", "cian.d", "niamh.k", "luke.b", "sarah.o", "eoin.r", "grace.l", "jack.c", "mia.b", "rory.h"]
// [module, topic, title, file, pages, stars, views, updated] — every note is a real PDF in public/notes/<module>/.
const rows: [string, string, string, string, number, number, number, string][] = [
  [ML, "Neural networks", "Neural nets (6.034 notes)", "neural-networks.pdf", 26, 212, 260, "2026-09-28"],
  [ML, "Neural networks", "Lecture 1: Linear classification and the perceptron", "perceptron.pdf", 5, 140, 180, "2026-09-10"],
  [ML, "Neural networks", "Lecture 2: Perceptron, convergence and generalization", "perceptron-convergence.pdf", 5, 66, 120, "2026-09-12"],
  [ML, "Linear models", "Lecture 5: Linear regression, active learning", "linear-regression.pdf", 10, 88, 115, "2026-09-16"],
  [ML, "Overfitting & generalisation", "Lecture 4: The SVM and regularization", "regularisation.pdf", 7, 73, 95, "2026-09-20"],
  [ML, "Overfitting & generalisation", "Lecture 9: Kernel optimization and model selection", "model-selection.pdf", 7, 58, 80, "2026-09-22"],
  [ML, "Overfitting & generalisation", "Lecture 10: Model selection criteria", "model-selection-criteria.pdf", 8, 34, 61, "2026-09-24"],
  [ML, "Overfitting & generalisation", "Lecture 12: Feature subset selection", "feature-selection.pdf", 9, 46, 70, "2026-10-01"],
  [ML, "Kernels & SVMs", "Lecture 3: The Support Vector Machine", "support-vector-machines.pdf", 6, 97, 130, "2026-09-14"],
  [ML, "Kernels & SVMs", "Lecture 6: Active learning, non-linear predictions, kernels", "kernels-intro.pdf", 7, 44, 50, "2026-10-03"],
  [ML, "Kernels & SVMs", "Lecture 7: Kernel form of linear regression", "kernel-regression.pdf", 8, 29, 47, "2026-10-04"],
  [ML, "Kernels & SVMs", "Lecture 8: Support vector machine and kernels", "svms-and-kernels.pdf", 5, 51, 77, "2026-09-25"],
  [ML, "Clustering", "Lecture 15: Mixture models and the EM algorithm", "mixtures-and-em.pdf", 8, 39, 66, "2026-10-05"],
  [ML, "Clustering", "Lecture 17: Mixture models and clustering, k-means", "clustering.pdf", 8, 47, 66, "2026-09-27"],
  [ML, "Exam prep", "Mid-term exam, October 2004 (solutions)", "exam-midterm-f04-solutions.pdf", 11, 154, 300, "2026-04-20"],
  [ML, "Exam prep", "Final exam, December 2004 (solutions)", "exam-final-f04-solutions.pdf", 10, 131, 280, "2026-04-22"],
  [ML, "Exam prep", "Mid-term exam, October 2003 (solutions)", "exam-midterm-f03-solutions.pdf", 10, 82, 190, "2026-04-18"],
  [ML, "Exam prep", "Final exam, December 2003 (solutions)", "exam-final-f03-solutions.pdf", 10, 77, 170, "2026-04-19"],
  [ML, "Exam prep", "Mid-term exam, October 2002 (solutions)", "exam-midterm-f02-solutions.pdf", 14, 41, 120, "2026-04-15"],
  [ML, "Exam prep", "Final exam, December 2002 (solutions)", "exam-final-f02-solutions.pdf", 11, 38, 110, "2026-04-16"],
  [DS, "Foundations", "Lecture 1: Introduction and O/S review", "introduction.pdf", 5, 39, 60, "2026-09-09"],
  [DS, "Foundations", "Lecture 2: I/O concurrency", "concurrency.pdf", 4, 33, 52, "2026-09-11"],
  [DS, "Foundations", "Lecture 5: RPC transparency", "rpc.pdf", 4, 48, 70, "2026-09-15"],
  [DS, "Fault tolerance", "Lecture 6: Crash recovery for disk file systems", "crash-recovery.pdf", 4, 36, 58, "2026-09-18"],
  [DS, "Fault tolerance", "Lecture 7: Logging", "logging.pdf", 4, 52, 90, "2026-09-21"],
  [DS, "Consensus & replication", "Lecture 13: Two-phase commit", "two-phase-commit.pdf", 3, 57, 88, "2026-09-26"],
  [DS, "Consensus & replication", "Lecture 14: Paxos", "paxos.pdf", 4, 61, 85, "2026-09-29"],
  [DS, "Consensus & replication", "Lecture 15: Viewstamped replication", "viewstamped-replication.pdf", 4, 27, 44, "2026-10-02"],
  [DS, "Caching & consistency", "Lecture 8: Cache consistency and locking", "cache-consistency.pdf", 3, 31, 49, "2026-09-23"],
  [DS, "Caching & consistency", "Lecture 12: Vector timestamps", "vector-timestamps.pdf", 3, 44, 63, "2026-09-30"],
  [DS, "Caching & consistency", "Case study: the Network File System (NFS)", "nfs.pdf", 3, 19, 37, "2026-10-06"],
  [ALG, "Data structures", "Lecture 2: Data structures", "data-structures.pdf", 5, 31, 45, "2026-02-03"],
  [ALG, "Sorting", "Lecture 3: Sorting", "sorting.pdf", 6, 48, 66, "2026-02-10"],
  [ALG, "Sorting", "Lecture 5: Linear sorting", "linear-sorting.pdf", 5, 22, 40, "2026-02-17"],
  [ALG, "Hashing", "Lecture 4: Hashing", "hashing.pdf", 5, 40, 52, "2026-02-12"],
  [ALG, "Trees & heaps", "Lecture 6: Binary trees I", "binary-trees.pdf", 6, 36, 50, "2026-02-24"],
  [ALG, "Trees & heaps", "Lecture 7: Binary trees II: AVL", "avl-trees.pdf", 6, 27, 44, "2026-03-02"],
  [ALG, "Trees & heaps", "Lecture 8: Binary heaps", "binary-heaps.pdf", 7, 24, 39, "2026-03-09"],
  [ALG, "Graphs", "Lecture 9: Breadth-first search", "bfs.pdf", 5, 71, 95, "2026-03-12"],
  [ALG, "Graphs", "Lecture 10: Depth-first search", "dfs.pdf", 5, 63, 90, "2026-03-16"],
  [ALG, "Graphs", "Lecture 11: Weighted shortest paths", "weighted-shortest-paths.pdf", 5, 38, 60, "2026-03-19"],
  [ALG, "Graphs", "Lecture 12: Bellman-Ford", "bellman-ford.pdf", 5, 29, 50, "2026-03-23"],
  [ALG, "Graphs", "Lecture 13: Dijkstra's algorithm", "dijkstra.pdf", 5, 92, 120, "2026-03-26"],
  [ALG, "Graphs", "Lecture 14: Johnson's algorithm", "johnson.pdf", 5, 14, 30, "2026-03-30"],
  [ALG, "Dynamic programming", "Lecture 15: Recursive algorithms", "recursive-algorithms.pdf", 8, 55, 80, "2026-04-02"],
  [ALG, "Dynamic programming", "Lecture 16: Dynamic programming subproblems", "dp-subproblems.pdf", 9, 49, 75, "2026-04-06"],
  [ALG, "Dynamic programming", "Lecture 17: Dynamic programming III", "dp-examples.pdf", 8, 33, 58, "2026-04-09"],
  [ALG, "Dynamic programming", "Lecture 18: Pseudopolynomial time", "pseudopolynomial.pdf", 8, 17, 35, "2026-04-13"],
]

export const notes: DemoNote[] = rows.map(([m, topic, title, file, pages, stars, views, updated], i) =>
  ({ ...n(m, topic, title, PEOPLE[i % PEOPLE.length], "PDF", pages, stars, views, updated, file), owner: `${PEOPLE[i % PEOPLE.length]}@ucdconnect.ie` }))

// Module name lookup from the seed catalogue; hand-typed codes have no name yet.
const names = Object.fromEntries(Object.values(courseModules).flat().map((m) => [m.code, m.name]))
export const moduleName = (code: string): string | null => names[code] ?? null

export const slugify = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
export const topicSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export function moduleStats(code: string, all: DemoNote[] = notes) {
  const list = all.filter((x) => x.module_code === code)
  return {
    notes: list.length,
    stars: list.reduce((s, x) => s + x.stars, 0),
    updated: list.map((x) => x.updated).sort().at(-1) ?? null,
  }
}
