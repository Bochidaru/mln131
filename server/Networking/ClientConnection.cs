using System.Net.WebSockets;
using server.Models;

namespace server.Networking;

public sealed class ClientConnection(string id, WebSocket socket)
{
    public string Id { get; } = id;
    public WebSocket Socket { get; } = socket;
    public SemaphoreSlim SendLock { get; } = new(1, 1);

    // State hiện tại của player
    public PlayerState State { get; } = new() { PlayerId = id };
    public Dictionary<int, DateTimeOffset> QuizCooldowns { get; } = new();
}

