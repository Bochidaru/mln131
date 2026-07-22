using System.Net.WebSockets;
using server.Models;
using System.Text;
using System.Text.Json;

namespace server.Networking;

public sealed class ClientConnection(string id, WebSocket socket)
{
    public string Id { get; } = id;
    public string BaseName { get; set; } = "Khách tham quan";
    public WebSocket Socket { get; } = socket;
    public SemaphoreSlim SendLock { get; } = new(1, 1);
    public HashSet<string> OwnedUltimateSkills { get; } = new(StringComparer.Ordinal) { UltimateSkillCatalog.DefaultSkillId };
    public string EquippedUltimateSkill { get; set; } = UltimateSkillCatalog.DefaultSkillId;

    // State hiện tại của player
    public PlayerState State { get; } = new() { PlayerId = id };
    public Dictionary<int, DateTimeOffset> QuizCooldowns { get; } = new();

    public async Task SendAsync(string type, object payload, CancellationToken token)
    {
        var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { type, payload }, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        await SendLock.WaitAsync(token);
        try { if (Socket.State == WebSocketState.Open) await Socket.SendAsync(bytes, WebSocketMessageType.Text, true, token); }
        finally { SendLock.Release(); }
    }
}

