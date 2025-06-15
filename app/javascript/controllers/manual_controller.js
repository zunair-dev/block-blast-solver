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

    // Add mouse event tracking
    this.isMouseDown = false;
    this.lastSelectedCell = null;
  }

  toggleMainCell(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    this.mainGrid[row][col] = this.mainGrid[row][col] ? 0 : 1;
    cell.classList.toggle("bg-purple-400");
    cell.classList.toggle("bg-[#f2f4ff]");
    this.lastSelectedCell = { row, col };
  }

  toggleFigureCell(event) {
    const cell = event.target;
    const fig = parseInt(cell.dataset.figure);
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    this.figures[fig][row][col] = this.figures[fig][row][col] ? 0 : 1;
    cell.classList.toggle("bg-purple-400");
    cell.classList.toggle("bg-[#f2f4ff]");
    this.lastSelectedCell = { fig, row, col };
  }

  // Add mouse event handlers
  handleMouseDown(event) {
    this.isMouseDown = true;
    if (event.target.dataset.row !== undefined) {
      if (event.target.dataset.figure !== undefined) {
        this.toggleFigureCell(event);
      } else {
        this.toggleMainCell(event);
      }
    }
  }

  handleMouseMove(event) {
    if (!this.isMouseDown) return;

    const cell = event.target;
    if (!cell.dataset.row) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (cell.dataset.figure !== undefined) {
      const fig = parseInt(cell.dataset.figure);
      if (
        this.lastSelectedCell &&
        (this.lastSelectedCell.fig !== fig ||
          this.lastSelectedCell.row !== row ||
          this.lastSelectedCell.col !== col)
      ) {
        this.toggleFigureCell(event);
      }
    } else {
      if (
        this.lastSelectedCell &&
        (this.lastSelectedCell.row !== row || this.lastSelectedCell.col !== col)
      ) {
        this.toggleMainCell(event);
      }
    }
  }

  handleMouseUp() {
    this.isMouseDown = false;
    this.lastSelectedCell = null;
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
    // Collect current grid and figures
    const grid = this.mainGrid;
    const figures = this.figures;

    fetch("/solve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
          .content,
      },
      body: JSON.stringify({ grid, figures }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.renderNextMoves(data);
      })
      .catch((error) => {
        alert("Error solving: " + error);
      });
  }

  renderNextMoves(solutions) {
    // solutions: [{steps, boards, completed_lines}, ...]
    for (let move = 0; move < 3; move++) {
      const step = solutions[0]; // Show the best solution
      if (!step) continue;
      const gridDiv = document.getElementById(`step-grid-${move}`);
      const completedLinesSpan = document.getElementById(
        `completed-lines-${move}`
      );
      if (!gridDiv) continue;
      const board = step.boards[move];
      const completed = step.completed_lines[move];
      completedLinesSpan.textContent = completed;

      // Highlight completed rows
      let completedRows = [];
      for (let r = 0; r < 8; r++) {
        if (board[r].every((cell) => cell === 1)) completedRows.push(r);
      }

      Array.from(gridDiv.children).forEach((cell, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        cell.classList.remove("block-blue", "block-orange", "completed-line");
        if (board[row][col] === 1) cell.classList.add("block-blue");
        if (completedRows.includes(row)) cell.classList.add("completed-line");
      });
    }
  }
}
