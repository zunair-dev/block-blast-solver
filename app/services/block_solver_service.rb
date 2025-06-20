# app/services/block_blast_solver.rb
class BlockSolverService
  # grid: 8x8 array of 0/1 (existing blocks)
  # figures: array of 3, each a 5x5 array of 0/1 (figures to place)
  def initialize(grid, figures)
    @original_grid = grid.map(&:dup)
    @figures = figures.map { |f| clean_figure(f.map(&:dup)) }

    puts "=== INITIALIZATION DEBUG ==="
    puts "Original grid received:"
    @original_grid.each_with_index do |row, i|
      puts "Row #{i}: #{row.inspect}"
    end

    puts "Cleaned figures:"
    @figures.each_with_index do |fig, i|
      puts "Figure #{i}:"
      fig.each { |row| puts "  #{row.inspect}" }
    end
  end

  # Returns: [{steps: [placement1, placement2, placement3], boards: [after1, after2, after3], completed_lines: [0,0,1]}, ...]
  def best_sequences(limit: 3)
    puts "=== DEBUGGING BLOCK SOLVER ==="
    puts "Original grid: #{@original_grid.inspect}"
    puts "Figures: #{@figures.inspect}"

    # Find all possible figure placements
    all_solutions = []

    # Try all permutations of the 3 figures
    [ 0, 1, 2 ].permutation.each do |figure_order|
      puts "Trying figure order: #{figure_order}"
      solutions = solve_sequence(figure_order)
      puts "Found #{solutions.length} solutions for this order"
      all_solutions.concat(solutions)
    end

    puts "Total solutions found: #{all_solutions.length}"

    # Sort by total score (prioritize more line clears and efficiency)
    all_solutions.sort_by! { |solution| -calculate_score(solution) }
    result = all_solutions.take(limit)

    puts "Returning #{result.length} best solutions"
    result.each_with_index do |sol, i|
      puts "Solution #{i+1}: #{sol[:total_cleared]} lines cleared"
    end

    result
  end

  private

  def solve_sequence(figure_order)
    solutions = []

    # Get all possible placements for first figure
    first_placements = get_all_placements(@original_grid, @figures[figure_order[0]])
    puts "First figure placements: #{first_placements.length}"

    # If no placements for first figure, return empty
    return solutions if first_placements.empty?

    first_placements.each do |p1|
      # Apply first placement
      grid1 = apply_placement(@original_grid, @figures[figure_order[0]], p1)
      state1 = process_clears(grid1)

      # Get all possible placements for second figure
      second_placements = get_all_placements(state1[:grid], @figures[figure_order[1]])
      puts "Second figure placements: #{second_placements.length}"

      # If no placements for second figure, skip this first placement
      next if second_placements.empty?

      second_placements.each do |p2|
        # Apply second placement
        grid2 = apply_placement(state1[:grid], @figures[figure_order[1]], p2)
        state2 = process_clears(grid2)

        # Get all possible placements for third figure
        third_placements = get_all_placements(state2[:grid], @figures[figure_order[2]])
        puts "Third figure placements: #{third_placements.length}"

        # If no placements for third figure, skip this second placement
        next if third_placements.empty?

        third_placements.each do |p3|
          # Apply third placement
          grid3 = apply_placement(state2[:grid], @figures[figure_order[2]], p3)
          state3 = process_clears(grid3)

          solutions << {
            steps: [
              { placement: p1, figure_index: figure_order[0] },
              { placement: p2, figure_index: figure_order[1] },
              { placement: p3, figure_index: figure_order[2] }
            ],
            boards: [ state1[:display_grid], state2[:display_grid], state3[:display_grid] ],
            completed_lines: [ state1[:lines_cleared], state2[:lines_cleared], state3[:lines_cleared] ],
            final_grid: state3[:grid],
            total_cleared: state1[:lines_cleared] + state2[:lines_cleared] + state3[:lines_cleared]
          }

          # For debugging, limit to first few solutions
          break if solutions.length >= 10
        end
        break if solutions.length >= 10
      end
      break if solutions.length >= 10
    end

    puts "Generated #{solutions.length} solutions for order #{figure_order}"
    solutions
  end

  def get_all_placements(grid, figure)
    placements = []
    max_row = 8 - figure.length
    max_col = 8 - figure[0].length

    puts "Finding placements for figure: #{figure.inspect}"
    puts "Max row: #{max_row}, Max col: #{max_col}"

    (0..max_row).each do |row|
      (0..max_col).each do |col|
        if can_place_figure?(grid, figure, row, col)
          placements << { row: row, col: col }
        end
      end
    end

    puts "Found #{placements.length} valid placements"
    placements
  end

  def can_place_figure?(grid, figure, start_row, start_col)
    figure.each_with_index do |figure_row, row_offset|
      figure_row.each_with_index do |cell, col_offset|
        next if cell == 0

        grid_row = start_row + row_offset
        grid_col = start_col + col_offset

        return false if grid[grid_row][grid_col] != 0
      end
    end
    true
  end

  def apply_placement(grid, figure, placement)
    new_grid = grid.map(&:dup)

    figure.each_with_index do |figure_row, row_offset|
      figure_row.each_with_index do |cell, col_offset|
        next if cell == 0

        grid_row = placement[:row] + row_offset
        grid_col = placement[:col] + col_offset
        new_grid[grid_row][grid_col] = 2  # Orange for newly placed pieces
      end
    end

    new_grid
  end

  def process_clears(grid)
    display_grid = grid.map(&:dup)  # Grid to show with highlighting
    working_grid = grid.map(&:dup)  # Grid for actual clearing
    total_cleared = 0

    # Convert original blocks to blue (1) for display
    display_grid.each_with_index do |row, r|
      row.each_with_index do |cell, c|
        if @original_grid[r][c] == 1 && cell != 0
          display_grid[r][c] = 1  # Blue for original blocks
        end
      end
    end

    # Find and mark completed lines
    completed_rows = find_completed_rows(working_grid)
    completed_cols = find_completed_cols(working_grid)

    # Mark completed cells in display grid (they'll get the completed-line class)
    mark_completed_lines(display_grid, completed_rows, completed_cols)

    # Clear the lines from working grid
    total_cleared = completed_rows.length + completed_cols.length
    cleared_grid = clear_completed_lines(working_grid, completed_rows, completed_cols)

    {
      grid: cleared_grid,
      display_grid: display_grid,
      lines_cleared: total_cleared
    }
  end

  def find_completed_rows(grid)
    completed = []
    grid.each_with_index do |row, index|
      completed << index if row.all? { |cell| cell > 0 }
    end
    completed
  end

  def find_completed_cols(grid)
    completed = []
    (0..7).each do |col|
      completed << col if grid.all? { |row| row[col] > 0 }
    end
    completed
  end

  def mark_completed_lines(grid, completed_rows, completed_cols)
    # Mark completed rows
    completed_rows.each do |row|
      (0..7).each do |col|
        grid[row][col] = 3 if grid[row][col] > 0  # Special value for completed line highlighting
      end
    end

    # Mark completed columns
    completed_cols.each do |col|
      (0..7).each do |row|
        grid[row][col] = 3 if grid[row][col] > 0  # Special value for completed line highlighting
      end
    end
  end

  def clear_completed_lines(grid, completed_rows, completed_cols)
    new_grid = grid.map(&:dup)

    # Clear completed rows
    completed_rows.reverse.each do |row_index|
      new_grid.delete_at(row_index)
    end

    # Add empty rows at top
    while new_grid.length < 8
      new_grid.unshift([ 0 ] * 8)
    end

    # Clear completed columns
    completed_cols.reverse.each do |col_index|
      new_grid.each { |row| row.delete_at(col_index) }
    end

    # Add empty columns at left
    completed_cols.each do |_|
      new_grid.each { |row| row.unshift(0) }
    end

    new_grid
  end

  def calculate_score(solution)
    # Prioritize solutions with more line clears
    base_score = solution[:total_cleared] * 100

    # Bonus for clearing lines early (cascading potential)
    early_bonus = solution[:completed_lines][0] * 50 + solution[:completed_lines][1] * 30

    # Penalty for leaving isolated blocks
    isolation_penalty = count_isolated_blocks(solution[:final_grid]) * -10

    base_score + early_bonus + isolation_penalty
  end

  def count_isolated_blocks(grid)
    isolated = 0
    (0..7).each do |row|
      (0..7).each do |col|
        if grid[row][col] > 0
          neighbors = count_neighbors(grid, row, col)
          isolated += 1 if neighbors == 0
        end
      end
    end
    isolated
  end

  def count_neighbors(grid, row, col)
    neighbors = 0
    [ -1, 0, 1 ].each do |dr|
      [ -1, 0, 1 ].each do |dc|
        next if dr == 0 && dc == 0
        nr, nc = row + dr, col + dc
        next if nr < 0 || nr >= 8 || nc < 0 || nc >= 8
        neighbors += 1 if grid[nr][nc] > 0
      end
    end
    neighbors
  end

  def clean_figure(figure)
    # Remove empty rows from top and bottom
    while figure.length > 0 && figure.first.all? { |cell| cell == 0 }
      figure.shift
    end
    while figure.length > 0 && figure.last.all? { |cell| cell == 0 }
      figure.pop
    end

    return [ [ 0 ] ] if figure.empty?

    # Remove empty columns from left and right
    while figure[0].length > 0 && figure.all? { |row| row.first == 0 }
      figure.each { |row| row.shift }
    end
    while figure[0].length > 0 && figure.all? { |row| row.last == 0 }
      figure.each { |row| row.pop }
    end

    figure.empty? ? [ [ 0 ] ] : figure
  end
end
