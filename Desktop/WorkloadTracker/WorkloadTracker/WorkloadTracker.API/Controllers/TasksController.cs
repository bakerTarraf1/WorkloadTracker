using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.Enums;
using WorkloadTracker.API.Models;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public TasksController(AppDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tasks = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Select(t => new
                {
                    t.Id, t.Title, t.Description,
                    t.Priority, t.Complexity, t.EffortHours,
                    t.StartDate, t.DueDate, t.Status,
                    t.IsAcknowledged, t.AcknowledgedAt,
                    AssignedUser = t.AssignedUser.FullName,
                    AssignedUserId = t.AssignedUserId
                })
                .ToListAsync();

            var multipliers = await _context.WeightMultipliers.ToListAsync();

            var result = tasks.Select(t => new
            {
                t.Id, t.Title, t.Description,
                t.Priority, t.Complexity, t.EffortHours,
                t.StartDate, t.DueDate, t.Status,
                t.IsAcknowledged, t.AcknowledgedAt,
                t.AssignedUser, t.AssignedUserId,
                Weight = t.EffortHours
                    * GetMultiplier(multipliers, "Complexity", t.Complexity.ToString())
                    * GetMultiplier(multipliers, "Priority", t.Priority.ToString())
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.StatusHistories)
                .Include(t => t.ChangeRequests)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound();

            var multipliers = await _context.WeightMultipliers.ToListAsync();
            var complexityM = GetMultiplier(multipliers, "Complexity", task.Complexity.ToString());
            var priorityM = GetMultiplier(multipliers, "Priority", task.Priority.ToString());
            var weight = task.EffortHours * complexityM * priorityM;

            return Ok(new
            {
                task.Id, task.Title, task.Description,
                task.Priority, task.Complexity, task.EffortHours,
                task.StartDate, task.DueDate, task.Status,
                task.IsAcknowledged, task.AcknowledgedAt,
                AssignedUser = task.AssignedUser.FullName,
                AssignedUserId = task.AssignedUserId,
                Weight = weight,
                ComplexityMultiplier = complexityM,
                PriorityMultiplier = priorityM,
                StatusHistory = task.StatusHistories,
                ChangeRequests = task.ChangeRequests
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
        {
            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                AssignedUserId = dto.AssignedUserId,
                Priority = dto.Priority,
                Complexity = dto.Complexity,
                EffortHours = dto.EffortHours,
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                Status = Enums.TaskStatus.New
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                dto.AssignedUserId,
                "New Task Assigned 📋",
                $"You have been assigned: {dto.Title}",
                "task_assigned"
            );

            return Ok(new { message = "Task created", taskId = task.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateTaskDto dto)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.AssignedUserId = dto.AssignedUserId;
            task.Priority = dto.Priority;
            task.Complexity = dto.Complexity;
            task.EffortHours = dto.EffortHours;
            task.StartDate = dto.StartDate;
            task.DueDate = dto.DueDate;

            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                dto.AssignedUserId,
                "Task Updated ✏️",
                $"Your task has been updated: {dto.Title}",
                "task_updated"
            );

            return Ok(new { message = "Task updated" });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value).ToList();

            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            // ✅ فقط صاحب المهمة أو Admin أو TeamLeader
            if (task.AssignedUserId != userId &&
                !roles.Contains("Admin") &&
                !roles.Contains("TeamLeader"))
                return StatusCode(403, new { message = "You can only update status of your own tasks" });

            var history = new TaskStatusHistory
            {
                TaskItemId = id,
                OldStatus = task.Status,
                NewStatus = dto.Status,
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = userId!
            };

            task.Status = dto.Status;
            _context.TaskStatusHistories.Add(history);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated" });
        }

        [HttpPut("{id}/acknowledge")]
        public async Task<IActionResult> Acknowledge(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return NotFound();

            // ✅ فقط صاحب المهمة يقدر يعمل Acknowledge
            if (task.AssignedUserId != userId)
                return StatusCode(403, new { message = "You can only acknowledge your own tasks" });

            task.IsAcknowledged = true;
            task.AcknowledgedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // إشعار للـ Team Leaders
            var leaders = await _context.Users
                .Where(u => _context.UserRoles
                    .Join(_context.Roles,
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => new { ur.UserId, r.Name })
                    .Any(x => x.UserId == u.Id && x.Name == "TeamLeader"))
                .ToListAsync();

            foreach (var leader in leaders)
            {
                await _notificationService.CreateAsync(
                    leader.Id,
                    "Task Acknowledged ✅",
                    $"{task.AssignedUser.FullName} acknowledged: {task.Title}",
                    "task_acknowledged"
                );
            }

            return Ok(new { message = "Task acknowledged" });
        }

        [HttpGet("workload")]
        public async Task<IActionResult> GetWorkload(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            return await GetWorkloadByRange(startDate, endDate);
        }

        [HttpGet("workload/thisweek")]
        public async Task<IActionResult> GetThisWeekWorkload()
        {
            var today = DateTime.UtcNow;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
            var endOfWeek = startOfWeek.AddDays(6);
            return await GetWorkloadByRange(startOfWeek, endOfWeek);
        }

        [HttpGet("workload/nextweek")]
        public async Task<IActionResult> GetNextWeekWorkload()
        {
            var today = DateTime.UtcNow;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday + 7);
            var endOfWeek = startOfWeek.AddDays(6);
            return await GetWorkloadByRange(startOfWeek, endOfWeek);
        }

        private async Task<IActionResult> GetWorkloadByRange(DateTime startDate, DateTime endDate)
        {
            var tasks = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Where(t => t.StartDate <= endDate && t.DueDate >= startDate)
                .ToListAsync();

            var multipliers = await _context.WeightMultipliers.ToListAsync();

            var workload = tasks
                .GroupBy(t => new { t.AssignedUserId, t.AssignedUser.FullName })
                .Select(g =>
                {
                    var totalWeight = g.Sum(t => t.EffortHours
                        * GetMultiplier(multipliers, "Complexity", t.Complexity.ToString())
                        * GetMultiplier(multipliers, "Priority", t.Priority.ToString()));

                    return new
                    {
                        UserId = g.Key.AssignedUserId,
                        FullName = g.Key.FullName,
                        TotalTasks = g.Count(),
                        TotalEffort = g.Sum(t => t.EffortHours),
                        TotalWeight = totalWeight,
                        Status = GetWorkloadStatus(totalWeight)
                    };
                })
                .ToList();

            return Ok(workload);
        }

        private static double GetMultiplier(
            List<WeightMultiplier> multipliers, string type, string name)
        {
            return multipliers
                .FirstOrDefault(m => m.Type == type && m.Name == name)
                ?.Multiplier ?? 1.0;
        }

        private static string GetWorkloadStatus(double weight) => weight switch
        {
            <= 15 => "Available",
            <= 25 => "Moderate",
            _ => "Overloaded"
        };
    }

    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssignedUserId { get; set; } = string.Empty;
        public Priority Priority { get; set; }
        public Complexity Complexity { get; set; }
        public double EffortHours { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
    }

    public class UpdateStatusDto
    {
        public Enums.TaskStatus Status { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}