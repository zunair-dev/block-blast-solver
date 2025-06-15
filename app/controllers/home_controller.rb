class HomeController < ApplicationController
  def index
  end

  def solve
    grid = params[:grid] # 8x8 array
    figures = params[:figures] # array of 3, each 5x5
    solver = BlockSolverService.new(grid, figures)
    @solutions = solver.best_sequences(limit: 3)
    render json: @solutions
  end
end
