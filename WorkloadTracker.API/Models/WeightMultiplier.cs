namespace WorkloadTracker.API.Models
{
    public class WeightMultiplier
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty; // "Priority" or "Complexity"
        public string Name { get; set; } = string.Empty; // "Low", "High", "Simple"...
        public double Multiplier { get; set; }
    }
}