
namespace server.Models;

public class PlayerState
{
    public string PlayerId { get; set; } = string.Empty;
    public string Name { get; set; } = "Khách tham quan";
    public string AvatarId { get; set; } = "block-explorer";
    public float X { get; set; }
    public float Y { get; set; } = 1.68f;
    public float Z { get; set; }
    public float DirX { get; set; }   // hướng nhìn X
    public float DirZ { get; set; } = -1f;   // hướng nhìn Z
    public string Area { get; set; } = "grounds";
    public string? FocusedPoster { get; set; }
    public bool Seated { get; set; }
    public bool Jumping { get; set; }
    public bool Sprinting { get; set; }
    public long TickId { get; set; }  // tick mà state này được tính
}
