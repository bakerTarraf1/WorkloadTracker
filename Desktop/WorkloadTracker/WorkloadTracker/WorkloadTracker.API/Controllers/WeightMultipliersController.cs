using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.Models;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WeightMultipliersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WeightMultipliersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var multipliers = await _context.WeightMultipliers.ToListAsync();
            return Ok(multipliers);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMultiplierDto dto)
        {
            var multiplier = await _context.WeightMultipliers.FindAsync(id);
            if (multiplier == null) return NotFound();

            multiplier.Multiplier = dto.Multiplier;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Multiplier updated" });
        }
    }

    public class UpdateMultiplierDto
    {
        public double Multiplier { get; set; }
    }
}