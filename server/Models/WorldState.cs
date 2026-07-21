
namespace server.Models;

public class WorldState
{
    public string Type { get; set; } = "snapshot";
    public long TickId { get; set; }
    public bool DoorOpen { get; set; }
    public List<PlayerState> Players { get; set; } = new();
}


public class PlayerEvent
{
    public string PlayerId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public long Tick { get; set; }
}
