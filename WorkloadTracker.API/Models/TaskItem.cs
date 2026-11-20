using WorkloadTracker.API.Enums;

namespace WorkloadTracker.API.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssignedUserId { get; set; } = string.Empty;
        public User AssignedUser { get; set; } = null!;
        public Priority Priority { get; set; }
        public Complexity Complexity { get; set; }
        public double EffortHours { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public Enums.TaskStatus Status { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public ICollection<TaskStatusHistory> StatusHistories { get; set; } = new List<TaskStatusHistory>();
        public ICollection<ChangeRequest> ChangeRequests { get; set; } = new List<ChangeRequest>();
    }
}