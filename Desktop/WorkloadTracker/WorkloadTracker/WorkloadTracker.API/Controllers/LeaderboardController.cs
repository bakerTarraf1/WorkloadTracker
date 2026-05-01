using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Data;
using TaskStatus = WorkloadTracker.API.Enums.TaskStatus;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LeaderboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaderboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLeaderboard()
        {
            var members = await _context.Users
                .Where(u => _context.UserRoles
                    .Join(_context.Roles,
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => new { ur.UserId, r.Name })
                    .Any(x => x.UserId == u.Id && x.Name == "Member"))
                .ToListAsync();

            var multipliers = await _context.WeightMultipliers.ToListAsync();
            var allTasks = await _context.Tasks.ToListAsync();

            var today = DateTime.UtcNow.Date;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
            var endOfWeek = startOfWeek.AddDays(6);

            double GetWeight(Models.TaskItem t) =>
                t.EffortHours *
                (multipliers.FirstOrDefault(x => x.Type == "Complexity" && x.Name == t.Complexity.ToString())?.Multiplier ?? 1.0) *
                (multipliers.FirstOrDefault(x => x.Type == "Priority" && x.Name == t.Priority.ToString())?.Multiplier ?? 1.0);

            var leaderboard = members.Select(m =>
            {
                var memberTasks = allTasks.Where(t => t.AssignedUserId == m.Id).ToList();
                var completedTasks = memberTasks.Where(t => t.Status == TaskStatus.Done).ToList();
                var weekTasks = memberTasks.Where(t =>
                    t.StartDate <= endOfWeek && t.DueDate >= startOfWeek).ToList();

                var totalWeightCompleted = completedTasks.Sum(t => GetWeight(t));
                var weekWeight = weekTasks.Sum(t => GetWeight(t));

                var acknowledgedTasks = memberTasks.Where(t => t.IsAcknowledged).ToList();
                var acknowledgeRate = memberTasks.Count > 0
                    ? Math.Round((double)acknowledgedTasks.Count / memberTasks.Count * 100, 1)
                    : 0.0;

                var completionRate = memberTasks.Count > 0
                    ? Math.Round((double)completedTasks.Count / memberTasks.Count * 100, 1)
                    : 0.0;

                var score = (completedTasks.Count * 10) +
                           (int)(totalWeightCompleted * 2) +
                           (int)acknowledgeRate;

                return new
                {
                    UserId = m.Id,
                    FullName = m.FullName,
                    CompletedTasks = completedTasks.Count,
                    TotalTasks = memberTasks.Count,
                    TotalWeightCompleted = Math.Round(totalWeightCompleted, 1),
                    WeekWeight = Math.Round(weekWeight, 1),
                    AcknowledgeRate = acknowledgeRate,
                    CompletionRate = completionRate,
                    Score = score
                };
            })
            .OrderByDescending(m => m.Score)
            .ToList();

            return Ok(leaderboard);
        }
    }
}