using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,TeamLeader")]
    public class StandupController : ControllerBase
    {
        private readonly DailyStandupService _standupService;

        public StandupController(DailyStandupService standupService)
        {
            _standupService = standupService;
        }

        [HttpGet("generate")]
        public async Task<IActionResult> Generate()
        {
            var report = await _standupService.GenerateStandupReport();
            return Ok(new { report });
        }

        [HttpPost("send")]
        public async Task<IActionResult> Send()
        {
            await _standupService.SendStandupToLeaders();
            return Ok(new { message = "Standup report sent successfully!" });
        }
    }
}