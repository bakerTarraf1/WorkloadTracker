using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using WorkloadTracker.API.Data;
using TaskStatus = WorkloadTracker.API.Enums.TaskStatus;

namespace WorkloadTracker.API.Services
{
    public class DailyStandupService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly NotificationService _notificationService;

        public DailyStandupService(
            AppDbContext context,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            NotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            _notificationService = notificationService;
        }

        public async Task<string> GenerateStandupReport()
        {
            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            var completedYesterday = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Where(t => t.Status == TaskStatus.Done &&
                    t.AcknowledgedAt.HasValue &&
                    t.AcknowledgedAt.Value.Date == yesterday)
                .ToListAsync();

            var inProgress = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Where(t => t.Status == TaskStatus.InProgress)
                .ToListAsync();

            var atRisk = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Where(t => t.Status != TaskStatus.Done &&
                    t.DueDate <= today.AddDays(2))
                .ToListAsync();

            var blocked = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Where(t => t.Status == TaskStatus.Blocked)
                .ToListAsync();

            var multipliers = await _context.WeightMultipliers.ToListAsync();
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
            var endOfWeek = startOfWeek.AddDays(6);

            var weekTasks = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Where(t => t.StartDate <= endOfWeek && t.DueDate >= startOfWeek)
                .ToListAsync();

            var members = await _context.Users
                .Where(u => _context.UserRoles
                    .Join(_context.Roles,
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => new { ur.UserId, r.Name })
                    .Any(x => x.UserId == u.Id && x.Name == "Member"))
                .ToListAsync();

            var workloadData = members.Select(m =>
            {
                var memberTasks = weekTasks.Where(t => t.AssignedUserId == m.Id).ToList();
                var weight = memberTasks.Sum(t =>
                    t.EffortHours *
                    (multipliers.FirstOrDefault(x => x.Type == "Complexity" && x.Name == t.Complexity.ToString())?.Multiplier ?? 1.0) *
                    (multipliers.FirstOrDefault(x => x.Type == "Priority" && x.Name == t.Priority.ToString())?.Multiplier ?? 1.0)
                );
                return new
                {
                    Name = m.FullName,
                    Weight = Math.Round(weight, 1),
                    Status = weight <= 15 ? "Available" : weight <= 25 ? "Moderate" : "Overloaded",
                    TaskCount = memberTasks.Count
                };
            }).ToList();

            var overloaded = workloadData.Where(m => m.Status == "Overloaded").ToList();
            var available = workloadData.Where(m => m.Status == "Available").ToList();

            var completedList = completedYesterday.Count > 0
                ? string.Join("\n", completedYesterday.Select(t => $"- {t.Title} (by {t.AssignedUser.FullName})"))
                : "- None";

            var inProgressList = inProgress.Count > 0
                ? string.Join("\n", inProgress.Select(t => $"- {t.Title} (by {t.AssignedUser.FullName}, due {t.DueDate:dd/MM})"))
                : "- None";

            var atRiskList = atRisk.Count > 0
                ? string.Join("\n", atRisk.Select(t => $"- {t.Title} (by {t.AssignedUser.FullName}, due {t.DueDate:dd/MM})"))
                : "- None";

            var blockedList = blocked.Count > 0
                ? string.Join("\n", blocked.Select(t => $"- {t.Title} (by {t.AssignedUser.FullName})"))
                : "- None";

            var workloadList = string.Join("\n", workloadData.Select(m =>
                $"- {m.Name}: Weight={m.Weight}, Status={m.Status}, Tasks={m.TaskCount}"));

            var overloadedNames = overloaded.Count > 0
                ? string.Join(", ", overloaded.Select(m => m.Name))
                : "None";

            var availableNames = available.Count > 0
                ? string.Join(", ", available.Select(m => m.Name))
                : "None";

            var dataForAI = $@"Team Status for {today:dd/MM/yyyy}:

Completed Yesterday: {completedYesterday.Count} tasks
{completedList}

In Progress: {inProgress.Count} tasks
{inProgressList}

At Risk (deadline within 2 days): {atRisk.Count} tasks
{atRiskList}

Blocked: {blocked.Count} tasks
{blockedList}

Workload Status:
{workloadList}

Overloaded Members: {overloadedNames}
Available Members: {availableNames}";

            var apiKey = _configuration["Anthropic:ApiKey"];
            var prompt = $@"You are a helpful project management assistant. Generate a concise daily standup report for the Team Leader.

Here is the team data:
{dataForAI}

Generate a friendly, professional standup report:
- Start with ""Good morning! Here's your team update for {today:dd/MM/yyyy}:""
- Use emojis for visual clarity
- Completed tasks summary
- In progress tasks
- At risk items with urgency
- Blocked items
- Workload overview
- 2-3 specific actionable recommendations

Keep it concise but informative. Use bullet points.";

            var requestBody = new
            {
                model = "claude-sonnet-4-20250514",
                max_tokens = 1000,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8, "application/json"
            );

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return "Failed to generate standup report";

            var jsonDoc = JsonDocument.Parse(content);
            var report = jsonDoc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString() ?? "No report generated";

            return report;
        }

        public async Task SendStandupToLeaders()
        {
            var report = await GenerateStandupReport();

            // أرسل للـ TeamLeader والـ Admin
            var leaders = await _context.Users
                .Where(u => _context.UserRoles
                    .Join(_context.Roles,
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => new { ur.UserId, r.Name })
                    .Any(x => x.UserId == u.Id &&
                        (x.Name == "TeamLeader" || x.Name == "Admin")))
                .ToListAsync();

            foreach (var leader in leaders)
            {
                await _notificationService.CreateAsync(
                    leader.Id,
                    "🧠 AI Daily Standup Report",
                    report,
                    "daily_standup"
                );
            }
        }
    }
}