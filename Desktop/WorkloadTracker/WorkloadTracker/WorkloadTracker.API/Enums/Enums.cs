namespace WorkloadTracker.API.Enums
{
    public enum Priority
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum Complexity
    {
        Simple,
        Medium,
        Complex
    }

    public enum TaskStatus
    {
        New,
        InProgress,
        Blocked,
        Done
    }

    public enum ChangeRequestStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum ChangeRequestType
    {
        ChangeOwner,
        ChangeDueDate,
        IncreaseEffort
    }
}