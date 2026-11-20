using WorkloadTracker.API.Enums;

namespace WorkloadTracker.API.Models
{
    public class TaskStatusHistory
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public TaskItem TaskItem { get; set; } = null!;
        public Enums.TaskStatus OldStatus { get; set; }
        public Enums.TaskStatus NewStatus { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        public string ChangedByUserId { get; set; } = string.Empty;
    }
}