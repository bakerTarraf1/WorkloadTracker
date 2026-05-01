using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.Models;
using TaskStatus = WorkloadTracker.API.Enums.TaskStatus;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _context;

        public ProfileController(UserManager<User> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            var allTasks = await _context.Tasks
                .Where(t => t.AssignedUserId == userId)
                .ToListAsync();

            var completedTasks = allTasks.Where(t => t.Status == TaskStatus.Done).ToList();
            var inProgressTasks = allTasks.Where(t => t.Status == TaskStatus.InProgress).ToList();
            var blockedTasks = allTasks.Where(t => t.Status == TaskStatus.Blocked).ToList();

            var multipliers = await _context.WeightMultipliers.ToListAsync();

            double GetWeight(Models.TaskItem t) =>
                t.EffortHours *
                (multipliers.FirstOrDefault(x => x.Type == "Complexity" && x.Name == t.Complexity.ToString())?.Multiplier ?? 1.0) *
                (multipliers.FirstOrDefault(x => x.Type == "Priority" && x.Name == t.Priority.ToString())?.Multiplier ?? 1.0);

            var heaviestTask = allTasks
                .Select(t => new { t.Title, Weight = GetWeight(t) })
                .OrderByDescending(t => t.Weight)
                .FirstOrDefault();

            var totalWeightCompleted = completedTasks.Sum(t => GetWeight(t));

            var completionRate = allTasks.Count > 0
                ? Math.Round((double)completedTasks.Count / allTasks.Count * 100, 1)
                : 0.0;

            var avgEffort = completedTasks.Count > 0
                ? Math.Round(completedTasks.Average(t => t.EffortHours), 1)
                : 0.0;

            var taskHistory = allTasks
                .OrderByDescending(t => t.StartDate)
                .Take(10)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    Status = (int)t.Status,
                    Priority = (int)t.Priority,
                    Complexity = (int)t.Complexity,
                    t.EffortHours,
                    t.StartDate,
                    t.DueDate,
                    t.IsAcknowledged,
                    Weight = GetWeight(t)
                })
                .ToList();

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                Role = roles.FirstOrDefault(),
                Stats = new
                {
                    TotalTasks = allTasks.Count,
                    CompletedTasks = completedTasks.Count,
                    InProgressTasks = inProgressTasks.Count,
                    BlockedTasks = blockedTasks.Count,
                    CompletionRate = completionRate,
                    TotalWeightCompleted = Math.Round(totalWeightCompleted, 1),
                    AverageEffortHours = avgEffort,
                    HeaviestTask = heaviestTask?.Title ?? "None",
                    HeaviestTaskWeight = heaviestTask?.Weight ?? 0
                },
                TaskHistory = taskHistory
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId!);
            if (user == null) return NotFound();

            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber;

            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Profile updated successfully" });
        }
    }

    public class UpdateProfileDto
    {
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }
}