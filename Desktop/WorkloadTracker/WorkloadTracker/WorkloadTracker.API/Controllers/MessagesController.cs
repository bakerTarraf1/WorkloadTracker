using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.Models;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Member")]
    public class MessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public MessagesController(AppDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // جيب كل المحادثات
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var conversations = messages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g =>
                {
                    var lastMsg = g.First();
                    var otherUser = lastMsg.SenderId == userId ? lastMsg.Receiver : lastMsg.Sender;
                    return new
                    {
                        UserId = otherUser.Id,
                        FullName = otherUser.FullName,
                        LastMessage = lastMsg.Content,
                        LastMessageAt = lastMsg.CreatedAt,
                        UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                    };
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToList();

            return Ok(conversations);
        }

        // جيب رسائل محادثة معينة
        [HttpGet("{otherUserId}")]
        public async Task<IActionResult> GetMessages(string otherUserId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m =>
                    (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                    (m.SenderId == otherUserId && m.ReceiverId == userId))
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.Content,
                    m.CreatedAt,
                    m.IsRead,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.FullName,
                    IsMine = m.SenderId == userId
                })
                .ToListAsync();

            // Mark as read
            var unread = await _context.Messages
                .Where(m => m.SenderId == otherUserId && m.ReceiverId == userId && !m.IsRead)
                .ToListAsync();
            unread.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();

            return Ok(messages);
        }

        // إرسال رسالة
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // تأكد إن الـ Receiver هو Member
            var receiver = await _context.Users
                .Where(u => u.Id == dto.ReceiverId &&
                    _context.UserRoles
                        .Join(_context.Roles,
                            ur => ur.RoleId,
                            r => r.Id,
                            (ur, r) => new { ur.UserId, r.Name })
                        .Any(x => x.UserId == u.Id && x.Name == "Member"))
                .FirstOrDefaultAsync();

            if (receiver == null)
                return BadRequest(new { message = "Can only message other Members" });

            var message = new Message
            {
                SenderId = userId!,
                ReceiverId = dto.ReceiverId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // إشعار للمستلم
            var sender = await _context.Users.FindAsync(userId);
            await _notificationService.CreateAsync(
                dto.ReceiverId,
                $"💬 New Message from {sender?.FullName}",
                dto.Content.Length > 50 ? dto.Content[..50] + "..." : dto.Content,
                "new_message"
            );

            return Ok(new { message = "Message sent", id = message.Id });
        }

        // عدد الرسائل غير المقروءة
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var count = await _context.Messages
                .CountAsync(m => m.ReceiverId == userId && !m.IsRead);
            return Ok(new { count });
        }

        // جيب كل الـ Members عشان تراسلهم
        [HttpGet("members")]
        public async Task<IActionResult> GetMembers()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var members = await _context.Users
                .Where(u => u.Id != userId &&
                    _context.UserRoles
                        .Join(_context.Roles,
                            ur => ur.RoleId,
                            r => r.Id,
                            (ur, r) => new { ur.UserId, r.Name })
                        .Any(x => x.UserId == u.Id && x.Name == "Member"))
                .Select(u => new { u.Id, u.FullName, u.Email })
                .ToListAsync();

            return Ok(members);
        }
    }

    public class SendMessageDto
    {
        public string ReceiverId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}