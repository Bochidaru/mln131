
namespace server.Models;

public class PlayerPoseMessage
{
    public float X { get; set; }
    public float Y { get; set; } = 1.68f;
    public float Z { get; set; }
    public float DirX { get; set; }
    public float DirZ { get; set; } = -1f;
    public string Area { get; set; } = "grounds";
    public string? FocusedPoster { get; set; }
    public bool Seated { get; set; }
    public int Pose { get; set; }
    public long Timestamp { get; set; }
}
