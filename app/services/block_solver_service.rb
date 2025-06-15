# app/services/block_blast_solver.rb
class BlockSolverService
  # grid: 8x8 array of 0/1
  # figures: array of 3, each a 5x5 array of 0/1
  def initialize(grid, figures)
    @grid = grid.map(&:dup)
    @figures = figures.map { |f| f.map(&:dup) }
  end

  # Returns: [{steps: [placement1, placement2, placement3], boards: [after1, after2, after3], completed_lines: [0,0,1]}, ...]
  def best_sequences(limit: 3)
    # 1. Generate all possible placements for each figure
    placements = @figures.map { |fig| possible_placements(@grid, fig) }
    # 2. Try all permutations of figure order
    results = []
    @figures.permutation.each do |fig_order|
      try_sequences(fig_order, placements, results)
    end
    # 3. Sort by best score (e.g., most lines cleared)
    results.sort_by! { |r| -r[:completed_lines].last }
    results.take(limit)
  end

  private

  def possible_placements(grid, figure)
    placements = []
    (0..(8-figure.size)).each do |row|
      (0..(8-figure[0].size)).each do |col|
        if can_place?(grid, figure, row, col)
          placements << {row: row, col: col}
        end
      end
    end
    placements
  end

  def can_place?(grid, figure, row, col)
    figure.each_with_index do |frow, i|
      frow.each_with_index do |cell, j|
        next if cell == 0
        return false if grid[row+i][col+j] != 0
      end
    end
    true
  end

  def place_figure(grid, figure, row, col)
    new_grid = grid.map(&:dup)
    figure.each_with_index do |frow, i|
      frow.each_with_index do |cell, j|
        new_grid[row+i][col+j] = 1 if cell == 1
      end
    end
    new_grid
  end

  def clear_lines(grid)
    cleared = 0
    # Clear rows
    grid = grid.reject { |row| row.all?(&:positive?) }
    cleared += 8 - grid.size
    # Add empty rows at top
    while grid.size < 8
      grid.unshift([0]*8)
    end
    [grid, cleared]
  end

  def try_sequences(fig_order, placements, results)
    # For each possible placement of the first, then second, then third
    placements[0].each do |p1|
      g1 = place_figure(@grid, fig_order[0], p1[:row], p1[:col])
      g1, c1 = clear_lines(g1)
      placements[1].each do |p2|
        g2 = place_figure(g1, fig_order[1], p2[:row], p2[:col])
        g2, c2 = clear_lines(g2)
        placements[2].each do |p3|
          g3 = place_figure(g2, fig_order[2], p3[:row], p3[:col])
          g3, c3 = clear_lines(g3)
          results << {
            steps: [p1, p2, p3],
            boards: [g1, g2, g3],
            completed_lines: [c1, c2, c3]
          }
        end
      end
    end
  end
end
