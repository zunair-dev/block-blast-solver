import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = [];

  connect() {
    // 8x8 main grid
    this.mainGrid = Array.from({ length: 8 }, () => Array(8).fill(0));
    // 3x 5x5 figures
    this.figures = Array.from({ length: 3 }, () =>
      Array.from({ length: 5 }, () => Array(5).fill(0))
    );
  }

  toggleMainCell(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    this.mainGrid[row][col] = this.mainGrid[row][col] ? 0 : 1;
    cell.classList.toggle("bg-purple-400");
    cell.classList.toggle("bg-[#f2f4ff]");
  }

  toggleFigureCell(event) {
    const cell = event.target;
    const fig = parseInt(cell.dataset.figure);
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    this.figures[fig][row][col] = this.figures[fig][row][col] ? 0 : 1;
    cell.classList.toggle("bg-purple-400");
    cell.classList.toggle("bg-[#f2f4ff]");
  }

  clearAll() {
    // Clear main grid
    document.querySelectorAll("#main-grid > div").forEach((cell) => {
      cell.classList.remove("bg-purple-400");
      cell.classList.add("bg-[#f2f4ff]");
    });
    this.mainGrid = Array.from({ length: 8 }, () => Array(8).fill(0));
    // Clear figures
    document.querySelectorAll("[data-figure]").forEach((cell) => {
      cell.classList.remove("bg-purple-400");
      cell.classList.add("bg-[#f2f4ff]");
    });
    this.figures = Array.from({ length: 3 }, () =>
      Array.from({ length: 5 }, () => Array(5).fill(0))
    );
  }

  solve() {
    // TODO: Implement solver logic
    alert("Solver logic goes here!");
  }
}
