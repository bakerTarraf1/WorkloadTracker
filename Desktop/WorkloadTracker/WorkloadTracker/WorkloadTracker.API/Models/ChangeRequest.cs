using WorkloadTracker.API.Enums;

namespace WorkloadTracker.API.Models
{
    public class ChangeRequest
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public TaskItem TaskItem { get; set; } = null!;
        public string RequestedByUserId { get; set; } = string.Empty;
        public ChangeRequestType Type { get; set; }
        public string NewValue { get; set; } = string.Empty;
        public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
    }
}