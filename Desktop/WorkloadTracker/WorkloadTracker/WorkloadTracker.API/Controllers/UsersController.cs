using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Models;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<User> _userManager;

        public UsersController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userManager.Users
                .Select(u => new { u.Id, u.FullName, u.Email })
                .ToListAsync();

            var result = new List<object>();
            foreach (var u in users)
            {
                var user = await _userManager.FindByIdAsync(u.Id);
                var roles = await _userManager.GetRolesAsync(user!);
                result.Add(new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    Role = roles.FirstOrDefault() ?? "No Role"
                });
            }
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                Role = roles.FirstOrDefault() ?? "No Role"
            });
        }

        [HttpPut("{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ChangeRole(string id, [FromBody] ChangeRoleDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
            return Ok(new { message = "Role updated successfully" });
        }

        [HttpPut("{id}/name")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateName(string id, [FromBody] UpdateNameDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            user.FullName = dto.FullName;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Name updated successfully" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            await _userManager.DeleteAsync(user);
            return Ok(new { message = "User deleted" });
        }
    }

    public class ChangeRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateNameDto
    {
        public string FullName { get; set; } = string.Empty;
    }
}