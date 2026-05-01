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
    public class TeamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var teams = await _context.Teams
                .Include(t => t.Members)
                .ThenInclude(m => m.User)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    Members = t.Members.Select(m => new
                    {
                        m.UserId,
                        m.User.FullName,
                        m.User.Email
                    })
                })
                .ToListAsync();

            return Ok(teams);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateTeamDto dto)
        {
            var team = new Team { Name = dto.Name };
            _context.Teams.Add(team);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Team created", teamId = team.Id });
        }

        [HttpPost("{teamId}/members")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> AddMember(int teamId, [FromBody] AddMemberDto dto)
        {
            var exists = await _context.TeamMembers
                .AnyAsync(m => m.TeamId == teamId && m.UserId == dto.UserId);

            if (exists)
                return BadRequest(new { message = "User already in team" });

            var member = new TeamMember
            {
                TeamId = teamId,
                UserId = dto.UserId
            };

            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Member added" });
        }

        [HttpGet("{teamId}/members")]
        public async Task<IActionResult> GetMembers(int teamId)
        {
            var members = await _context.TeamMembers
                .Where(m => m.TeamId == teamId)
                .Include(m => m.User)
                .Select(m => new
                {
                    m.UserId,
                    m.User.FullName,
                    m.User.Email
                })
                .ToListAsync();

            return Ok(members);
        }
    }

    public class CreateTeamDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class AddMemberDto
    {
        public string UserId { get; set; } = string.Empty;
    }
}