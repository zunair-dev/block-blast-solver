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

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Response data:", data);

        // Check for server error
        if (data.error) {
          throw new Error(data.error);
        }

        // Show the next moves card first
        const nextMovesCard = document.getElementById("next-moves-card");
        if (nextMovesCard) {
          nextMovesCard.classList.remove("hidden");

          // Wait a bit for the DOM to update, then render the moves
          setTimeout(() => {
            this.renderNextMoves(data);

            // Scroll to the placement steps
            nextMovesCard.scrollIntoView({ behavior: "smooth" });
          }, 50);
        } else {
          this.renderNextMoves(data);
        }
      })
      .catch((error) => {
        console.error("Error solving:", error);

        // Show user-friendly error message
        const nextMovesCard = document.getElementById("next-moves-card");
        if (nextMovesCard) {
          nextMovesCard.classList.remove("hidden");
          this.showErrorMessage(error.message);
          nextMovesCard.scrollIntoView({ behavior: "smooth" });
        } else {
          alert("Error solving: " + error.message);
        }
      });
  }

  showErrorMessage(errorMessage) {
    // Clear all step grids and show error message
    for (let step = 0; step < 3; step++) {
      const gridDiv = document.getElementById(`step-grid-${step}`);
      const completedLinesSpan = document.getElementById(
        `completed-lines-${step}`
      );

      if (gridDiv) {
        // Clear the grid
        Array.from(gridDiv.children).forEach((cell) => {
          cell.classList.remove("block-blue", "block-orange", "completed-line");
          cell.classList.add("bg-[#f2f4ff]");
        });
      }

      if (completedLinesSpan) {
        completedLinesSpan.textContent = "0";
      }
    }

    // Add error message
    const placementStepsTitle = document.querySelector("#next-moves-card h2");
    if (placementStepsTitle) {
      placementStepsTitle.innerHTML = `
        <div class="text-center">
          <h2 class="text-3xl font-bold mb-2 text-red-600">Oops! Something went wrong 😕</h2>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <h3 class="font-semibold text-red-800 mb-2">Error Details:</h3>
            <p class="text-red-700 text-sm font-mono">${errorMessage}</p>
            <div class="mt-4">
              <h4 class="font-semibold text-red-800 mb-2">💡 Try these steps:</h4>
              <ul class="text-red-700 space-y-1 text-sm">
                <li>• Refresh the page and try again</li>
                <li>• Make sure you have filled in the grid and figures</li>
                <li>• Check if your figures are valid shapes</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderNextMoves(solutions) {
    // Handle case when no solutions are found
    if (!solutions || solutions.length === 0) {
      this.showNoSolutionMessage();
      return;
    }

    // Show multiple solutions if available
    this.showMultipleSolutions(solutions);
  }

  showNoSolutionMessage() {
    // Clear all step grids and show friendly message
    for (let step = 0; step < 3; step++) {
      const gridDiv = document.getElementById(`step-grid-${step}`);
      const completedLinesSpan = document.getElementById(
        `completed-lines-${step}`
      );

      if (gridDiv) {
        // Clear the grid
        Array.from(gridDiv.children).forEach((cell) => {
          cell.classList.remove("block-blue", "block-orange", "completed-line");
          cell.classList.add("bg-[#f2f4ff]");
        });
      }

      if (completedLinesSpan) {
        completedLinesSpan.textContent = "0";
      }
    }

    // Add a friendly message with better spacing
    const titleContainer = document.querySelector(
      "#next-moves-card .text-center"
    );
    if (titleContainer) {
      titleContainer.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">No Solution Found 😔</h2>
        <p class="text-lg text-gray-600 mb-6">We couldn't find a way to place all three figures with the current board setup.</p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 class="font-semibold text-yellow-800 mb-3">💡 Try these tips:</h3>
          <ul class="text-yellow-700 space-y-2">
            <li>• Clear some blocks from the main grid to create more space</li>
            <li>• Modify your figure shapes to be smaller or different</li>
            <li>• Check if your figures are too large for the available space</li>
          </ul>
        </div>
      `;
    }
  }

  showMultipleSolutions(solutions) {
    // Show the best solution in the main display
    const bestSolution = solutions[0];
    this.renderSingleSolution(bestSolution, 0);

    // Update the title to show multiple solutions available
    const titleContainer = document.querySelector(
      "#next-moves-card .text-center"
    );
    if (titleContainer) {
      const solutionCount = solutions.length;
      const totalLines = bestSolution.total_cleared;

      titleContainer.innerHTML = `
        <h2 class="text-3xl font-bold mb-4">Best Solution Found! 🎉</h2>
        <div class="flex justify-center items-center gap-4 text-lg mb-2">
          <span class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
            ${totalLines} lines cleared
          </span>
          ${
            solutionCount > 1
              ? `<span class="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
            ${solutionCount} solutions available
          </span>`
              : ""
          }
        </div>
        ${
          solutionCount > 1
            ? `<p class="text-gray-600 mt-3">Choose a solution below to see different approaches</p>`
            : ""
        }
      `;
    }

    // If multiple solutions, add a solution selector
    if (solutions.length > 1) {
      this.addSolutionSelector(solutions);
    }
  }

  renderSingleSolution(solution, solutionIndex = 0) {
    console.log("Rendering solution:", solution); // Debug log

    for (let step = 0; step < 3; step++) {
      const gridDiv = document.getElementById(`step-grid-${step}`);
      const completedLinesSpan = document.getElementById(
        `completed-lines-${step}`
      );

      if (!gridDiv || !solution.boards[step]) {
        console.log(`Missing gridDiv or board for step ${step}`);
        continue;
      }

      const board = solution.boards[step];
      const completed = solution.completed_lines[step];
      completedLinesSpan.textContent = completed;

      console.log(`Updating step ${step} with board:`, board);

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

  addSolutionSelector(solutions) {
    // Remove existing selector if any
    const existingSelector = document.getElementById("solution-selector");
    if (existingSelector) {
      existingSelector.remove();
    }

    // Create solution selector with better spacing
    const selectorDiv = document.createElement("div");
    selectorDiv.id = "solution-selector";
    selectorDiv.className = "flex justify-center gap-3 mb-8 mt-6 px-4"; // Better spacing and padding

    solutions.slice(0, 3).forEach((solution, index) => {
      const button = document.createElement("button");
      button.className = `px-6 py-3 rounded-xl border-2 transition-all font-semibold shadow-sm ${
        index === 0
          ? "bg-purple-500 text-white border-purple-500 shadow-md"
          : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
      }`;
      button.textContent = `Solution ${index + 1} (${
        solution.total_cleared
      } lines)`;
      button.addEventListener("click", () => {
        // Update button states with better styling
        selectorDiv.querySelectorAll("button").forEach((btn, btnIndex) => {
          if (btnIndex === index) {
            btn.className =
              "px-6 py-3 rounded-xl border-2 transition-all font-semibold bg-purple-500 text-white border-purple-500 shadow-md";
          } else {
            btn.className =
              "px-6 py-3 rounded-xl border-2 transition-all font-semibold bg-white text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-sm";
          }
        });

        // Render the selected solution
        this.renderSingleSolution(solution, index);
      });
      selectorDiv.appendChild(button);
    });

    // Insert the selector in the right place with proper spacing
    const nextMovesCard = document.getElementById("next-moves-card");
    const stepsContainer = nextMovesCard.querySelector(
      ".flex.gap-8.justify-center"
    );

    if (stepsContainer) {
      // Insert before the steps container with proper spacing
      stepsContainer.parentElement.insertBefore(selectorDiv, stepsContainer);
    }
  }

  showPlacementInfo(solution) {
    // You could add placement hints here
    console.log("Best solution steps:", solution.steps);
    console.log("Total lines cleared:", solution.total_cleared);
  }
}
