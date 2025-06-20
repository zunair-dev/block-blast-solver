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
    cell.classList.toggle("block-orange");
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
      cell.classList.remove("block-orange");
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

    console.log("=== DEBUGGING SOLVE ===");
    console.log("Main grid:", grid);
    console.log("Figures:", figures);

    fetch("/solve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
          .content,
      },
      body: JSON.stringify({ grid, figures }),
    })
      .then((response) => {
        console.log("Response status:", response.status);
        return response.json();
      })
      .then((data) => {
        console.log("Response data:", data);
        this.renderNextMoves(data);
      })
      .catch((error) => {
        console.error("Error solving:", error);
        alert("Error solving: " + error);
      });
  }

  renderNextMoves(solutions) {
    const solution = solutions[0]; // Show the best solution
    if (!solution) return;

    console.log("Rendering solution:", solution); // Debug log

    for (let step = 0; step < 3; step++) {
      const gridDiv = document.getElementById(`step-grid-${step}`);
      const completedLinesSpan = document.getElementById(
        `completed-lines-${step}`
      );

      if (!gridDiv || !solution.boards[step]) continue;

      const board = solution.boards[step];
      const completed = solution.completed_lines[step];
      completedLinesSpan.textContent = completed;

      // Clear all previous classes
      Array.from(gridDiv.children).forEach((cell) => {
        cell.classList.remove(
          "block-blue",
          "block-orange",
          "completed-line",
          "bg-[#f2f4ff]"
        );
        cell.classList.add("bg-[#f2f4ff]"); // Default background
      });

      // Apply colors based on cell values
      Array.from(gridDiv.children).forEach((cell, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const cellValue = board[row][col];

        // Remove default background when we have content
        if (cellValue > 0) {
          cell.classList.remove("bg-[#f2f4ff]");
        }

        switch (cellValue) {
          case 1:
            // Original grid blocks - blue
            cell.classList.add("block-blue");
            break;
          case 2:
            // Newly placed figure blocks - orange
            cell.classList.add("block-orange");
            break;
          case 3:
            // Completed line blocks - orange with black border
            cell.classList.add("block-orange", "completed-line");
            break;
          default:
            // Empty cells stay with default background
            break;
        }
      });
    }

    // Show placement information
    this.showPlacementInfo(solution);
  }

  showPlacementInfo(solution) {
    // You could add placement hints here
    console.log("Best solution steps:", solution.steps);
    console.log("Total lines cleared:", solution.total_cleared);
  }
}
