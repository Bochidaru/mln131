using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using server.Protocol;
using server.Models;

namespace server.Networking;

public sealed class ConnectionManager
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ConcurrentDictionary<string, ClientConnection> _clients = new();
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();
    private readonly ILogger<ConnectionManager> _logger;

    public int OnlineCount => _rooms.Values.Sum(room => room.PlayerCount);
    public const int tickRate = 32;
    private readonly DuelManager _duels;

    public ConnectionManager(ILogger<ConnectionManager> logger, GameRoomFactory factory, DuelManager duels)
    {
        _logger = logger;
        _duels = duels;
        var defaultRoom = factory.Create("Room-1", tickRate);
        _rooms[defaultRoom.Id] = defaultRoom;
        defaultRoom.Start();
    }

    public AdminStatusSnapshot GetAdminStatus() => new(
        OnlineCount,
        _rooms.Values.SelectMany(room => room.GetAdminPlayers()).OrderByDescending(player => player.Score).ThenBy(player => player.Name, StringComparer.OrdinalIgnoreCase).ToArray(),
        _duels.GetAdminDuels());

    public async Task<bool> KickPlayerAsync(string playerId, CancellationToken cancellationToken)
    {
        foreach (var room in _rooms.Values)
        {
            if (await room.KickPlayerAsync(playerId, cancellationToken)) return true;
        }
        return false;
    }

    public async Task<bool> SetGuideAsync(string playerId, bool isGuide, CancellationToken cancellationToken)
    {
        foreach (var room in _rooms.Values)
        {
            if (await room.SetGuideAsync(playerId, isGuide, cancellationToken)) return true;
        }
        return false;
    }

    public async Task<bool> AwardPointsAsync(string playerId, int amount, CancellationToken cancellationToken)
    {
        foreach (var room in _rooms.Values)
        {
            if (await room.AwardPointsAsync(playerId, amount, cancellationToken)) return true;
        }
        return false;
    }


    public async Task HandleAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var connection = new ClientConnection(Guid.NewGuid().ToString("N"), socket);
        var room = _rooms["Room-1"];

        try
        {
            var joinMessage = await ReceiveJoinMessageAsync(socket, cancellationToken);
            if (joinMessage?.Type != "join")
            {
                await SendAsync(socket, new ServerMessage("joinRejected", Payload: new { reason = "Yêu cầu tham gia không hợp lệ." }), cancellationToken);
                return;
            }

            if (!room.TryJoin(connection, joinMessage.Payload, out var rejectionReason))
            {
                await SendAsync(socket, new ServerMessage("joinRejected", Payload: new { reason = rejectionReason }), cancellationToken);
                return;
            }

            _clients[connection.Id] = connection;
            _logger.LogInformation("Player {PlayerId} connected", connection.Id);
            await room.AddPlayer(connection, cancellationToken);
        }
        finally
        {
            _clients.TryRemove(connection.Id, out _);
            _logger.LogInformation("Player {PlayerId} disconnected", connection.Id);
        }
    }

    private static async Task<ClientMessage?> ReceiveJoinMessageAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[4096];
        using var stream = new MemoryStream();
        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, cancellationToken);
            if (result.MessageType != WebSocketMessageType.Text) return null;
            stream.Write(buffer, 0, result.Count);
            if (result.EndOfMessage)
            {
                try { return JsonSerializer.Deserialize<ClientMessage>(Encoding.UTF8.GetString(stream.ToArray()), JsonOptions); }
                catch (JsonException) { return null; }
            }
        }
    }

    private static async Task SendAsync(WebSocket socket, ServerMessage message, CancellationToken cancellationToken)
    {
        var payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message, JsonOptions));
        await socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
    }
}

public sealed record AdminStatusSnapshot(int OnlineCount, IReadOnlyList<PlayerAdminSnapshot> Players, IReadOnlyList<DuelAdminSnapshot> Duels);


    // private async Task ReceiveLoopAsync(ClientConnection connection, CancellationToken cancellationToken)
    // {
    //     while (connection.Socket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
    //     {
    //         var rawMessage = await ReceiveTextAsync(connection.Socket, cancellationToken);
    //         if (rawMessage is null) break;

    //         PlayerInput? input;
    //         try
    //         {
    //             input = JsonSerializer.Deserialize<PlayerInput>(rawMessage, JsonOptions);
    //         }
    //         catch (JsonException)
    //         {
    //             continue;
    //         }

    //         if (input != null)
    //         {
    //             connection.InputQueue.Enqueue(input);
    //         }
    //     }
    // }

    // private static async Task<string?> ReceiveTextAsync(WebSocket socket, CancellationToken cancellationToken)
    // {
    //     var buffer = new byte[4096];
    //     using var stream = new MemoryStream();

    //     while (true)
    //     {
    //         var result = await socket.ReceiveAsync(buffer, cancellationToken);
    //         if (result.MessageType == WebSocketMessageType.Close)
    //         {
    //             if (socket.State == WebSocketState.CloseReceived)
    //             {
    //                 await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "Closing", cancellationToken);
    //             }

    //             return null;
    //         }

    //         if (result.MessageType != WebSocketMessageType.Text)
    //         {
    //             return null;
    //         }

    //         stream.Write(buffer, 0, result.Count);
    //         if (result.EndOfMessage)
    //         {
    //             return Encoding.UTF8.GetString(stream.ToArray());
    //         }
    //     }
    // }

    // private Task RouteAsync(ClientConnection sender, ClientMessage message, CancellationToken cancellationToken)
    // {
    //     var serverMessage = new ServerMessage(message.Type, sender.Id, message.Payload);
    //     return BroadcastAsync(serverMessage, exceptPlayerId: sender.Id, cancellationToken);
    // }

    // private async Task BroadcastAsync(ServerMessage message, string? exceptPlayerId, CancellationToken cancellationToken)
    // {
    //     var sends = _clients.Values
    //         .Where(client => client.Id != exceptPlayerId && client.Socket.State == WebSocketState.Open)
    //         .Select(client => SendAsync(client, message, cancellationToken));

    //     await Task.WhenAll(sends);
    // }

    // private static async Task SendAsync(ClientConnection connection, ServerMessage message, CancellationToken cancellationToken)
    // {
    //     var json = JsonSerializer.Serialize(message, JsonOptions);
    //     var payload = Encoding.UTF8.GetBytes(json);

    //     await connection.SendLock.WaitAsync(cancellationToken);
    //     try
    //     {
    //         if (connection.Socket.State == WebSocketState.Open)
    //         {
    //             await connection.Socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
    //         }
    //     }
    //     finally
    //     {
    //         connection.SendLock.Release();
    //     }
    // }
