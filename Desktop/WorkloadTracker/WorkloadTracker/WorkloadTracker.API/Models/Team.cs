namespace WorkloadTracker.API.Models
{
    public class Team
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    }
}