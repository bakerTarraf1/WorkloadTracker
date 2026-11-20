using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
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
    public class ChangeRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public ChangeRequestsController(AppDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.ChangeRequests
                .Include(r => r.TaskItem)
                .Select(r => new
                {
                    r.Id,
                    r.Type,
                    r.NewValue,
                    r.Status,
                    r.CreatedAt,
                    r.ReviewedAt,
                    r.RequestedByUserId,
                    TaskTitle = r.TaskItem.Title,
                    r.TaskItemId
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateChangeRequestDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var task = await _context.Tasks.FindAsync(dto.TaskItemId);
            if (task == null)
                return NotFound(new { message = "Task not found" });

            if (task.AssignedUserId != userId)
                return StatusCode(403, new { message = "You can only request changes for your own tasks" });

            var request = new ChangeRequest
            {
                TaskItemId = dto.TaskItemId,
                RequestedByUserId = userId!,
                Type = dto.Type,
                NewValue = dto.NewValue,
                Status = ChangeRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChangeRequests.Add(request);
            await _context.SaveChangesAsync();

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
                    "New Change Request 📝",
                    $"New change request for task: {task.Title}",
                    "change_request"
                );
            }

            return Ok(new { message = "Change request submitted", id = request.Id });
        }

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> Approve(int id)
        {
            var request = await _context.ChangeRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound(new { message = "Request not found" });

            if (request.Status != ChangeRequestStatus.Pending)
                return BadRequest(new { message = "Request already reviewed" });

            var task = await _context.Tasks.FindAsync(request.TaskItemId);
            if (task == null)
                return NotFound(new { message = "Task not found" });

            try
            {
                var value = request.NewValue?.Trim();

                // ✅ اكتشف نوع الـ Value تلقائياً
                DateTime parsedDate;
                bool isDate =
                    DateTime.TryParse(value, CultureInfo.InvariantCulture,
                        DateTimeStyles.None, out parsedDate) ||
                    DateTime.TryParse(value, new CultureInfo("en-US"),
                        DateTimeStyles.None, out parsedDate) ||
                    DateTime.TryParseExact(value, "yyyy-MM-dd",
                        CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate) ||
                    DateTime.TryParseExact(value, "M/d/yyyy",
                        CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate) ||
                    DateTime.TryParseExact(value, "MM/dd/yyyy",
                        CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate);

                double parsedEffort;
                bool isNumber =
                    double.TryParse(value, NumberStyles.Any,
                        CultureInfo.InvariantCulture, out parsedEffort) ||
                    double.TryParse(value, NumberStyles.Any,
                        CultureInfo.CurrentCulture, out parsedEffort);

                if (isDate)
                {
                    // ✅ تاريخ → غيّر الـ DueDate
                    task.DueDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                }
                else if (isNumber && parsedEffort > 0)
                {
                    // ✅ رقم → غيّر الـ EffortHours
                    task.EffortHours = parsedEffort;
                }
                else
                {
                    // ✅ غير ذلك → اعتبره UserId للـ Reassign
                    var userExists = await _context.Users
                        .AnyAsync(u => u.Id == value);
                    if (!userExists)
                        return BadRequest(new
                        {
                            message = $"Cannot apply change: '{value}' is not a valid user, date, or number."
                        });
                    task.AssignedUserId = value!;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to apply change", error = ex.Message });
            }

            request.Status = ChangeRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                request.RequestedByUserId,
                "Change Request Approved ✅",
                $"Your change request for '{task.Title}' was approved!",
                "request_approved"
            );

            return Ok(new { message = "Change request approved" });
        }

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> Reject(int id)
        {
            var request = await _context.ChangeRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound(new { message = "Request not found" });

            if (request.Status != ChangeRequestStatus.Pending)
                return BadRequest(new { message = "Request already reviewed" });

            var task = await _context.Tasks.FindAsync(request.TaskItemId);
            var taskTitle = task?.Title ?? "Unknown Task";

            request.Status = ChangeRequestStatus.Rejected;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                request.RequestedByUserId,
                "Change Request Rejected ❌",
                $"Your change request for '{taskTitle}' was rejected.",
                "request_rejected"
            );

            return Ok(new { message = "Change request rejected" });
        }
    }

    public class CreateChangeRequestDto
    {
        public int TaskItemId { get; set; }
        public string RequestedByUserId { get; set; } = string.Empty;
        public ChangeRequestType Type { get; set; }
        public string NewValue { get; set; } = string.Empty;
    }
}