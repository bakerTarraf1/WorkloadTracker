using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WorkloadTracker.API.Models;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;

        // تخزين الأكواد مؤقتاً بالـ Memory
        private static readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)>
            _resetCodes = new();

        public AuthController(
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            EmailService emailService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _emailService = emailService;
        }

        // ===== Register =====
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var user = new User
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var role = dto.Role ?? "Member";
            if (!await _roleManager.RoleExistsAsync(role))
                role = "Member";

            await _userManager.AddToRoleAsync(user, role);
            return Ok(new { message = "User registered successfully" });
        }

        // ===== Login =====
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                return Unauthorized(new { message = "Invalid credentials" });

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateToken(user, roles);

            return Ok(new
            {
                token,
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = roles.FirstOrDefault()
            });
        }

        // ===== Forgot Password — إرسال الكود =====
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);

            // دايماً نرجع نفس الرسالة عشان ما نكشف إذا الإيميل موجود
            if (user == null)
                return Ok(new { message = "If this email exists, a reset code has been sent." });

            // توليد كود 6 أرقام
            var code = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(10);

            // حفظ الكود
            _resetCodes[dto.Email.ToLower()] = (code, expiry);

            // إرسال الـ Email
            try
            {
                await _emailService.SendResetCodeAsync(dto.Email, code, user.FullName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to send email. Please try again.", error = ex.Message });
            }

            return Ok(new { message = "If this email exists, a reset code has been sent." });
        }

        // ===== Verify Code =====
        [HttpPost("verify-code")]
        public IActionResult VerifyCode([FromBody] VerifyCodeDto dto)
        {
            var key = dto.Email.ToLower();

            if (!_resetCodes.TryGetValue(key, out var stored))
                return BadRequest(new { message = "Invalid or expired code" });

            if (stored.Expiry < DateTime.UtcNow)
            {
                _resetCodes.TryRemove(key, out _);
                return BadRequest(new { message = "Code has expired. Please request a new one." });
            }

            if (stored.Code != dto.Code)
                return BadRequest(new { message = "Incorrect code. Please try again." });

            return Ok(new { message = "Code verified successfully" });
        }

        // ===== Reset Password =====
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var key = dto.Email.ToLower();

            // تحقق من الكود مرة ثانية
            if (!_resetCodes.TryGetValue(key, out var stored))
                return BadRequest(new { message = "Invalid or expired code" });

            if (stored.Expiry < DateTime.UtcNow)
            {
                _resetCodes.TryRemove(key, out _);
                return BadRequest(new { message = "Code has expired. Please request a new one." });
            }

            if (stored.Code != dto.Code)
                return BadRequest(new { message = "Incorrect code" });

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return BadRequest(new { message = "User not found" });

            // Reset الـ Password
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

            if (!result.Succeeded)
                return BadRequest(new { message = "Failed to reset password", errors = result.Errors });

            // احذف الكود بعد الاستخدام
            _resetCodes.TryRemove(key, out _);

            return Ok(new { message = "Password reset successfully! You can now login." });
        }

        // ===== Generate Token =====
        private string GenerateToken(User user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, user.FullName)
            };

            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Member";
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyCodeDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}