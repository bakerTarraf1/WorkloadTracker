using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.Enums;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly AppDbContext _context;

        public AIController(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            AppDbContext context)
        {
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            _context = context;
        }

        // AI Task Generator
        [HttpPost("generate-tasks")]
        public async Task<IActionResult> GenerateTasks([FromBody] GenerateTasksDto dto)
        {
            var apiKey = _configuration["Anthropic:ApiKey"];

            var requestBody = new
            {
                model = "claude-sonnet-4-20250514",
                max_tokens = 1000,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = $@"You are a project management expert. Based on this project description, generate 5-8 tasks.

Project: ""{dto.Prompt}""

Return ONLY a JSON array, no other text, no markdown:
[
  {{
    ""title"": ""Task title"",
    ""description"": ""Brief description"",
    ""priority"": 0,
    ""complexity"": 0,
    ""effortHours"": 4
  }}
]

Priority values: 0=Low, 1=Medium, 2=High, 3=Critical
Complexity values: 0=Simple, 1=Medium, 2=Complex"
                    }
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
                return BadRequest(new { message = "AI request failed", details = content });

            var jsonDoc = JsonDocument.Parse(content);
            var text = jsonDoc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            return Ok(new { result = text });
        }

        // AI Smart Assigner
        [HttpPost("suggest-assignee")]
        [Authorize(Roles = "Admin,TeamLeader")]
        public async Task<IActionResult> SuggestAssignee([FromBody] SuggestAssigneeDto dto)
        {
            var apiKey = _configuration["Anthropic:ApiKey"];

            // جيب كل الـ Members
            var members = await _context.Users
                .Where(u => _context.UserRoles
                    .Join(_context.Roles,
                        ur => ur.RoleId,
                        r => r.Id,
                        (ur, r) => new { ur.UserId, r.Name })
                    .Any(x => x.UserId == u.Id && x.Name == "Member"))
                .ToListAsync();

            if (!members.Any())
                return BadRequest(new { message = "No members found in the system" });

            // جيب الـ Workload الحالي
            var today = DateTime.UtcNow;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
            var endOfWeek = startOfWeek.AddDays(6);

            var multipliers = await _context.WeightMultipliers.ToListAsync();
            var weekTasks = await _context.Tasks
                .Where(t => t.StartDate <= endOfWeek && t.DueDate >= startOfWeek)
                .ToListAsync();

            // جيب كل المهام المنجزة مرة وحدة
          var doneTasks = await _context.Tasks
    .Where(t => t.Status == Enums.TaskStatus.Done)
    .ToListAsync();

            // احسب بيانات كل Member
            var memberData = members.Select(m =>
            {
                var memberWeekTasks = weekTasks.Where(t => t.AssignedUserId == m.Id).ToList();
                var totalWeight = memberWeekTasks.Sum(t =>
                    t.EffortHours *
                    (multipliers.FirstOrDefault(x => x.Type == "Complexity" && x.Name == t.Complexity.ToString())?.Multiplier ?? 1.0) *
                    (multipliers.FirstOrDefault(x => x.Type == "Priority" && x.Name == t.Priority.ToString())?.Multiplier ?? 1.0)
                );

                var similarTasks = doneTasks.Count(t =>
                    t.AssignedUserId == m.Id && (
                    t.Title.Contains(dto.TaskTitle, StringComparison.OrdinalIgnoreCase) ||
                    t.Description.Contains(dto.TaskTitle, StringComparison.OrdinalIgnoreCase))
                );

                return new
                {
                    Id = m.Id,
                    Name = m.FullName,
                    CurrentWeight = Math.Round(totalWeight, 1),
                    CurrentTasks = memberWeekTasks.Count,
                    CompletedSimilarTasks = similarTasks,
                    WorkloadStatus = totalWeight <= 15 ? "Available" :
                                    totalWeight <= 25 ? "Moderate" : "Overloaded"
                };
            }).ToList();

            // بناء الـ Prompt
            var membersInfo = string.Join("\n", memberData.Select(m =>
                $"- {m.Name} (ID: {m.Id}): Weight={m.CurrentWeight}, Tasks={m.CurrentTasks}, Status={m.WorkloadStatus}, SimilarTasksDone={m.CompletedSimilarTasks}"));

            var prompt = $@"You are a smart project manager assistant. Based on the team data below, suggest the best person to assign this task.

Task: ""{dto.TaskTitle}""
Description: ""{dto.TaskDescription}""
Priority: {dto.Priority}
Complexity: {dto.Complexity}
Effort Hours: {dto.EffortHours}

Team Members Data:
{membersInfo}

Return ONLY a JSON object, no markdown, no extra text:
{{
  ""suggestedUserId"": ""exact user id from the list"",
  ""suggestedName"": ""their name"",
  ""reason"": ""brief explanation why this person is best (2-3 sentences)"",
  ""alternativeUserId"": ""second best user id"",
  ""alternativeName"": ""second best name"",
  ""warning"": null
}}";

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
                return BadRequest(new { message = "AI request failed", details = content });

            var jsonDoc = JsonDocument.Parse(content);
            var text = jsonDoc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            var jsonMatch = System.Text.RegularExpressions.Regex.Match(
                text ?? "", @"\{[\s\S]*\}");

            if (!jsonMatch.Success)
                return Ok(new { result = text });

            var suggestion = JsonDocument.Parse(jsonMatch.Value);

            return Ok(new
            {
                suggestion = suggestion.RootElement,
                memberData
            });
        }
    }

    public class GenerateTasksDto
    {
        public string Prompt { get; set; } = string.Empty;
    }

    public class SuggestAssigneeDto
    {
        public string TaskTitle { get; set; } = string.Empty;
        public string TaskDescription { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Complexity { get; set; } = string.Empty;
        public double EffortHours { get; set; }
    }
}