class HomeController < ApplicationController
  def index
  end

  def solve
    begin
      grid = params[:grid] # 8x8 array
      figures = params[:figures] # array of 3, each 5x5
      
      Rails.logger.info "Received solve request with grid: #{grid.inspect} and figures: #{figures.inspect}"
      
      solver = BlockSolverService.new(grid, figures)
      @solutions = solver.best_sequences(limit: 3)
      
      Rails.logger.info "Found #{@solutions.length} solutions"
      
      render json: @solutions
    rescue => e
      Rails.logger.error "Error in solve action: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      
      render json: { error: e.message }, status: 500
    end
  end
end
